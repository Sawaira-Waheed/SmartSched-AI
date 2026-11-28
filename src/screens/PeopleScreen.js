import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { fetchPeople, createAccount } from '../lib/auth';
import { fetchDepartments } from '../lib/data';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

const ROLE_LABEL = { registrar: 'Registrar', hod: 'HOD', faculty: 'Faculty' };
const ROLE_OPTIONS = [
  { key: 'hod', label: 'HOD' },
  { key: 'faculty', label: 'Faculty' },
];
const EMPTY = { name: '', email: '', password: '', role: '', departmentId: '', maxHours: '18' };

const PeopleScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isRegistrar = access.role === ROLE.REGISTRAR;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pe, de] = await Promise.all([fetchPeople(), fetchDepartments()]);
      setPeople(pe);
      setDepartments(de);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRegistrar) load();
    else setLoading(false);
  }, []);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const deptName = (id) => departments.find((d) => d.id === id)?.name || 'Unassigned';

  const errors = {
    name: !form.name.trim() ? 'Name is required' : '',
    email: !form.email.includes('@') ? 'Enter a valid email' : '',
    password: form.password.length < 6 ? 'Temporary password needs 6+ characters' : '',
    role: !form.role ? 'Choose HOD or Faculty' : '',
    departmentId: !form.departmentId ? 'Choose a department' : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const shown = (key) => (submitted ? errors[key] : '');

  const submit = async () => {
    setSubmitted(true);
    setServerError('');
    if (hasErrors || saving) return;

    setSaving(true);
    try {
      await createAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        departmentId: form.departmentId,
        maxHoursPerWeek: Number(form.maxHours) || 18,
      });
      Alert.alert(
        'Account created',
        `Share the email and temporary password with ${form.name.trim()}. They can change it in Settings.`,
      );
      setForm(EMPTY);
      setSubmitted(false);
      setAdding(false);
      await load();
    } catch (e) {
      setServerError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isRegistrar) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Accounts</Text>
        <Text style={s.subtitle}>Manage HOD and Faculty access</Text>
        <View style={{ height: 16 }} />
        <EmptyCard text="Accounts are managed by the Registrar." />
      </ScrollView>
    );
  }

  if (loading && people.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading accounts…</Text>
      </View>
    );
  }

  const hods = people.filter((p) => p.role === 'hod').length;
  const faculty = people.filter((p) => p.role === 'faculty').length;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Accounts</Text>
          <Text style={s.subtitle}>Add HODs and Faculty, and see who has access</Text>
        </View>
        <Pressable style={s.addBtn} onPress={() => setAdding((v) => !v)}>
          <Text style={s.addBtnText}>{adding ? 'Close' : '+ Add'}</Text>
        </Pressable>
      </View>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load accounts</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <StatsRow>
        <StatTile value={people.length} label="Accounts" color={c.primary} />
        <StatTile value={hods} label="HOD" color={c.sky} />
        <StatTile value={faculty} label="Faculty" color={c.mint} />
      </StatsRow>

      {adding ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>New account</Text>

          <Field s={s} label="Full name" error={shown('name')}>
            <TextInput
              style={[s.input, shown('name') && s.inputError]}
              placeholder="e.g. Dr. Ayesha Khan"
              placeholderTextColor={c.muted}
              value={form.name}
              onChangeText={set('name')}
            />
          </Field>

          <Field s={s} label="University email" error={shown('email')}>
            <TextInput
              style={[s.input, shown('email') && s.inputError]}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field s={s} label="Temporary password" error={shown('password')}>
            <TextInput
              style={[s.input, shown('password') && s.inputError]}
              placeholder="At least 6 characters"
              placeholderTextColor={c.muted}
              value={form.password}
              onChangeText={set('password')}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Text style={s.label}>Role</Text>
          <View style={s.chipWrap}>
            {ROLE_OPTIONS.map((r) => (
              <Chip key={r.key} label={r.label} active={form.role === r.key} onPress={() => set('role')(r.key)} />
            ))}
          </View>
          {shown('role') ? <Text style={s.errorText}>{errors.role}</Text> : null}

          <Text style={[s.label, { marginTop: 12 }]}>Department</Text>
          <View style={s.chipWrap}>
            {departments.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                active={form.departmentId === d.id}
                onPress={() => set('departmentId')(d.id)}
              />
            ))}
          </View>
          {shown('departmentId') ? <Text style={s.errorText}>{errors.departmentId}</Text> : null}

          {form.role === 'faculty' ? (
            <Field s={s} label="Max hours per week" error="">
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={form.maxHours}
                onChangeText={set('maxHours')}
              />
            </Field>
          ) : null}

          {serverError ? (
            <View style={s.serverBox}>
              <Text style={s.serverText}>{serverError}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={saving}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed, saving && s.busy]}
            onPress={submit}
          >
            {saving ? <ActivityIndicator color={c.white} /> : <Text style={s.primaryBtnText}>Create account</Text>}
          </Pressable>
        </View>
      ) : null}

      <Text style={s.sectionLabel}>ALL ACCOUNTS</Text>
      {people.length === 0 ? (
        <EmptyCard text="No accounts yet." />
      ) : (
        people.map((p) => (
          <View key={p.id} style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(p.full_name || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>
                {p.full_name}
              </Text>
              <Text style={s.email} numberOfLines={1}>
                {p.email || '—'}
              </Text>
              <Text style={s.meta} numberOfLines={1}>
                {p.role === 'registrar' ? 'All departments' : deptName(p.department_id)}
              </Text>
            </View>
            <View style={[s.pill, { backgroundColor: c.primarySoft }]}>
              <Text style={[s.pillText, { color: c.primary }]}>{ROLE_LABEL[p.role]?.toUpperCase() || p.role}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const Field = ({ s, label, error, children }) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    {children}
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

export default PeopleScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    busy: { opacity: 0.7 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    addBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11 },
    addBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, marginLeft: 4, fontWeight: '600' },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    card: { backgroundColor: c.surface, borderRadius: 22, padding: 18, marginTop: 14, ...shadow },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 14 },
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
    inputError: { borderColor: c.red },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    serverBox: { backgroundColor: c.redSoft, borderRadius: 14, padding: 12, marginTop: 6 },
    serverText: { fontSize: 12, color: c.red, fontWeight: '700', lineHeight: 17 },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      marginTop: 14,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 22, marginBottom: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 10,
      ...shadow,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: { color: c.primary, fontSize: 16, fontWeight: '800' },
    name: { fontSize: 14, fontWeight: '800', color: c.text },
    email: { fontSize: 11, color: c.muted, marginTop: 2 },
    meta: { fontSize: 11, color: c.muted, marginTop: 2 },
    pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
    pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  });