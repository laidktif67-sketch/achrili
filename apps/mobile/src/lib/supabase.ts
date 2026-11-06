import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@achrili/api";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://cmvgeipqthurdbeizfvn.supabase.co";
const publishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_kuB0PCt85GcDcFbWTOZC7g_zE4UR3Xc";

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
