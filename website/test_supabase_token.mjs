import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://olvctcjnlmcrspoyhfrv.supabase.co';
const supabaseAnonKey = 'sb_publishable_GPU-eMQjVEf8fQ7FJ9Xclw_L_A3i0MZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTokenAndProfile() {
  console.log('Testing Token generation and real-time query...');
  const testToken = {
    id: `tok-${Date.now()}`,
    hospital_id: 'a1111111-1111-1111-1111-111111111111',
    doctor_id: 'b1111111-1111-1111-1111-111111111111',
    patient_name: 'Lakshmi Vani',
    token_number: 99,
    status: 'waiting',
    is_priority: false,
    queue_date: new Date().toISOString().split('T')[0],
    booking_type: 'on_the_spot',
    joined_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('queue_tokens').insert([testToken]).select();
  if (error) {
    console.error('Failed to insert token:', error);
  } else {
    console.log('Token inserted successfully into Supabase:', data);
  }

  const { data: allTokens, error: tokenErr } = await supabase.from('queue_tokens').select('*').limit(5);
  if (tokenErr) {
    console.error('Failed to fetch tokens:', tokenErr);
  } else {
    console.log('Successfully fetched queue tokens from Supabase! Count:', allTokens.length);
  }
}

testTokenAndProfile().catch(console.error);
