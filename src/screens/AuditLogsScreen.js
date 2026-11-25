import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { fetchAuditLogs, fetchDepartments } from '../lib/data';
import { Chip, StatsRow, StatTile, EmptyCard, ScopeBanner } from '../components/ui';

const ACTION = {
  create: { label: 'Created', glyph: '+', color: 'mint', soft: 'mintSoft' },
  update: { label: 'Updated', glyph: '✎', color: 'sky', soft: 'skySoft' },
  delete: { label: 'Deleted', glyph: '×', color: 'red', soft: 'redSoft' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'create', label: 'Created' },
  { key: 'update', label: 'Updated' },
  { key: 'delete', label: 'Deleted' },
];

const ROLE_LABEL = { registrar: 'Registrar', hod: 'HOD', faculty: 'Faculty', system: 'System' };

const timeText = (iso) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const AuditLogsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState({});
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [lg, de] = await Promise.all([fetchAuditLogs(), fetchDepartments()]);
      setLogs(lg);
      setDepartments(Object.fromEntries(de.map((d) => [d.id, d])));
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access.role !== ROLE.FACULTY) load();
    else setLoading(false);
  }, []);

  if (access.role === ROLE.FACULTY) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Audit logs</Text>
        <Text style={s.subtitle}>Who changed what, and when</Text>
        <View style={{ height: 16 }} />
        <EmptyCard text="Audit logs are available to the Registrar and HODs." />
      </ScrollView>
    );
  }

  if (loading && logs.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading audit logs…</Text>
      </View>
    );
  }

  const shown = logs.filter((l) => filter === 'all' || l.action === filter);
  const countOf = (a) => logs.filter((l) => l.action === a).length;
  const deptName = (id) => (id ? departments[id]?.name || id : 'University-wide');

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Audit logs</Text>
      <Text style={s.subtitle}>Who changed what, and when</Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load audit logs</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      <ScopeBanner
        title={access.canChooseDept ? '' : deptName(access.departmentId)}
        text="Recorded automatically by the database. Entries can't be edited or deleted."
      />

      <StatsRow>
        <StatTile value={logs.length} label="Events" color={c.primary} />
        <StatTile value={countOf('create')} label="Created" color={c.mint} />
        <StatTile value={countOf('update')} label="Updated" color={c.sky} />
        <StatTile value={countOf('delete')} label="Deleted" color={c.red} />
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
          const a = ACTION[log.action] || ACTION.update;
          return (
            <View key={log.id} style={s.card}>
              <View style={[s.bubble, { backgroundColor: c[a.soft] }]}>
                <Text style={[s.bubbleGlyph, { color: c[a.color] }]}>{a.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.topLine}>
                  <Text style={[s.actionLabel, { color: c[a.color] }]}>{a.label.toUpperCase()}</Text>
                  <Text style={s.time}>{timeText(log.created_at)}</Text>
                </View>
                <Text style={s.target}>{log.target}</Text>
                <Text style={s.meta} numberOfLines={1}>
                  {log.actor_name || 'System'} · {ROLE_LABEL[log.actor_role] || log.actor_role} · {deptName(log.department_id)}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <Text style={s.note}>Showing the latest 200 events.</Text>
    </ScrollView>
  );
};

export default AuditLogsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginTop: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    filterRow: { paddingBottom: 14 },

    card: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 20, padding: 14, marginBottom: 10, ...shadow },
    bubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bubbleGlyph: { fontSize: 17, fontWeight: '800' },
    topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    time: { fontSize: 10, color: c.muted, fontWeight: '700' },
    target: { fontSize: 13, fontWeight: '700', color: c.text, marginTop: 4, lineHeight: 18 },
    meta: { fontSize: 11, color: c.muted, marginTop: 4 },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });