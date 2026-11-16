import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/theme';

// DEMO: role used after sign-in. Replace with the role returned by the server.
const DEMO_ROLE = 'hod';

const LoginScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.trim()
    ? 'Email is required'
    : submitted && !email.includes('@')
      ? 'Enter a valid email'
      : '';

  const passwordError = submitted && !password
    ? 'Password is required'
    : submitted && password.length < 6
      ? 'Use at least 6 characters'
      : '';

  const handleSignIn = () => {
    setSubmitted(true);
    const valid = email.trim() && email.includes('@') && password.length >= 6;
    if (!valid) return;

    const name = email.split('@')[0];
    navigation.replace('dashboard', { role: DEMO_ROLE, name });
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* BRAND */}
        <View style={s.brandWrap}>
          <View style={s.logo}>
            <Text style={s.logoText}>S</Text>
          </View>
          <Text style={s.brand}>
            SmartSched <Text style={s.brandAi}>AI</Text>
          </Text>
        </View>

        {/* HEADING */}
        <Text style={s.heading}>Welcome back</Text>
        <Text style={s.subheading}>Sign in with your university account to continue.</Text>

        {/* FORM */}
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
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={s.eyeBtn}>
              <Text style={s.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {passwordError ? <Text style={s.errorText}>{passwordError}</Text> : null}

          <Pressable onPress={() => navigation.navigate('forgotpassword')} style={s.forgotRow}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={handleSignIn}>
            <Text style={s.primaryBtnText}>Sign in</Text>
          </Pressable>
        </View>

        {/* FOOTER */}
        <View style={s.footerRow}>
          <Text style={s.footerText}>New here?</Text>
          <Pressable onPress={() => navigation.navigate('signup')}>
            <Text style={s.footerLink}> Create an account</Text>
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

    brandWrap: { alignItems: 'center', marginBottom: 26 },
    logo: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    logoText: { color: c.white, fontSize: 30, fontWeight: '800' },
    brand: { fontSize: 16, fontWeight: '800', color: c.text, marginTop: 12, letterSpacing: 0.3 },
    brandAi: { color: c.primary },

    heading: { fontSize: 28, fontWeight: '800', color: c.text, textAlign: 'center' },
    subheading: { fontSize: 13, color: c.muted, textAlign: 'center', marginTop: 8, lineHeight: 19, marginBottom: 26 },

    form: {
      backgroundColor: c.surface,
      borderRadius: 26,
      padding: 22,
      ...shadow,
    },
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

    forgotRow: { alignSelf: 'flex-end', marginTop: 12 },
    forgotText: { fontSize: 12, fontWeight: '800', color: c.primary },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 22,
      ...shadow,
    },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    security: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 24 },
  });