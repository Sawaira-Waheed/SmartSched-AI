import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { fetchPendingAccounts, approveAccount, rejectAccount } from '../lib/auth';
import { fetchDepartments } from '../lib/data';
import { StatsRow, StatTile, EmptyCard } from '../components/ui';

const ROLE_OPTIONS = [
  { key: 'hod', label: 'HOD' },
  { key: 'faculty', label: 'Faculty' },
];

const ROLE_LABEL = { hod: 'HOD', faculty: 'Faculty' };

const ApprovalsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isRegistrar = access.role === ROLE.REGISTRAR;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [choices, setChoices] = useState({}); // userId -> { role, departmentId }
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [rows, deps] = await Promise.all([fetchPendingAccounts(), fetchDepartments()]);
      setPending(rows);
      setDepartments(deps);
      // Start each card with what the applicant asked for
      setChoices((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          if (!next[r.id]) next[r.id] = { role: r.role, departmentId: r.department_id };
        });
        return next;
      });
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

  const setChoice = (id, patch) => setChoices((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  const deptName = (id) => departments.find((d) => d.id === id)?.name || 'Unassigned';

  const approve = async (row) => {
    const pick = choices[row.id] || {};
    if (!pick.role || !pick.departmentId) {
      Alert.alert('Choose first', 'Pick a role and a department before approving.');
      return;
    }
    setBusyId(row.id);
    try {
      await approveAccount({ userId: row.id, role: pick.role, departmentId: pick.departmentId });
      Alert.alert(
        'Approved',
        `${row.full_name} can now sign in as ${ROLE_LABEL[pick.role]} for ${deptName(pick.departmentId)}.`,
      );
      await load();
    } catch (e) {
      Alert.alert('Could not approve', e.message);
    } finally {
      setBusyId('');
    }
  };

  const reject = (row) => {
    Alert.alert('Reject request', `Reject ${row.full_name}'s request? They won't be able to sign in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setBusyId(row.id);
          try {
            await rejectAccount(row.id);
            await load();
          } catch (e) {
            Alert.alert('Could not reject', e.message);
          } finally {
            setBusyId('');
          }
        },
      },
    ]);
  };

  if (!isRegistrar) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Approvals</Text>
        <Text style={s.subtitle}>Sign-up requests</Text>
        <View style={{ height: 16 }} />
        <EmptyCard text="Account approvals are handled by the Registrar." />
      </ScrollView>
    );
  }

  if (loading && pending.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading requests…</Text>
      </View>
    );
  }

  const hodCount = pending.filter((p) => p.role === 'hod').length;
  const facultyCount = pending.filter((p) => p.role === 'faculty').length;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Approvals</Text>
      <Text style={s.subtitle}>Review HOD and Faculty sign-up requests</Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load requests</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      <StatsRow>
        <StatTile value={pending.length} label="Pending" color={pending.length ? c.amber : c.mint} />
        <StatTile value={hodCount} label="HOD" color={c.sky} />
        <StatTile value={facultyCount} label="Faculty" color={c.mint} />
      </StatsRow>

      {pending.length === 0 ? (
        <EmptyCard text="No pending requests. You're all caught up." />
      ) : (
        pending.map((row) => {
          const pick = choices[row.id] || {};
          const busy = busyId === row.id;
          return (
            <View key={row.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{row.full_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {row.full_name}
                  </Text>
                  <Text style={s.email} numberOfLines={1}>
                    {row.email}
                  </Text>
                  <Text style={s.requested} numberOfLines={1}>
                    Requested {ROLE_LABEL[row.role] || row.role} · {deptName(row.department_id)}
                  </Text>
                </View>
              </View>

              <Text style={s.sectionLabel}>ROLE</Text>
              <View style={s.chipWrap}>
                {ROLE_OPTIONS.map((r) => {
                  const active = pick.role === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setChoice(row.id, { role: r.key })}
                      style={[s.chip, active && s.chipActive]}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.sectionLabel}>DEPARTMENT</Text>
              <View style={s.chipWrap}>
                {departments.map((d) => {
                  const active = pick.departmentId === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() => setChoice(row.id, { departmentId: d.id })}
                      style={[s.chip, active && s.chipActive]}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={s.btnRow}>
                <Pressable
                  disabled={busy}
                  onPress={() => reject(row)}
                  style={({ pressed }) => [s.rejectBtn, pressed && s.pressed, busy && s.busy]}
                >
                  <Text style={s.rejectText}>Reject</Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => approve(row)}
                  style={({ pressed }) => [s.approveBtn, pressed && s.pressed, busy && s.busy]}
                >
                  {busy ? <ActivityIndicator color={c.white} /> : <Text style={s.approveText}>Approve</Text>}
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <Text style={s.note}>
        Approving a Faculty request also creates the teacher record, so their classes appear in Calendar and Timetable.
      </Text>
    </ScrollView>
  );
};

export default ApprovalsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    busy: { opacity: 0.6 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginTop: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    card: { backgroundColor: c.surface, borderRadius: 22, padding: 16, marginBottom: 14, ...shadow },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: { color: c.primary, fontSize: 17, fontWeight: '800' },
    name: { fontSize: 15, fontWeight: '800', color: c.text },
    email: { fontSize: 11, color: c.muted, marginTop: 2 },
    requested: { fontSize: 11, color: c.primary, fontWeight: '800', marginTop: 4 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 14, marginBottom: 8 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { backgroundColor: c.surfaceAlt, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8 },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },

    btnRow: { flexDirection: 'row', marginTop: 8, marginHorizontal: -5 },
    rejectBtn: { flex: 1, backgroundColor: c.redSoft, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5 },
    rejectText: { color: c.red, fontSize: 14, fontWeight: '800' },
    approveBtn: { flex: 1, backgroundColor: c.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5, minHeight: 50, justifyContent: 'center' },
    approveText: { color: c.white, fontSize: 14, fontWeight: '800' },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 10, lineHeight: 15 },
  });