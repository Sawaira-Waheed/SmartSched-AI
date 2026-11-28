import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const DEVICE_KEY = 'smartsched_device_id';

// Checks the account. Unapproved accounts are signed out here, so no screen can be reached.
// Returns { profile, status }. profile is null unless the account is approved.
export const checkAccount = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role, department_id, status')
    .eq('id', userId)
    .single();

  if (error || !data) {
    await supabase.auth.signOut();
    return { profile: null, status: 'missing' };
  }
  if (data.status !== 'approved') {
    await supabase.auth.signOut();
    return { profile: null, status: data.status };
  }
  return { profile: data, status: 'approved' };
};

// True if a Registrar already exists (first-time setup is then closed)
export const registrarExists = async () => {
  const { data, error } = await supabase.rpc('registrar_exists');
  if (error) throw new Error(error.message);
  return !!data;
};

// First-time setup: creates the one Registrar account
export const registrarSignUp = async ({ name, email, password }) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, requested_role: 'registrar' } },
  });
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
};

// Registrar: add a HOD or Faculty account (runs on the server)
export const createAccount = async (payload) => {
  const { data, error } = await supabase.functions.invoke('create-account', { body: payload });
  if (error) {
    let message = error.message;
    try {
      const body = await error.context.json();
      message = body.error || message;
    } catch (e) {
      // keep the default message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

// Registrar: every account and its role
export const fetchPeople = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department_id, status')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data || [];
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
export const signInTracked = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  try {
    await supabase.rpc('record_login', {
      p_email: email,
      p_device_label: getDeviceLabel(),
      p_success: !error,
    });
  } catch (e) {
    // logging never blocks sign-in
  }
  return { data, error };
};

// Marks this phone as active
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

// Removes other devices from the list and signs them out on the server
export const signOutOtherDevices = async () => {
  const deviceId = await getDeviceId();
  const { error: dbError } = await supabase.rpc('clear_other_devices', { p_device_id: deviceId });
  if (dbError) throw new Error(dbError.message);

  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw new Error(error.message);
};

// Checks the current password, then sets the new one
export const changePassword = async (email, currentPassword, newPassword) => {
  const check = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error) throw new Error('Current password is incorrect');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

// Forgot password: emails a 6-digit code
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

// Calls an Edge Function and returns its error message on failure
const callFunction = async (name, body) => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const json = await error.context.json();
      message = json.error || message;
    } catch (e) {
      // keep the default message
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

export const manageAccount = (payload) => callFunction('manage-account', payload);

export const getMyUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
};

export const fetchMyProfile = async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, phone, role, department_id, email')
    .eq('id', auth.user.id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateMyProfile = async (name, phone) => {
  const { error } = await supabase.rpc('update_my_profile', { p_name: name, p_phone: phone });
  if (error) throw new Error(error.message);
};