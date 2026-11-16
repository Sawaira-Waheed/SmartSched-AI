import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { DEPARTMENTS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';
import { Chip, StatsRow, StatTile, ScopeBanner, EmptyCard } from '../components/ui';

const ACTION = {
  create: { label: 'Created', glyph: '+', color: 'mint', soft: 'mintSoft' },
  update: { label: 'Updated', glyph: '✎', color: 'sky', soft: 'skySoft' },
  delete: { label: 'Deleted', glyph: '×', color: 'red', soft: 'redSoft' },
  login: { label: 'Signed in', glyph: '→', color: 'primary', soft: 'primarySoft' },
  approve: { label: 'Approved', glyph: '✓', color: 'amber', soft: 'amberSoft' },
};

// SAMPLE DATA: replace with the audit log from the server.
const LOGS = [
  { id: 'a1', action: 'create', actor: 'HOD · CS', target: 'Course CS-401 Computer Networks', departmentId: 'cs', time: '10:42 AM' },
  { id: 'a2', action: 'update', actor: 'HOD · CS', target: 'Teacher Ms. Sara · max hours 18 → 20', departmentId: 'cs', time: '9:15 AM' },
  { id: 'a3', action: 'delete', actor: 'HOD · CS', target: 'Room C-210', departmentId: 'cs', time: 'Yesterday' },
  { id: 'a4', action: 'login', actor: 'Ms. Sara', target: 'Faculty sign-in from a new device', departmentId: 'cs', time: 'Yesterday' },
  { id: 'a5', action: 'approve', actor: 'Registrar', target: 'HOD account approved · Computer Science', departmentId: 'cs', time: '2 days ago' },
  { id: 'a6', action: 'update', actor: 'HOD · Math', target: 'Section MTH-1A student count 36 → 38', departmentId: 'math', time: '2 days ago' },
  { id: 'a7', action: 'create', actor: 'HOD · BBA', target: 'Teacher Mr. Imran added', departmentId: 'bba', time: '3 days ago' },
  { id: 'a8', action: 'login', actor: 'Registrar', target: 'Registrar sign-in', departmentId: null, time: '3 days ago' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'changes', label: 'Changes' },
  { key: 'login', label: 'Sign-ins' },
  { key: 'approve', label: 'Approvals' },
];

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Registrar';

const AuditLogsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [filter, setFilter] = useState('all');

  // Registrar sees everything. HOD sees only their department's actions.
  const visible = LOGS.filter((log) => {
    if (access.canChooseDept) return true;
    return log.departmentId && inScope(access, log);
  });

  const shown = visible.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'changes') return ['create', 'update', 'delete'].includes(log.action);
    return log.action === filter;
  });

  const changes = visible.filter((l) => ['create', 'update', 'delete'].includes(l.action)).length;
  const signIns = visible.filter((l) => l.action === 'login').length;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Audit logs</Text>
      <Text style={s.subtitle}>Who changed what, and when</Text>

      <View style={{ height: 16 }} />

      <ScopeBanner
        title={access.canChooseDept ? '' : `${deptName(access.departmentId)} only`}
        text="Actions are recorded automatically and can't be edited or deleted."
      />

      <StatsRow>
        <StatTile value={visible.length} label="Events" color={c.primary} />
        <StatTile value={changes} label="Changes" color={c.sky} />
        <StatTile value={signIns} label="Sign-ins" color={c.mint} />
      </StatsRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyCard text="No events match this filter." />
      ) : (
        shown.map((log) => {
          const a = ACTION[log.action];
          return (
            <View key={log.id} style={s.card}>
              <View style={[s.bubble, { backgroundColor: c[a.soft] }]}>
                <Text style={[s.bubbleGlyph, { color: c[a.color] }]}>{a.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.topLine}>
                  <Text style={[s.actionLabel, { color: c[a.color] }]}>{a.label.toUpperCase()}</Text>
                  <Text style={s.time}>{log.time}</Text>
                </View>
                <Text style={s.target}>{log.target}</Text>
                <Text style={s.meta} numberOfLines={1}>
                  {log.actor} · {deptName(log.departmentId)}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <Text style={s.demoNote}>Sample data · logs are read-only</Text>
    </ScrollView>
  );
};

export default AuditLogsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    filterRow: { paddingBottom: 14 },

    card: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 20, padding: 14, marginBottom: 10, ...shadow },
    bubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bubbleGlyph: { fontSize: 17, fontWeight: '800' },
    topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    time: { fontSize: 10, color: c.muted, fontWeight: '700' },
    target: { fontSize: 13, fontWeight: '700', color: c.text, marginTop: 4, lineHeight: 18 },
    meta: { fontSize: 11, color: c.muted, marginTop: 4 },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });