const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Function to update Supabase configuration
async function updateSupabaseConfig(publicUrl) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables');
    return;
  }

  console.log('Updating Supabase configuration...');
  
  try {
    // Update .env file with the public URL
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add VITE_APP_URL
    if (envContent.includes('VITE_APP_URL=')) {
      envContent = envContent.replace(
        /VITE_APP_URL=.*/,
        `VITE_APP_URL=${publicUrl}`
      );
    } else {
      envContent += `\nVITE_APP_URL=${publicUrl}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Updated .env with public URL');
    console.log('\nNext steps:');
    console.log(`1. Go to your Supabase Dashboard: https://app.supabase.com/`);
    console.log('2. Navigate to Authentication > URL Configuration');
    console.log('3. Update the following URLs:');
    console.log(`   - Site URL: ${publicUrl}`);
    console.log(`   - Redirect URLs: ${publicUrl}/auth/callback`);
    console.log(`   - Password Reset URL: ${publicUrl}/reset-password`);
    console.log('\nYour application will be available at:', publicUrl);
    console.log('\nTo stop the tunnel, press Ctrl+C');
  } catch (error) {
    console.error('Error updating configuration:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting ngrok tunnel...');
    
    // Start ngrok tunnel
    const ngrok = require('@ngrok/ngrok');
    
    // Create a session
    const session = await new ngrok.SessionBuilder()
      .authtokenFromEnv()
      .connect();
    
    // Create a tunnel
    const tunnel = await session.httpEndpoint()
      .domain('your-custom-domain.ngrok.io') // Optional: Use a custom domain if you have one
      .listen();
    
    const publicUrl = tunnel.url();
    console.log(`\n🚀 Tunnel created at: ${publicUrl}`);
    
    // Update Supabase configuration
    await updateSupabaseConfig(publicUrl);
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nClosing tunnel...');
      await tunnel.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error creating tunnel:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have an ngrok account at https://ngrok.com/');
    console.log('2. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('3. Set the NGROK_AUTH_TOKEN environment variable:');
    console.log('   - Windows: set NGROK_AUTH_TOKEN=your_auth_token');
    console.log('   - macOS/Linux: export NGROK_AUTH_TOKEN=your_auth_token');
    process.exit(1);
  }
}

main();
