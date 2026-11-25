import { supabase } from './supabase';

// Reads the signed-in user's role and department from the profiles table.
// Returns null if the account has no profile yet.
export const loadProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, department_id')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
};