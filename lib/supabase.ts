import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  supabaseUrl !== "https://your-project.supabase.co" && 
  Boolean(supabaseAnonKey) && 
  supabaseAnonKey !== "your-anon-key-here";

// Lazy-initialization or safe export to prevent compile/startup crash when variables are placeholder
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Single-use custom singer session handles, keeping metadata lightweight
      }
    })
  : null;
