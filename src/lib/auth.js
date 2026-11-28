import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const DEVICE_KEY = 'smartsched_device_id';

// Reads the signed-in user's role and department from the profiles table.
export const loadProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, department_id')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
};

// A stable id for this phone, created once and kept on the device
export const getDeviceId = async () => {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

export const getDeviceLabel = () =>
  `${Platform.OS === 'android' ? 'Android' : 'iOS'} ${Platform.Version} · SmartSched app`;

// Signs in and records the attempt (success or failure) in login history.
// Logging never blocks the sign-in itself.
export const signInTracked = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  try {
    await supabase.rpc('record_login', {
      p_email: email,
      p_device_label: getDeviceLabel(),
      p_success: !error,
    });
  } catch (e) {
    // ignore logging errors
  }
  return { data, error };
};

// Marks this phone as active. Called when a session starts or is restored.
export const touchDevice = async () => {
  try {
    const deviceId = await getDeviceId();
    await supabase.rpc('touch_device', {
      p_device_id: deviceId,
      p_device_label: getDeviceLabel(),
    });
  } catch (e) {
    // ignore
  }
};

export const fetchLoginHistory = async () => {
  const { data, error } = await supabase
    .from('login_history')
    .select('created_at, success, device_label')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data || [];
};

export const fetchActiveDevices = async () => {
  const { data, error } = await supabase
    .from('user_devices')
    .select('device_id, device_label, last_seen')
    .order('last_seen', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

// Removes other devices from the list and signs them out on the server.
export const signOutOtherDevices = async () => {
  const deviceId = await getDeviceId();
  const { error: dbError } = await supabase.rpc('clear_other_devices', { p_device_id: deviceId });
  if (dbError) throw new Error(dbError.message);

  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw new Error(error.message);
};

// Checks the current password, then sets the new one.
export const changePassword = async (email, currentPassword, newPassword) => {
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) throw new Error('Current password is incorrect');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

// Forgot password: emails a 6-digit code to the account.
// TEMPORARY debug alert: remove the Alert line once the email arrives.
export const requestResetCode = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

// Checks the code. On success the user is signed in for the password reset.
export const verifyResetCode = async (email, code) => {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (error) throw new Error('That code is wrong or has expired. Request a new one.');
};

export const setNewPassword = async (password) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
};