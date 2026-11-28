import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sojsukhnibcubofnbuvq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SpfU_sHBLoWmGoUR3GIeNA_w4vkWSV9';

// Keeps the user signed in between app launches (token stored on the phone).
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});