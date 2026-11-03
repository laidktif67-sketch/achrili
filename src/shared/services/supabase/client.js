import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL = 'https://cmvgeipqthurdbeizfvn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kuB0PCt85GcDcFbWTOZC7g_zE4UR3Xc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
