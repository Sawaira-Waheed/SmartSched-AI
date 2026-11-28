import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { signInTracked, checkAccount } from '../lib/auth';

const STATUS_MESSAGE = {
  pending: 'Your account is waiting for Registrar approval.',
  rejected: 'Your request was not approved. Please contact the Registrar.',
  missing: 'This account is not set up yet. Please request access or contact the Registrar.',
};

const LoginScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const emailError = !submitted
    ? ''
    : !email.trim()
      ? 'Email is required'
      : !email.includes('@')
        ? 'Enter a valid email'
        : '';

  const passwordError = !submitted
    ? ''
    : !password
      ? 'Password is required'
      : password.length < 6
        ? 'Use at least 6 characters'
        : '';

  const handleSignIn = async () => {
    setSubmitted(true);
    setServerError('');

    const valid = email.trim() && email.includes('@') && password.length >= 6;
    if (!valid || loading) return;

    setLoading(true);
    try {
      const { data, error } = await signInTracked(email.trim(), password);
      if (error) {
        setServerError(
          error.message === 'Invalid login credentials' ? 'Email or password is incorrect' : error.message,
        );
        return;
      }

      // Unapproved accounts are signed out inside checkAccount
      const { profile, status } = await checkAccount(data.user.id);
      if (!profile) {
        setServerError(STATUS_MESSAGE[status] || STATUS_MESSAGE.missing);
        return;
      }

      navigation.replace('dashboard', {
        role: profile.role,
        name: profile.full_name,
        departmentId: profile.department_id,
      });
    } catch (e) {
      setServerError('Could not reach the server. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.brandWrap}>
          <View style={s.logo}>
            <Text style={s.logoText}>S</Text>
          </View>
          <Text style={s.brand}>
            SmartSched <Text style={s.brandAi}>AI</Text>
          </Text>
        </View>

        <Text style={s.heading}>Welcome back</Text>
        <Text style={s.subheading}>Sign in with your university account to continue.</Text>

        <View style={s.form}>
          <Text style={s.label}>University email</Text>
          <View style={[s.inputWrap, emailError && s.inputWrapError]}>
            <Text style={s.inputIcon}>@</Text>
            <TextInput
              style={s.input}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setServerError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {emailError ? <Text style={s.errorText}>{emailError}</Text> : null}

          <Text style={[s.label, { marginTop: 18 }]}>Password</Text>
          <View style={[s.inputWrap, passwordError && s.inputWrapError]}>
            <Text style={s.inputIcon}>•</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              placeholderTextColor={c.muted}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setServerError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={s.eyeBtn}>
              <Text style={s.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {passwordError ? <Text style={s.errorText}>{passwordError}</Text> : null}

          {serverError ? (
            <View style={s.serverBox}>
              <Text style={s.serverText}>{serverError}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => navigation.navigate('forgotpassword')} style={s.forgotRow}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            disabled={loading}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed, loading && s.busy]}
            onPress={handleSignIn}
          >
            {loading ? <ActivityIndicator color={c.white} /> : <Text style={s.primaryBtnText}>Sign in</Text>}
          </Pressable>
        </View>

        <View style={s.footerRow}>
          <Text style={s.footerText}>New here?</Text>
          <Pressable onPress={() => navigation.navigate('signup')} hitSlop={8}>
            <Text style={s.footerLink}> Request an account</Text>
          </Pressable>
        </View>

        <Text style={s.security}>🔒 Secure access to your scheduling system</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    busy: { opacity: 0.7 },

    brandWrap: { alignItems: 'center', marginBottom: 26 },
    logo: { width: 64, height: 64, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
    logoText: { color: c.white, fontSize: 30, fontWeight: '800' },
    brand: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 12, letterSpacing: 0.3 },
    brandAi: { color: c.primary },

    heading: { fontSize: 28, fontWeight: '800', color: c.text, textAlign: 'center' },
    subheading: { fontSize: 13, color: c.muted, textAlign: 'center', marginTop: 8, lineHeight: 19, marginBottom: 26 },

    form: { backgroundColor: c.surface, borderRadius: 26, padding: 22, ...shadow },
    label: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    inputWrapError: { borderColor: c.red },
    inputIcon: { fontSize: 15, fontWeight: '800', color: c.primary, width: 22, textAlign: 'center' },
    input: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 },
    eyeBtn: { paddingLeft: 10 },
    eyeText: { fontSize: 12, fontWeight: '800', color: c.primary },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, marginLeft: 4, fontWeight: '600' },

    serverBox: { backgroundColor: c.redSoft, borderRadius: 14, padding: 12, marginTop: 16 },
    serverText: { fontSize: 12, color: c.red, fontWeight: '700', lineHeight: 17 },

    forgotRow: { alignSelf: 'flex-end', marginTop: 12 },
    forgotText: { fontSize: 12, fontWeight: '800', color: c.primary },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 22,
      minHeight: 54,
      justifyContent: 'center',
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    security: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 24 },
  });