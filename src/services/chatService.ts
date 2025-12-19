import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ChatMessage = Database['public']['Tables']['league_chat_messages']['Row'];
type ChatMention = Database['public']['Tables']['league_chat_mentions']['Row'];

export interface ChatMessageWithProfile {
  id: string;
  league_id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  reply_to_id: string | null;
  photo_url: string | null;
  photo_description: string | null;
  profile?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  mentions?: Array<{
    id: string;
    message_id: string;
    mentioned_user_id: string;
    created_at: string;
    mentioned_profile?: {
      id: string;
      username: string | null;
      avatar_url: string | null;
    };
  }>;
}

export interface ChatMessageInput {
  league_id: string;
  content: string;
  message_type?: 'text' | 'photo';
  reply_to_id?: string | null;
  photo_url?: string | null;
  photo_description?: string | null;
}

class ChatService {
  async sendMessage(input: ChatMessageInput & { user_id: string }): Promise<ChatMessage> {
    console.log('chatService.sendMessage called with:', input);
    
    const { data, error } = await supabase
      .from('league_chat_messages')
      .insert({
        user_id: input.user_id,
        league_id: input.league_id,
        content: input.content,
        message_type: input.message_type || 'text',
        reply_to_id: input.reply_to_id,
        photo_url: input.photo_url,
        photo_description: input.photo_description
      })
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Returning message data:', data);
    return data!;
  }

  async getMessages(leagueId: string, limit = 50): Promise<ChatMessageWithProfile[]> {
    const { data, error } = await supabase
      .from('league_chat_messages')
      .select(`
        *,
        profile:profiles(id, username, avatar_url),
        mentions:league_chat_mentions(*, mentioned_profile:profiles(id, username, avatar_url))
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    if (!data) return [];
    
    // Transform data to expected format, filtering out any query errors
    return data.map((msg: any): ChatMessageWithProfile => {
      const transformed: ChatMessageWithProfile = {
        id: msg.id,
        league_id: msg.league_id,
        user_id: msg.user_id,
        content: msg.content,
        message_type: msg.message_type,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        reply_to_id: msg.reply_to_id,
        photo_url: msg.photo_url,
        photo_description: msg.photo_description,
        profile: msg.profile && typeof msg.profile === 'object' && !('error' in msg.profile) ? {
          id: msg.profile.id || '',
          username: msg.profile.username || '',
          avatar_url: msg.profile.avatar_url || ''
        } : undefined,
        mentions: msg.mentions ? msg.mentions
          .filter((mention: any) => 
            mention.mentioned_profile && 
            typeof mention.mentioned_profile === 'object' && 
            !('error' in mention.mentioned_profile)
          )
          .map((mention: any): any => ({
            id: mention.id,
            message_id: mention.message_id,
            mentioned_user_id: mention.mentioned_user_id,
            created_at: mention.created_at,
            mentioned_profile: mention.mentioned_profile ? {
              id: mention.mentioned_profile.id || '',
              username: mention.mentioned_profile.username || '',
              avatar_url: mention.mentioned_profile.avatar_url || ''
            } : undefined
          })) : []
      };
      
      return transformed;
    });
  }

  async uploadPhoto(file: File, leagueId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${leagueId}/${Date.now()}.${fileExt}`;
    const filePath = `league-chat/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async createMentions(messageId: string, mentionedUserIds: string[]): Promise<void> {
    if (mentionedUserIds.length === 0) return;

    const mentions = mentionedUserIds.map(userId => ({
      message_id: messageId,
      mentioned_user_id: userId
    }));

    const { error } = await supabase
      .from('league_chat_mentions')
      .insert(mentions);

    if (error) throw error;
  }

  async getLeagueMembers(leagueId: string): Promise<Array<{ id: string; username: string | null; avatar_url: string | null }>> {
    const { data: membersData, error } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId);

    if (error) throw error;
    
    if (!membersData || membersData.length === 0) return [];

    const userIds = membersData.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    return profiles || [];
  }

  parseMentions(content: string): { content: string; mentionedUsernames: string[] } {
    const mentionRegex = /@(\w+)/g;
    const mentionedUsernames: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUsernames.push(match[1]);
    }

    return {
      content,
      mentionedUsernames
    };
  }

  formatMentionedContent(content: string, mentionedProfiles: Array<{ id: string; username: string | null; avatar_url: string | null }>): string {
    let formattedContent = content;
    
    mentionedProfiles.forEach(profile => {
      if (profile.username) {
        const mentionRegex = new RegExp(`@${profile.username}`, 'g');
        formattedContent = formattedContent.replace(mentionRegex, `**@${profile.username}**`);
      }
    });

    return formattedContent;
  }

  async subscribeToChatMessages(
    leagueId: string,
    callback: (message: ChatMessageWithProfile) => void
  ) {
    return supabase
      .channel(`league-chat-${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_chat_messages',
          filter: `league_id=eq.${leagueId}`
        },
        async (payload) => {
          const message = payload.new as ChatMessage;
          
          // Fetch profile and mentions for the new message
          const { data: messageWithDetails } = await supabase
            .from('league_chat_messages')
            .select(`
              *,
              profile:profiles(id, username, avatar_url),
              mentions:league_chat_mentions(*, mentioned_profile:profiles(id, username, avatar_url))
            `)
            .eq('id', message.id)
            .single();

          if (messageWithDetails) {
            // Transform data to expected format, filtering out query errors
            const transformed: ChatMessageWithProfile = {
              id: messageWithDetails.id,
              league_id: messageWithDetails.league_id,
              user_id: messageWithDetails.user_id,
              content: messageWithDetails.content,
              message_type: messageWithDetails.message_type,
              created_at: messageWithDetails.created_at,
              updated_at: messageWithDetails.updated_at,
              reply_to_id: messageWithDetails.reply_to_id,
              photo_url: messageWithDetails.photo_url,
              photo_description: messageWithDetails.photo_description,
              profile: messageWithDetails.profile && typeof messageWithDetails.profile === 'object' && !('error' in messageWithDetails.profile) ? {
                id: messageWithDetails.profile.id || '',
                username: messageWithDetails.profile.username || '',
                avatar_url: messageWithDetails.profile.avatar_url || ''
              } : undefined,
              mentions: messageWithDetails.mentions ? messageWithDetails.mentions
                .filter((mention: any) => 
                  mention.mentioned_profile && 
                  typeof mention.mentioned_profile === 'object' && 
                  !('error' in mention.mentioned_profile)
                )
                .map((mention: any): any => ({
                  id: mention.id,
                  message_id: mention.message_id,
                  mentioned_user_id: mention.mentioned_user_id,
                  created_at: mention.created_at,
                  mentioned_profile: mention.mentioned_profile ? {
                    id: mention.mentioned_profile.id,
                    username: mention.mentioned_profile.username,
                    avatar_url: mention.mentioned_profile.avatar_url
                  } : undefined
                })) : []
            };
            
            callback(transformed);
          }
        }
      )
      .subscribe();
  }
}

export const chatService = new ChatService();
