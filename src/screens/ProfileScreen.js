import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { fetchMyProfile, updateMyProfile } from '../lib/auth';
import { fetchDepartments } from '../lib/data';

const ROLE_LABEL = { registrar: 'Registrar', hod: 'Head of Department', faculty: 'Faculty' };

const ProfileScreen = () => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [pr, de] = await Promise.all([fetchMyProfile(), fetchDepartments()]);
      setProfile(pr);
      setDepartments(de);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = () => {
    setName(profile.full_name || '');
    setPhone(profile.phone || '');
    setNameError('');
    setEditing(true);
  };

  const save = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile(name.trim(), phone.trim());
      setEditing(false);
      await load();
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.center}>
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load your profile</Text>
          <Text style={s.errorText}>{loadError || 'Please sign in again.'}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      </View>
    );
  }

  const isRegistrar = profile.role === 'registrar';
  const deptLabel = isRegistrar
    ? 'All departments'
    : departments.find((d) => d.id === profile.department_id)?.name || 'Unassigned';
  const initial = (profile.full_name || '?').charAt(0).toUpperCase();
  const note = isRegistrar
    ? 'You manage all accounts from the Accounts screen.'
    : 'Your role and department are assigned by the Registrar. To change them, ask the Registrar.';

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Profile</Text>
      <Text style={s.subtitle}>Your account details</Text>

      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <Text style={s.heroName} numberOfLines={1}>
          {profile.full_name}
        </Text>
        <View style={s.rolePill}>
          <Text style={s.rolePillText}>{(ROLE_LABEL[profile.role] || profile.role).toUpperCase()}</Text>
        </View>
      </View>

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
            <Text style={s.label}>Full name</Text>
            <TextInput
              style={[s.input, nameError && s.inputError]}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameError('');
              }}
              placeholderTextColor={c.muted}
            />
            {nameError ? <Text style={s.errorText}>{nameError}</Text> : null}

            <Text style={[s.label, { marginTop: 14 }]}>Phone</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 0300 1234567"
              placeholderTextColor={c.muted}
            />

            <View style={s.actionRow}>
              <Pressable style={[s.btn, { backgroundColor: c.surfaceAlt }]} onPress={() => setEditing(false)}>
                <Text style={[s.btnText, { color: c.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                style={[s.btn, { backgroundColor: c.primary }, saving && s.busy]}
                onPress={save}
              >
                {saving ? (
                  <ActivityIndicator color={c.white} />
                ) : (
                  <Text style={[s.btnText, { color: c.white }]}>Save</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <InfoRow s={s} label="Email" value={profile.email || '—'} />
            <InfoRow s={s} label="Role" value={ROLE_LABEL[profile.role] || profile.role} />
            <InfoRow s={s} label="Department" value={deptLabel} />
            <InfoRow s={s} label="Phone" value={profile.phone || 'Not added'} last />
          </>
        )}
      </View>

      <View style={s.noteBox}>
        <Text style={s.noteText}>{note}</Text>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ s, label, value, last }) => (
  <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

export default ProfileScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    busy: { opacity: 0.6 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, width: '100%' },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    hero: { alignItems: 'center', backgroundColor: c.surface, borderRadius: 26, padding: 22, marginTop: 18, marginBottom: 14, ...shadow },
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

    card: { backgroundColor: c.surface, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 6, ...shadow },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    editLink: { fontSize: 13, fontWeight: '800', color: c.primary },
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
    errorTextField: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },

    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    infoLabel: { fontSize: 12, color: c.muted, fontWeight: '700' },
    infoValue: { fontSize: 13, color: c.text, fontWeight: '700', maxWidth: '62%', textAlign: 'right' },

    actionRow: { flexDirection: 'row', marginTop: 18, marginHorizontal: -5, paddingBottom: 14 },
    btn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5, minHeight: 48, justifyContent: 'center' },
    btnText: { fontSize: 14, fontWeight: '800' },

    noteBox: { backgroundColor: c.skySoft, borderRadius: 18, padding: 14, marginTop: 14 },
    noteText: { fontSize: 11, color: c.text, lineHeight: 17 },
  });