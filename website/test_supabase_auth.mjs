import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olvctcjnlmcrspoyhfrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_GPU-eMQjVEf8fQ7FJ9Xclw_L_A3i0MZ';

console.log('Testing Supabase Client connection...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('\n--- 1. Testing Database Query (hospitals table) ---');
  const { data: hospitals, error: hspError } = await supabase.from('hospitals').select('*').limit(5);
  if (hspError) {
    console.error('Hospitals query failed:', hspError);
  } else {
    console.log('Hospitals query success! Found records:', hospitals.length);
    console.log(hospitals);
  }

  console.log('\n--- 2. Testing Database Query (doctors table) ---');
  const { data: doctors, error: docError } = await supabase.from('doctors').select('*').limit(5);
  if (docError) {
    console.error('Doctors query failed:', docError);
  } else {
    console.log('Doctors query success! Found records:', doctors.length);
    console.log(doctors);
  }

  console.log('\n--- 3. Testing Supabase Auth (Sign Up & Sign In) ---');
  const testEmail = `patient_test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log(`Attempting signup for ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Patient',
        role: 'patient',
        phone: '+91 9876543210'
      }
    }
  });

  if (signUpError) {
    console.error('Sign Up Error:', signUpError);
  } else {
    console.log('Sign Up SUCCESS! User ID:', signUpData?.user?.id);
    console.log('Session established:', Boolean(signUpData?.session));

    console.log('\nAttempting signin with same credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('Sign In Error:', signInError);
    } else {
      console.log('Sign In SUCCESS! Session token exists:', Boolean(signInData?.session?.access_token));
      console.log('Logged in user:', signInData?.user?.email);
    }
  }
}

runTests().catch(console.error);
