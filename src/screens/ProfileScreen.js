import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { DEPARTMENTS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess } from '../utils/permissions';

const ROLE_LABEL = { registrar: 'Registrar', hod: 'Head of Department', faculty: 'Faculty' };

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'All departments';

const ProfileScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [name, setName] = useState(route?.params?.name || 'User');
  const [phone, setPhone] = useState('+92 300 0000000');
  const [email] = useState(route?.params?.email || `${(route?.params?.name || 'user').toLowerCase()}@uni.edu`);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [error, setError] = useState('');

  const initial = name.charAt(0).toUpperCase();
  const dept = access.canChooseDept ? 'All departments' : deptName(access.departmentId);

  const startEdit = () => {
    setDraftName(name);
    setDraftPhone(phone);
    setError('');
    setEditing(true);
  };

  const save = () => {
    if (!draftName.trim()) {
      setError('Name is required');
      return;
    }
    setName(draftName.trim());
    setPhone(draftPhone.trim());
    setError('');
    setEditing(false);
  };

  const rows = [
    { label: 'Role', value: ROLE_LABEL[access.role] || access.role },
    { label: 'Department', value: dept },
    { label: 'Email', value: email },
  ];

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Profile</Text>
      <Text style={s.subtitle}>Your account details</Text>

      {/* HERO */}
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <Text style={s.heroName} numberOfLines={1}>
          {name}
        </Text>
        <View style={s.rolePill}>
          <Text style={s.rolePillText}>{(ROLE_LABEL[access.role] || '').toUpperCase()}</Text>
        </View>
      </View>

      {/* DETAILS */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Details</Text>
          {!editing ? (
            <Pressable onPress={startEdit} hitSlop={10}>
              <Text style={s.editLink}>Edit</Text>
            </Pressable>
          ) : null}
        </View>

        {editing ? (
          <>
            <Text style={s.fieldLabel}>Full name</Text>
            <TextInput style={[s.input, error && s.inputError]} value={draftName} onChangeText={setDraftName} placeholderTextColor={c.muted} />
            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Phone</Text>
            <TextInput
              style={s.input}
              value={draftPhone}
              onChangeText={setDraftPhone}
              keyboardType="phone-pad"
              placeholderTextColor={c.muted}
            />

            <View style={s.editRow}>
              <Pressable style={[s.btn, { backgroundColor: c.surfaceAlt }]} onPress={() => setEditing(false)}>
                <Text style={[s.btnText, { color: c.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[s.btn, { backgroundColor: c.primary }]} onPress={save}>
                <Text style={[s.btnText, { color: c.white }]}>Save</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {rows.map((r) => (
              <View key={r.label} style={s.infoRow}>
                <Text style={s.infoLabel}>{r.label}</Text>
                <Text style={s.infoValue} numberOfLines={1}>
                  {r.value}
                </Text>
              </View>
            ))}
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Phone</Text>
              <Text style={s.infoValue} numberOfLines={1}>
                {phone}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={s.noteBox}>
        <Text style={s.noteText}>
          Your role and department are set by the Registrar. To change them, contact the Registrar's office.
        </Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    hero: {
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 26,
      padding: 22,
      marginTop: 18,
      marginBottom: 14,
      ...shadow,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      ...shadow,
    },
    avatarText: { color: c.white, fontSize: 32, fontWeight: '800' },
    heroName: { fontSize: 20, fontWeight: '800', color: c.text, maxWidth: '100%' },
    rolePill: { backgroundColor: c.primarySoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
    rolePillText: { fontSize: 10, fontWeight: '800', color: c.primary, letterSpacing: 1 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 18, ...shadow },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    editLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    infoLabel: { fontSize: 12, color: c.muted, fontWeight: '700' },
    infoValue: { fontSize: 13, color: c.text, fontWeight: '700', maxWidth: '62%', textAlign: 'right' },

    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
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
    errorText: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },

    editRow: { flexDirection: 'row', marginTop: 18, marginHorizontal: -5 },
    btn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5 },
    btnText: { fontSize: 14, fontWeight: '800' },

    noteBox: { backgroundColor: c.skySoft, borderRadius: 18, padding: 14, marginTop: 14 },
    noteText: { fontSize: 11, color: c.text, lineHeight: 17 },
  });