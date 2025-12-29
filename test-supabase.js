// Simple test to check Supabase connectivity
const SUPABASE_URL = "https://aemdvqmkdoxplqohmasj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbWR2cW1rZG94cGxxb2htYXNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTgwOTUsImV4cCI6MjA3NTAzNDA5NX0.fPPhEy6cRrYPptvysAj-rOH0M50uR9-WkriiEySiWQE";

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key exists:', !!SUPABASE_KEY);

// Test basic connectivity
fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);
  return response.text();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Network error:', error);
});
