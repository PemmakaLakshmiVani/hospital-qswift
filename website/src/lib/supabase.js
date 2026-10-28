import { createClient } from '@supabase/supabase-js';

// Read public credentials from Vite env
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Handle Android WebView / Emulator / Physical Device host mapping
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isEmulator = /sdk_gphone|google_sdk|Emulator|generic/i.test(navigator.userAgent);
  if (isAndroid) {
    if (isEmulator && supabaseUrl.includes('localhost:4000')) {
      supabaseUrl = supabaseUrl.replace('localhost:4000', '10.0.2.2:4000');
    } else if (!isEmulator && supabaseUrl.includes('localhost:4000')) {
      const savedHost = window.localStorage ? window.localStorage.getItem('hqswift_custom_backend_url') : null;
      if (savedHost) {
        supabaseUrl = savedHost;
      } else {
        supabaseUrl = supabaseUrl.replace('localhost:4000', '172.18.100.77:4000');
      }
    }
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

if (!isSupabaseConfigured) {
  console.info(
    'Hospital Qswift: Running in Local Mode (No Supabase credentials in .env). Connect Supabase by setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

/**
 * Fetch linked user profile from Supabase 'profiles' table
 */
export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Could not fetch user profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error fetching user profile from Supabase:', err);
    return null;
  }
}

/**
 * Fallback manually insert profile if trigger was bypassed
 */
export async function createUserProfile(profileData) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to create user profile:', err);
    return null;
  }
}

