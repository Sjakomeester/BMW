import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Zonder instellingen toont de app een duidelijke melding in plaats van te crashen.
export const supabase = url && key ? createClient(url, key) : null;
