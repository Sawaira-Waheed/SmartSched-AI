import React, { useEffect, useMemo, useState } from 'react';
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
import { registrarExists, registrarSignUp } from '../lib/auth';

const SignUpScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [checking, setChecking] = useState(true);
  const [exists, setExists] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    registrarExists()
      .then(setExists)
      .catch((e) => setServerError(e.message))
      .finally(() => setChecking(false));
  }, []);

  const errors = {
    name: !name.trim() ? 'Full name is required' : '',
    email: !email.trim() ? 'Email is required' : !email.includes('@') ? 'Enter a valid email' : '',
    password: !password ? 'Password is required' : password.length < 6 ? 'Use at least 6 characters' : '',
    confirm: !confirm ? 'Please confirm your password' : confirm !== password ? "Passwords don't match" : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = (key) => (submitted ? errors[key] : '');

  const handleCreate = async () => {
    setSubmitted(true);
    setServerError('');
    if (hasErrors || sending) return;

    setSending(true);
    try {
      await registrarSignUp({ name: name.trim(), email: email.trim(), password });
      setDone(true);
    } catch (e) {
      setServerError(e.message);
    } finally {
      setSending(false);
    }
  };

  const backButton = (
    <Pressable onPress={() => navigation.navigate('login')} hitSlop={14} style={s.backRow}>
      <Text style={s.backText}>← Sign in</Text>
    </Pressable>
  );

  if (checking) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (exists || done) {
    return (
      <View style={[s.container, s.center]}>
        <View style={s.card}>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>{done ? '✓' : '◆'}</Text>
          </View>
          <Text style={s.cardTitle}>{done ? 'Registrar account created' : 'Already set up'}</Text>
          <Text style={s.cardText}>
            {done
              ? 'Sign in with this email and password to start adding HOD and Faculty accounts.'
              : 'A Registrar account already exists. Ask the Registrar to add your account from the Accounts screen.'}
          </Text>
          <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={() => navigation.navigate('login')}>
            <Text style={s.primaryBtnText}>Back to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {backButton}

        <Text style={s.heading}>Set up the Registrar</Text>
        <Text style={s.subheading}>
          This is the first-time setup. The Registrar can then add HOD and Faculty accounts.
        </Text>

        <View style={s.card}>
          <Field s={s} label="Full name" error={shown('name')}>
            <TextInput
              style={[s.input, shown('name') && s.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor={c.muted}
              value={name}
              onChangeText={setName}
            />
          </Field>

          <Field s={s} label="University email" error={shown('email')}>
            <TextInput
              style={[s.input, shown('email') && s.inputError]}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field s={s} label="Password" error={shown('password')}>
            <View style={[s.inputWrap, shown('password') && s.inputError]}>
              <TextInput
                style={s.inputFlex}
                placeholder="Create a password"
                placeholderTextColor={c.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                <Text style={s.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </Field>

          <Field s={s} label="Confirm password" error={shown('confirm')}>
            <TextInput
              style={[s.input, shown('confirm') && s.inputError]}
              placeholder="Re-enter your password"
              placeholderTextColor={c.muted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </Field>

          {serverError ? (
            <View style={s.serverBox}>
              <Text style={s.serverText}>{serverError}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={sending}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed, sending && s.busy]}
            onPress={handleCreate}
          >
            {sending ? <ActivityIndicator color={c.white} /> : <Text style={s.primaryBtnText}>Create Registrar account</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Field = ({ s, label, error, children }) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    {children}
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

export default SignUpScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { justifyContent: 'center', padding: 24 },
    scroll: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    busy: { opacity: 0.7 },

    backRow: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 10 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },
    heading: { fontSize: 26, fontWeight: '800', color: c.text },
    subheading: { fontSize: 13, color: c.muted, marginTop: 6, lineHeight: 19, marginBottom: 18 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 20, ...shadow },
    field: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 50,
      color: c.text,
      fontSize: 14,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 50,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    inputFlex: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 },
    inputError: { borderColor: c.red },
    eyeText: { fontSize: 12, fontWeight: '800', color: c.primary, paddingLeft: 10 },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, marginLeft: 4, fontWeight: '600' },

    serverBox: { backgroundColor: c.redSoft, borderRadius: 14, padding: 12, marginTop: 4 },
    serverText: { fontSize: 12, color: c.red, fontWeight: '700', lineHeight: 17 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
      marginTop: 18,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    bubble: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.mintSoft,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },
    bubbleText: { fontSize: 30, fontWeight: '800', color: c.mint },
    cardTitle: { fontSize: 20, fontWeight: '800', color: c.text, textAlign: 'center' },
    cardText: { fontSize: 13, color: c.muted, textAlign: 'center', lineHeight: 19, marginTop: 8 },
  });