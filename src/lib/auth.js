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

// Checks the current password, then sets the new one.
export const changePassword = async (email, currentPassword, newPassword) => {
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) throw new Error('Current password is incorrect');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

// Signs out every other device. This device stays signed in.
export const signOutOtherDevices = async () => {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw new Error(error.message);
};