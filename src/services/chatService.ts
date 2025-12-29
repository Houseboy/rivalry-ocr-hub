import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ChatMessage = Database['public']['Tables']['league_chat_messages']['Row'];
type ChatMention = Database['public']['Tables']['league_chat_mentions']['Row'];
type ChatReaction = Database['public']['Tables']['league_chat_reactions']['Row'];

export interface ChatMessageWithProfile {
  id: string;
  league_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'photo';
  created_at: string;
  updated_at: string;
  reply_to_id?: string | null;
  photo_url?: string | null;
  photo_description?: string | null;
  profile?: {
    id: string;
    username: string;
    avatar_url: string;
    bio: string;
    created_at: string;
    favorite_team: string;
    playstyle: string;
    privacy_public: boolean;
    rank_points: number;
    theme_preference: string;
    updated_at: string;
    is_admin?: boolean;
  };
  mentions?: Array<{
    id: string;
    mentioned_user_id: string;
    created_at: string;
    mentioned_profile?: {
      id: string;
      username: string;
      avatar_url: string;
    };
  }>;
  reactions?: Array<{
    id: string;
    emoji: string;
    user_id: string;
    created_at: string;
    profile: {
      id: string;
      username: string;
      avatar_url: string;
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
    
    try {
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
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from Supabase');
        throw new Error('Failed to send message: No data returned');
      }
      
      console.log('Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async getMessages(leagueId: string, limit = 50): Promise<ChatMessageWithProfile[]> {
    const { data, error } = await supabase
      .from('league_chat_messages')
      .select(`
        *,
        profile:profiles!user_id(
          id,
          username,
          avatar_url,
          bio,
          created_at,
          favorite_team,
          playstyle,
          privacy_public,
          rank_points,
          theme_preference,
          updated_at,
          is_admin
        ),
        mentions:league_chat_mentions(*, mentioned_profile:profiles!mentioned_user_id(
          id,
          username,
          avatar_url
        ))
        -- Temporarily removed reactions query until table is created
      `)
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
    
    if (!data) return [];
    
    // Transform the data to match our interface
    return data.map((msg: any): ChatMessageWithProfile => {
      // Handle the profile data
      const profile = msg.profile ? {
        id: msg.profile.id,
        username: msg.profile.username,
        avatar_url: msg.profile.avatar_url,
        bio: msg.profile.bio || '',
        created_at: msg.profile.created_at,
        favorite_team: msg.profile.favorite_team || '',
        playstyle: msg.profile.playstyle || '',
        privacy_public: msg.profile.privacy_public || false,
        rank_points: msg.profile.rank_points || 0,
        theme_preference: msg.profile.theme_preference || 'light',
        updated_at: msg.profile.updated_at,
        is_admin: msg.profile.is_admin || false
      } : undefined;

      // Handle mentions
      const mentions = (msg.mentions || []).map((mention: any) => ({
        id: mention.id,
        message_id: mention.message_id,
        mentioned_user_id: mention.mentioned_user_id,
        created_at: mention.created_at,
        mentioned_profile: mention.mentioned_profile ? {
          id: mention.mentioned_profile.id,
          username: mention.mentioned_profile.username,
          avatar_url: mention.mentioned_profile.avatar_url
        } : undefined
      }));

      // Reactions are empty for now
      const reactions = [];

      return {
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
        profile,
        mentions,
        reactions
      };
    });
  }

  async uploadPhoto(file: File, leagueId: string): Promise<string> {
    console.log('uploadPhoto called with:', { fileName: file.name, fileSize: file.size, leagueId });
    
    try {
      // Validate file size (2MB limit for better UX)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error(`File size must be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
      }

      // Optimize image if needed
      const optimizedFile = await this.optimizeImage(file);
      
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `${leagueId}/${Date.now()}.${fileExt}`;
      const filePath = `league-chat/${fileName}`;

      console.log('Uploading optimized image to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('chat-photos')
        .upload(filePath, optimizedFile);

      console.log('Upload result:', { uploadError });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      throw error;
    }
  }

  // Optimize image for better performance and UI
  private async optimizeImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions based on device and file size
        const maxDimensions = this.getOptimalDimensions();
        let { width, height } = this.calculateDimensions(img.width, img.height, maxDimensions);

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // Fallback to original if optimization fails
            }
          },
          'image/jpeg',
          0.85 // Quality: 85%
        );
      };

      img.onerror = () => resolve(file); // Fallback to original if loading fails
      img.src = URL.createObjectURL(file);
    });
  }

  // Get optimal dimensions based on device
  private getOptimalDimensions(): { width: number; height: number } {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isMobile) {
      return { width: 300, height: 400 }; // Mobile optimized
    } else if (isTablet) {
      return { width: 400, height: 500 }; // Tablet optimized
    } else {
      return { width: 500, height: 600 }; // Desktop optimized
    }
  }

  // Calculate dimensions maintaining aspect ratio
  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxDimensions: { width: number; height: number }
  ): { width: number; height: number } {
    const { width: maxWidth, height: maxHeight } = maxDimensions;
    
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if necessary
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > height) {
        width = maxWidth;
        height = width / aspectRatio;
      } else {
        height = maxHeight;
        width = height * aspectRatio;
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
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
    console.log('chatService.subscribeToChatMessages called for league:', leagueId);
    
    try {
      const channel = supabase
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
            console.log('Real-time event received:', payload);
            const message = payload.new as ChatMessage;
            
            try {
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

              console.log('Fetched message details:', messageWithDetails);

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
                
                console.log('Calling callback with transformed message:', transformed);
                callback(transformed);
              } else {
                console.error('No message details found for ID:', message.id);
              }
            } catch (error) {
              console.error('Error processing real-time message:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
        });

      console.log('Real-time channel created:', channel);
      return channel;
    } catch (error) {
      console.error('Error creating real-time subscription:', error);
      throw error;
    }
  }

  // Add reaction methods
  async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('league_chat_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('league_chat_reactions')
        .delete()
        .match({
          message_id: messageId,
          user_id: userId,
          emoji
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('league_chat_messages')
        .delete()
        .match({
          id: messageId,
          user_id: userId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async adminDeleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('league_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error admin deleting message:', error);
      throw error;
    }
  }

  // Common emojis for reactions
  readonly commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '🙏'];
}

export const chatService = new ChatService();
