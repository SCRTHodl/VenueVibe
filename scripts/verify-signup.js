require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Verify environment variables
console.log('Checking environment variables...');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const tokenEconomySchema = process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    console.log('Testing Supabase connection...');
    
    // 1. Check if auth emails are configured
    console.log('\n1. Checking auth settings...');
    const { data: authSettings, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth settings:', authError.message);
    } else {
      console.log('✅ Auth admin API accessible');
    }
    
    // 2. Verify tables exist
    console.log('\n2. Checking required tables...');
    
    // Check users table
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    console.log(usersError ? '❌ users table error: ' + usersError.message : '✅ users table exists');
    
    // Check token_economy.tokens table
    const { data: tokensTable, error: tokensError } = await supabase
      .schema(tokenEconomySchema)
      .from('tokens')
      .select('user_id')
      .limit(1);
    
    console.log(tokensError ? `❌ ${tokenEconomySchema}.tokens table error: ` + tokensError.message : `✅ ${tokenEconomySchema}.tokens table exists`);
    
    // 3. Check SMTP configuration (if possible)
    console.log('\n3. Note about email verification:');
    console.log('Email verification requires proper SMTP configuration in the Supabase dashboard.');
    console.log('Check your Supabase project > Authentication > Email Templates to ensure emails are configured properly.');
    
    // 4. Test creating a dummy user
    console.log('\n4. Testing user creation process...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User';
    
    // First, create the user with auth
    const { data: authData, error: signupError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: { name: testName }
    });
    
    if (signupError) {
      console.error('❌ User creation failed:', signupError.message);
      return;
    }
    
    console.log('✅ Test user created in auth system:', authData.user.id);
    
    // Then, create user profile
    const userId = authData.user.id;
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: testEmail,
        name: testName,
        avatar_url: `https://api.dicebear.com/6.x/avataaars/svg?seed=${userId}`,
        is_admin: false,
      }]);
    
    console.log(profileError ? '❌ User profile creation failed: ' + profileError.message : '✅ User profile created successfully');
    
    // Finally, initialize token balance
    const { error: tokenError } = await supabase
      .schema(tokenEconomySchema)
      .from('tokens')
      .insert([{
        user_id: userId,
        balance: 50
      }]);
    
    console.log(tokenError ? '❌ Token balance initialization failed: ' + tokenError.message : '✅ Token balance initialized successfully');
    
    // Clean up the test user
    console.log('\nCleaning up test user...');
    await supabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user deleted');
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

main();
