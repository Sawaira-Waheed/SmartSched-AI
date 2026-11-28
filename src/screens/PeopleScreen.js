import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { fetchPeople, createAccount, manageAccount, getMyUserId } from '../lib/auth';
import { fetchDepartments } from '../lib/data';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

const ROLE_LABEL = { registrar: 'Registrar', hod: 'HOD', faculty: 'Faculty' };
const ROLE_OPTIONS = [
  { key: 'hod', label: 'HOD' },
  { key: 'faculty', label: 'Faculty' },
];
const EMPTY_ADD = { name: '', email: '', password: '', role: '', departmentId: '', maxHours: '18' };

const PeopleScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isRegistrar = access.role === ROLE.REGISTRAR;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myId, setMyId] = useState(null);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [addSubmitted, setAddSubmitted] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pe, de, me] = await Promise.all([fetchPeople(), fetchDepartments(), getMyUserId()]);
      setPeople(pe);
      setDepartments(de);
      setMyId(me);
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

  const deptName = (id) => departments.find((d) => d.id === id)?.name || 'Unassigned';
  const selected = people.find((p) => p.id === selectedId) || null;
  const canManage = (p) => p.role !== 'registrar' && p.id !== myId;

  // ----- add -----
  const setAdd = (key) => (value) => setAddForm((prev) => ({ ...prev, [key]: value }));
  const addErrors = {
    name: !addForm.name.trim() ? 'Name is required' : '',
    email: !addForm.email.includes('@') ? 'Enter a valid email' : '',
    password: addForm.password.length < 6 ? 'Temporary password needs 6+ characters' : '',
    role: !addForm.role ? 'Choose HOD or Faculty' : '',
    departmentId: !addForm.departmentId ? 'Choose a department' : '',
  };
  const addInvalid = Object.values(addErrors).some(Boolean);
  const addShown = (key) => (addSubmitted ? addErrors[key] : '');

  const submitAdd = async () => {
    setAddSubmitted(true);
    setAddError('');
    if (addInvalid || addSaving) return;

    setAddSaving(true);
    try {
      await createAccount({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
        departmentId: addForm.departmentId,
        maxHoursPerWeek: Number(addForm.maxHours) || 18,
      });
      Alert.alert('Account created', `Share the email and temporary password with ${addForm.name.trim()}.`);
      setAddForm(EMPTY_ADD);
      setAddSubmitted(false);
      setAdding(false);
      await load();
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAddSaving(false);
    }
  };

  // ----- edit -----
  const startEdit = (p) => {
    setEditError('');
    setEdit({ name: p.full_name, role: p.role, departmentId: p.department_id || '' });
  };

  const saveEdit = async () => {
    if (!edit.name.trim()) {
      setEditError('Name is required');
      return;
    }
    if (!edit.departmentId) {
      setEditError('Choose a department');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await manageAccount({
        action: 'update',
        userId: selectedId,
        name: edit.name.trim(),
        role: edit.role,
        departmentId: edit.departmentId,
      });
      setEdit(null);
      await load();
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ----- suspend / activate / delete -----
  const runAction = async (payload, after) => {
    setBusy(true);
    try {
      await manageAccount(payload);
      if (after) after();
      await load();
    } catch (e) {
      Alert.alert('Could not update', e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = (p) => {
    const suspending = p.status !== 'suspended';
    Alert.alert(
      suspending ? 'Suspend account' : 'Activate account',
      suspending
        ? `${p.full_name} won't be able to sign in until you activate them again.`
        : `${p.full_name} can sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: suspending ? 'Suspend' : 'Activate',
          style: suspending ? 'destructive' : 'default',
          onPress: () => runAction({ action: suspending ? 'suspend' : 'activate', userId: p.id }),
        },
      ],
    );
  };

  const removeAccount = (p) => {
    Alert.alert('Delete account', `Permanently delete ${p.full_name}'s login and profile? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => runAction({ action: 'delete', userId: p.id }, () => setSelectedId(null)),
      },
    ]);
  };

  // ----- screens -----
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
          <Text style={s.subtitle}>Add, edit, suspend or remove access</Text>
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

          <Field s={s} label="Full name" error={addShown('name')}>
            <TextInput
              style={[s.input, addShown('name') && s.inputError]}
              placeholder="e.g. Dr. Ayesha Khan"
              placeholderTextColor={c.muted}
              value={addForm.name}
              onChangeText={setAdd('name')}
            />
          </Field>

          <Field s={s} label="University email" error={addShown('email')}>
            <TextInput
              style={[s.input, addShown('email') && s.inputError]}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={addForm.email}
              onChangeText={setAdd('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Field s={s} label="Temporary password" error={addShown('password')}>
            <TextInput
              style={[s.input, addShown('password') && s.inputError]}
              placeholder="At least 6 characters"
              placeholderTextColor={c.muted}
              value={addForm.password}
              onChangeText={setAdd('password')}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Field>

          <Text style={s.label}>Role</Text>
          <View style={s.chipWrap}>
            {ROLE_OPTIONS.map((r) => (
              <Chip key={r.key} label={r.label} active={addForm.role === r.key} onPress={() => setAdd('role')(r.key)} />
            ))}
          </View>
          {addShown('role') ? <Text style={s.errorText}>{addErrors.role}</Text> : null}

          <Text style={[s.label, { marginTop: 12 }]}>Department</Text>
          <View style={s.chipWrap}>
            {departments.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                active={addForm.departmentId === d.id}
                onPress={() => setAdd('departmentId')(d.id)}
              />
            ))}
          </View>
          {addShown('departmentId') ? <Text style={s.errorText}>{addErrors.departmentId}</Text> : null}

          {addForm.role === 'faculty' ? (
            <Field s={s} label="Max hours per week" error="">
              <TextInput style={s.input} keyboardType="number-pad" value={addForm.maxHours} onChangeText={setAdd('maxHours')} />
            </Field>
          ) : null}

          {addError ? (
            <View style={s.serverBox}>
              <Text style={s.serverText}>{addError}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={addSaving}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed, addSaving && s.busy]}
            onPress={submitAdd}
          >
            {addSaving ? <ActivityIndicator color={c.white} /> : <Text style={s.primaryBtnText}>Create account</Text>}
          </Pressable>
        </View>
      ) : null}

      <Text style={s.sectionLabel}>ALL ACCOUNTS</Text>
      {people.length === 0 ? (
        <EmptyCard text="No accounts yet." />
      ) : (
        people.map((p) => {
          const isOpen = selectedId === p.id;
          const suspended = p.status === 'suspended';
          return (
            <View key={p.id}>
              <Pressable
                onPress={() => {
                  setSelectedId(isOpen ? null : p.id);
                  setEdit(null);
                }}
                style={({ pressed }) => [s.row, isOpen && s.rowOpen, pressed && s.pressed]}
              >
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(p.full_name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {p.full_name}
                    {p.id === myId ? '  (you)' : ''}
                  </Text>
                  <Text style={s.email} numberOfLines={1}>
                    {p.email || '—'}
                  </Text>
                  <Text style={s.meta} numberOfLines={1}>
                    {p.role === 'registrar' ? 'All departments' : deptName(p.department_id)}
                  </Text>
                </View>
                <View style={[s.pill, { backgroundColor: suspended ? c.redSoft : c.primarySoft }]}>
                  <Text style={[s.pillText, { color: suspended ? c.red : c.primary }]}>
                    {suspended ? 'SUSPENDED' : (ROLE_LABEL[p.role] || p.role).toUpperCase()}
                  </Text>
                </View>
              </Pressable>

              {isOpen ? (
                <View style={s.panel}>
                  {!canManage(selected) ? (
                    <Text style={s.panelNote}>
                      {selected.role === 'registrar'
                        ? 'Registrar accounts are managed in the Supabase dashboard.'
                        : 'This is your account. Use Profile to change your name and phone.'}
                    </Text>
                  ) : edit ? (
                    <>
                      <Text style={s.label}>Full name</Text>
                      <TextInput
                        style={s.input}
                        value={edit.name}
                        onChangeText={(v) => setEdit({ ...edit, name: v })}
                        placeholderTextColor={c.muted}
                      />

                      <Text style={[s.label, { marginTop: 12 }]}>Role</Text>
                      <View style={s.chipWrap}>
                        {ROLE_OPTIONS.map((r) => (
                          <Chip
                            key={r.key}
                            label={r.label}
                            active={edit.role === r.key}
                            onPress={() => setEdit({ ...edit, role: r.key })}
                          />
                        ))}
                      </View>

                      <Text style={[s.label, { marginTop: 12 }]}>Department</Text>
                      <View style={s.chipWrap}>
                        {departments.map((d) => (
                          <Chip
                            key={d.id}
                            label={d.name}
                            active={edit.departmentId === d.id}
                            onPress={() => setEdit({ ...edit, departmentId: d.id })}
                          />
                        ))}
                      </View>

                      {editError ? <Text style={s.errorText}>{editError}</Text> : null}

                      <View style={s.actionRow}>
                        <Pressable style={[s.actionBtn, { backgroundColor: c.surfaceAlt }]} onPress={() => setEdit(null)}>
                          <Text style={[s.actionText, { color: c.muted }]}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          disabled={editSaving}
                          style={[s.actionBtn, { backgroundColor: c.primary }, editSaving && s.busy]}
                          onPress={saveEdit}
                        >
                          {editSaving ? (
                            <ActivityIndicator color={c.white} />
                          ) : (
                            <Text style={[s.actionText, { color: c.white }]}>Save</Text>
                          )}
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={s.actionRow}>
                        <Pressable
                          disabled={busy}
                          style={[s.actionBtn, { backgroundColor: c.primary }, busy && s.busy]}
                          onPress={() => startEdit(selected)}
                        >
                          <Text style={[s.actionText, { color: c.white }]}>Edit</Text>
                        </Pressable>
                        <Pressable
                          disabled={busy}
                          style={[
                            s.actionBtn,
                            { backgroundColor: suspended ? c.mintSoft : c.amberSoft },
                            busy && s.busy,
                          ]}
                          onPress={() => toggleSuspend(selected)}
                        >
                          <Text style={[s.actionText, { color: suspended ? c.mint : c.amber }]}>
                            {suspended ? 'Activate' : 'Suspend'}
                          </Text>
                        </Pressable>
                      </View>
                      <Pressable
                        disabled={busy}
                        style={({ pressed }) => [s.deleteBtn, pressed && s.pressed, busy && s.busy]}
                        onPress={() => removeAccount(selected)}
                      >
                        <Text style={s.deleteText}>Delete account</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}

      <Text style={s.note}>
        Changing a teacher to HOD removes their teaching record, but only when no classes are assigned to them.
      </Text>
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
    busy: { opacity: 0.6 },
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
    rowOpen: { borderWidth: 1.5, borderColor: c.primary },
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

    panel: { backgroundColor: c.surfaceAlt, borderRadius: 18, padding: 14, marginTop: -4, marginBottom: 12 },
    panelNote: { fontSize: 12, color: c.muted, lineHeight: 18 },
    actionRow: { flexDirection: 'row', marginHorizontal: -5 },
    actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginHorizontal: 5, minHeight: 46, justifyContent: 'center' },
    actionText: { fontSize: 13, fontWeight: '800' },
    deleteBtn: { borderRadius: 14, borderWidth: 1.5, borderColor: c.red, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
    deleteText: { fontSize: 13, fontWeight: '800', color: c.red },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16, lineHeight: 15 },
  });