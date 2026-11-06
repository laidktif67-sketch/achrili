import { createClient } from "@achrili/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cmvgeipqthurdbeizfvn.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_kuB0PCt85GcDcFbWTOZC7g_zE4UR3Xc";

// This singleton is used only by Client Components. It uses a publishable key,
// never a service-role or secret key; database access remains protected by RLS.
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
