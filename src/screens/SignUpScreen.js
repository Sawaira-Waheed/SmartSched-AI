import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/theme';

const ROLES = [
  { key: 'registrar', title: 'Registrar', sub: 'Institution-wide scheduling', glyph: '◆', colorKey: 'primary' },
  { key: 'hod', title: 'HOD', sub: 'Department management', glyph: '◉', colorKey: 'sky' },
  { key: 'faculty', title: 'Faculty', sub: 'Teaching and availability', glyph: '✎', colorKey: 'mint' },
];

const SignUpScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const errors = {
    name: !name.trim() ? 'Full name is required' : '',
    email: !email.trim() ? 'Email is required' : !email.includes('@') ? 'Enter a valid email' : '',
    password: !password ? 'Password is required' : password.length < 6 ? 'Use at least 6 characters' : '',
    confirm: !confirm ? 'Please confirm your password' : confirm !== password ? "Passwords don't match" : '',
    role: !role ? 'Choose a role to continue' : '',
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const handleCreate = () => {
    setSubmitted(true);
    if (hasErrors) return;
    // TODO: send the request to the backend. Accounts need Registrar approval.
    setDone(true);
  };

  const showError = (key) => (submitted ? errors[key] : '');

  // ---------- CONFIRMATION ----------

  if (done) {
    return (
      <View style={[s.container, s.center]}>
        <View style={s.doneCard}>
          <View style={s.doneBubble}>
            <Text style={s.doneTick}>✓</Text>
          </View>
          <Text style={s.doneTitle}>Request submitted</Text>
          <Text style={s.doneText}>
            Your {ROLES.find((r) => r.key === role)?.title} account is waiting for Registrar approval. You'll be able to sign in once it's approved.
          </Text>
          <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={() => navigation.navigate('login')}>
            <Text style={s.primaryBtnText}>Back to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------- FORM ----------

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('login')} style={s.backRow}>
          <Text style={s.backText}>← Sign in</Text>
        </Pressable>

        <Text style={s.heading}>Create your account</Text>
        <Text style={s.subheading}>Join SmartSched AI and simplify academic scheduling.</Text>

        <View style={s.card}>
          <Field s={s} label="Full name" error={showError('name')}>
            <TextInput
              style={[s.input, showError('name') && s.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor={c.muted}
              value={name}
              onChangeText={setName}
            />
          </Field>

          <Field s={s} label="University email" error={showError('email')}>
            <TextInput
              style={[s.input, showError('email') && s.inputError]}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field s={s} label="Password" error={showError('password')}>
            <View style={[s.inputWrap, showError('password') && s.inputError]}>
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

          <Field s={s} label="Confirm password" error={showError('confirm')}>
            <TextInput
              style={[s.input, showError('confirm') && s.inputError]}
              placeholder="Re-enter your password"
              placeholderTextColor={c.muted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </Field>
        </View>

        {/* ROLE */}
        <Text style={s.sectionLabel}>REQUEST ROLE</Text>
        <View style={s.roleList}>
          {ROLES.map((r) => {
            const active = role === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRole(r.key)}
                style={({ pressed }) => [
                  s.roleCard,
                  active && { borderColor: c[r.colorKey], backgroundColor: c[`${r.colorKey}Soft`] },
                  pressed && s.pressed,
                ]}
              >
                <View style={[s.roleIcon, { backgroundColor: c[`${r.colorKey}Soft`] }]}>
                  <Text style={[s.roleGlyph, { color: c[r.colorKey] }]}>{r.glyph}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.roleTitle}>{r.title}</Text>
                  <Text style={s.roleSub}>{r.sub}</Text>
                </View>
                <View style={[s.radio, active && { borderColor: c[r.colorKey] }]}>
                  {active ? <View style={[s.radioDot, { backgroundColor: c[r.colorKey] }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {showError('role') ? <Text style={s.errorText}>{errors.role}</Text> : null}

        <View style={s.noteBox}>
          <Text style={s.noteText}>Role access is approved by the Registrar before the account is activated.</Text>
        </View>

        <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={handleCreate}>
          <Text style={s.primaryBtnText}>Create account</Text>
        </Pressable>

        <View style={s.footerRow}>
          <Text style={s.footerText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('login')}>
            <Text style={s.footerLink}> Sign in</Text>
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

    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },
    heading: { fontSize: 26, fontWeight: '800', color: c.text },
    subheading: { fontSize: 13, color: c.muted, marginTop: 6, lineHeight: 19, marginBottom: 18 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 18, ...shadow },
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

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 20, marginBottom: 10 },
    roleList: {},
    roleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: 'transparent',
      ...shadow,
    },
    roleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    roleGlyph: { fontSize: 18, fontWeight: '800' },
    roleTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    roleSub: { fontSize: 11, color: c.muted, marginTop: 2 },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: { width: 10, height: 10, borderRadius: 5 },

    noteBox: { backgroundColor: c.amberSoft, borderRadius: 16, padding: 14, marginTop: 6 },
    noteText: { fontSize: 11, color: c.text, lineHeight: 17 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 22,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    doneCard: { backgroundColor: c.surface, borderRadius: 26, padding: 26, alignItems: 'center', ...shadow },
    doneBubble: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.mintSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    doneTick: { fontSize: 32, fontWeight: '800', color: c.mint },
    doneTitle: { fontSize: 20, fontWeight: '800', color: c.text },
    doneText: { fontSize: 13, color: c.muted, textAlign: 'center', lineHeight: 19, marginTop: 8 },
  });