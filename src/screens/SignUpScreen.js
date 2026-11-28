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
import { signUpRequest } from '../lib/auth';
import { fetchDepartments } from '../lib/data';

// Registrar accounts are created by the administrator, so they can't be requested here
const ROLES = [
  { key: 'hod', title: 'HOD', sub: 'Manages one department', glyph: '◉', colorKey: 'sky' },
  { key: 'faculty', title: 'Faculty', sub: 'Teaches and sets availability', glyph: '✎', colorKey: 'mint' },
];

const SignUpScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch((e) => setServerError(e.message))
      .finally(() => setLoadingDepts(false));
  }, []);

  const errors = {
    name: !name.trim() ? 'Full name is required' : '',
    email: !email.trim() ? 'Email is required' : !email.includes('@') ? 'Enter a valid email' : '',
    password: !password ? 'Password is required' : password.length < 6 ? 'Use at least 6 characters' : '',
    confirm: !confirm ? 'Please confirm your password' : confirm !== password ? "Passwords don't match" : '',
    role: !role ? 'Choose a role' : '',
    departmentId: !departmentId ? 'Choose your department' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = (key) => (submitted ? errors[key] : '');

  const deptName = (id) => departments.find((d) => d.id === id)?.name || '';

  const handleCreate = async () => {
    setSubmitted(true);
    setServerError('');
    if (hasErrors || sending) return;

    setSending(true);
    try {
      await signUpRequest({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        departmentId,
      });
      setDone(true);
    } catch (e) {
      setServerError(e.message);
    } finally {
      setSending(false);
    }
  };

  // ---------- CONFIRMATION ----------

  if (done) {
    return (
      <View style={[s.container, s.center]}>
        <View style={s.doneCard}>
          <View style={s.doneBubble}>
            <Text style={s.doneTick}>✓</Text>
          </View>
          <Text style={s.doneTitle}>Request sent</Text>
          <Text style={s.doneText}>
            Your {ROLES.find((r) => r.key === role)?.title} request for {deptName(departmentId)} is waiting for Registrar
            approval. You can sign in once it's approved.
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
        <Pressable onPress={() => navigation.navigate('login')} hitSlop={14} style={s.backRow}>
          <Text style={s.backText}>← Sign in</Text>
        </Pressable>

        <Text style={s.heading}>Request an account</Text>
        <Text style={s.subheading}>Your request is reviewed by the Registrar before you can sign in.</Text>

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
        </View>

        <Text style={s.sectionLabel}>ROLE</Text>
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
        {shown('role') ? <Text style={s.errorText}>{errors.role}</Text> : null}

        <Text style={s.sectionLabel}>DEPARTMENT</Text>
        {loadingDepts ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <View style={s.chipWrap}>
            {departments.map((d) => {
              const active = departmentId === d.id;
              return (
                <Pressable key={d.id} onPress={() => setDepartmentId(d.id)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {shown('departmentId') ? <Text style={s.errorText}>{errors.departmentId}</Text> : null}

        {serverError ? (
          <View style={s.serverBox}>
            <Text style={s.serverText}>{serverError}</Text>
          </View>
        ) : null}

        <View style={s.noteBox}>
          <Text style={s.noteText}>
            Access is granted only after the Registrar approves your request. Until then, sign-in is blocked.
          </Text>
        </View>

        <Pressable
          disabled={sending}
          style={({ pressed }) => [s.primaryBtn, pressed && s.pressed, sending && s.busy]}
          onPress={handleCreate}
        >
          {sending ? <ActivityIndicator color={c.white} /> : <Text style={s.primaryBtnText}>Send request</Text>}
        </Pressable>

        <View style={s.footerRow}>
          <Text style={s.footerText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate('login')} hitSlop={8}>
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
    busy: { opacity: 0.7 },

    backRow: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 10 },
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
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 10, height: 10, borderRadius: 5 },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, ...shadow },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },

    serverBox: { backgroundColor: c.redSoft, borderRadius: 14, padding: 12, marginTop: 14 },
    serverText: { fontSize: 12, color: c.red, fontWeight: '700', lineHeight: 17 },
    noteBox: { backgroundColor: c.amberSoft, borderRadius: 16, padding: 14, marginTop: 16 },
    noteText: { fontSize: 11, color: c.text, lineHeight: 17 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
      marginTop: 20,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    doneCard: { backgroundColor: c.surface, borderRadius: 26, padding: 26, alignItems: 'center', ...shadow },
    doneBubble: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    doneTick: { fontSize: 32, fontWeight: '800', color: c.mint },
    doneTitle: { fontSize: 20, fontWeight: '800', color: c.text },
    doneText: { fontSize: 13, color: c.muted, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 6 },
  });