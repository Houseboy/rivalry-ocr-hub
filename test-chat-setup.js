// Test script to verify chat database setup
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

async function testChatSetup() {
  console.log('Testing chat database setup...');
  
  try {
    // Test if league_chat_messages table exists
    const { data: messages, error: messagesError } = await supabase
      .from('league_chat_messages')
      .select('count')
      .limit(1);
    
    console.log('Messages table test:', { messages, messagesError });
    
    // Test if league_chat_mentions table exists
    const { data: mentions, error: mentionsError } = await supabase
      .from('league_chat_mentions')
      .select('count')
      .limit(1);
    
    console.log('Mentions table test:', { mentions, mentionsError });
    
    // Test if we can insert a message
    const testMessage = {
      user_id: 'test-user-id',
      league_id: 'test-league-id',
      content: 'Test message',
      message_type: 'text'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('league_chat_messages')
      .insert(testMessage)
      .select()
      .single();
    
    console.log('Insert test:', { insertResult, insertError });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testChatSetup();
