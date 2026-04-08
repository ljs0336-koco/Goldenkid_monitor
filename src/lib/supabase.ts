import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type User = {
  id: string;
  username: string;
  role: 'admin' | 'teacher';
};

export type Device = {
  id: string;
  user_id: string;
  device_id: string;
  alias: string | null;
  created_at: string;
};
