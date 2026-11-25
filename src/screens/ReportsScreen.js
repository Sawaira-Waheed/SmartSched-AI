import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { buildReport, WEEK_HOURS } from '../utils/reportData';
import { buildTables, exportReport } from '../utils/exporter';
import {
  fetchFaculty,
  fetchRooms,
  fetchDepartments,
  fetchCourses,
  fetchSections,
  fetchTimetable,
} from '../lib/data';
import { StatsRow, StatTile, EmptyCard } from '../components/ui';

const EXPORTS = [
  { key: 'csv', title: 'CSV', sub: 'Spreadsheet data, one block per report', glyph: '▤', color: 'sky' },
  { key: 'xlsx', title: 'Excel (.xlsx)', sub: 'Each report on its own sheet', glyph: '▦', color: 'mint' },
];

const STATUS_COLOR = { Overloaded: 'red', 'Near limit': 'amber', Comfortable: 'mint' };
const CLASH_COLOR = { teacher: 'red', section: 'amber', room: 'pink' };
const CLASH_LABEL = { teacher: 'Teacher', section: 'Section', room: 'Room' };

const ReportsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const canView = access.role === ROLE.REGISTRAR || access.role === ROLE.HOD;
  const isRegistrar = access.role === ROLE.REGISTRAR;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [fa, ro, de, co, se, tt] = await Promise.all([
        fetchFaculty(),
        fetchRooms(),
        fetchDepartments(),
        fetchCourses(),
        fetchSections(),
        fetchTimetable(),
      ]);
      setData({ faculty: fa, rooms: ro, departments: de, courses: co, sections: se, timetable: tt });
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) load();
    else setLoading(false);
  }, []);

  const report = useMemo(() => (data ? buildReport(access, data) : null), [data, access.scoped, access.departmentId]);

  if (!canView) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Reports</Text>
        <Text style={s.subtitle}>Analytics for your department</Text>
        <View style={{ height: 16 }} />
        <EmptyCard text="Reports are available to the Registrar and HODs only." />
      </ScrollView>
    );
  }

  if (loading && !data) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Building reports…</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load reports</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const maxDept = Math.max(...report.departments.map((d) => d.classes), 1);
  const maxDay = Math.max(...report.perDay.map((d) => d.classes), 1);
  const maxClash = Math.max(...Object.values(report.clashCounts), 1);

  const runExport = async (format) => {
    if (busy) return;
    setBusy(format);
    try {
      await exportReport(format, buildTables(report));
    } catch (e) {
      Alert.alert('Export failed', e?.message || 'Unknown error');
    } finally {
      setBusy('');
    }
  };

  const k = report.kpis;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Reports</Text>
      <Text style={s.subtitle}>
        {isRegistrar ? 'Institution-wide analytics · live' : `${report.scopeName} · department analytics · live`}
      </Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not refresh reports</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      <StatsRow>
        <StatTile value={k.teachers} label="Teachers" color={c.primary} />
        <StatTile value={k.classes} label="Classes" color={c.sky} />
        <StatTile value={`${k.roomUtil}%`} label="Room use" color={c.mint} />
      </StatsRow>
      <StatsRow>
        <StatTile value={`${k.avgLoad}%`} label="Avg load" color={c.amber} />
        <StatTile value={k.overloaded} label="Overloaded" color={k.overloaded ? c.red : c.mint} />
        <StatTile value={k.clashes} label="Clashes" color={k.clashes ? c.red : c.mint} />
      </StatsRow>

      <Text style={s.section}>FACULTY WORKLOAD</Text>
      <View style={s.card}>
        {report.faculty.length === 0 ? (
          <Text style={s.empty}>No teachers in scope yet.</Text>
        ) : (
          report.faculty.map((f) => (
            <BarRow
              key={f.id}
              s={s}
              label={f.name}
              sub={`${f.department} · ${f.hours} of ${f.max} hrs · ${f.status}`}
              percent={f.percent}
              color={c[STATUS_COLOR[f.status]]}
            />
          ))
        )}
      </View>

      <Text style={s.section}>ROOM UTILIZATION</Text>
      <View style={s.card}>
        {report.rooms.length === 0 ? (
          <Text style={s.empty}>No rooms in scope yet.</Text>
        ) : (
          report.rooms.map((r) => (
            <BarRow
              key={r.id}
              s={s}
              label={`${r.name} · ${r.type}`}
              sub={`${r.department} · ${r.hours} of ${WEEK_HOURS} hrs`}
              percent={r.percent}
              color={r.type === 'Lab' ? c.amber : c.sky}
            />
          ))
        )}
      </View>

      <Text style={s.section}>{isRegistrar ? 'DEPARTMENT SCHEDULE' : 'DEPARTMENT OVERVIEW'}</Text>
      <View style={s.card}>
        {report.departments.map((d) => (
          <View key={d.id} style={s.deptRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.deptName} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={s.deptMeta}>
                {d.faculty} teachers · {d.courses} courses · {d.sections} sections
              </Text>
              <View style={s.track}>
                <View style={[s.fill, { width: `${(d.classes / maxDept) * 100}%`, backgroundColor: c.primary }]} />
              </View>
            </View>
            <Text style={s.deptValue}>{d.classes}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>CLASSES PER DAY</Text>
      <View style={s.card}>
        <View style={s.colWrap}>
          {report.perDay.map((d) => (
            <View key={d.day} style={s.col}>
              <Text style={s.colValue}>{d.classes}</Text>
              <View style={s.colTrack}>
                <View style={[s.colFill, { height: `${(d.classes / maxDay) * 100}%`, backgroundColor: c.primary }]} />
              </View>
              <Text style={s.colDay}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={s.section}>CLASHES BY TYPE</Text>
      <View style={s.card}>
        {Object.keys(CLASH_COLOR).map((t) => {
          const count = report.clashCounts[t];
          return (
            <BarRow
              key={t}
              s={s}
              label={`${CLASH_LABEL[t]} clashes`}
              sub={count ? `${count} found in the live timetable` : 'None found'}
              percent={(count / maxClash) * 100}
              valueText={String(count)}
              color={c[CLASH_COLOR[t]]}
            />
          );
        })}
      </View>

      <Text style={s.section}>EXPORT</Text>
      <View style={s.card}>
        {EXPORTS.map((x, i) => {
          const isBusy = busy === x.key;
          return (
            <Pressable
              key={x.key}
              onPress={() => runExport(x.key)}
              style={({ pressed }) => [
                s.exportRow,
                i === EXPORTS.length - 1 && { borderBottomWidth: 0 },
                pressed && s.pressed,
              ]}
            >
              <View style={[s.exportBubble, { backgroundColor: c[`${x.color}Soft`] }]}>
                <Text style={[s.exportGlyph, { color: c[x.color] }]}>{x.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.exportTitle}>{x.title}</Text>
                <Text style={s.exportSub}>{x.sub}</Text>
              </View>
              <Text style={[s.exportAction, { color: c[x.color] }]}>{isBusy ? 'Preparing…' : 'Export →'}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.note}>
        {isRegistrar
          ? 'Files open in the Android share sheet. Choose Drive, WhatsApp, or Files to save them.'
          : `Exports contain ${report.scopeName} data only.`}
      </Text>
    </ScrollView>
  );
};

const BarRow = ({ s, label, sub, percent, color, valueText }) => (
  <View style={s.barRow}>
    <View style={s.barHead}>
      <Text style={s.barLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[s.barValue, { color }]}>{valueText ?? `${Math.round(percent)}%`}</Text>
    </View>
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={s.barSub} numberOfLines={1}>
      {sub}
    </Text>
  </View>
);

export default ReportsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginTop: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    section: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 22, marginBottom: 10 },
    card: { backgroundColor: c.surface, borderRadius: 22, padding: 18, ...shadow },
    empty: { fontSize: 12, color: c.muted, textAlign: 'center', paddingVertical: 8 },

    barRow: { marginBottom: 14 },
    barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    barLabel: { flex: 1, fontSize: 13, fontWeight: '800', color: c.text, marginRight: 8 },
    barValue: { fontSize: 12, fontWeight: '800' },
    barSub: { fontSize: 10, color: c.muted, marginTop: 6 },
    track: { height: 9, borderRadius: 5, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },

    deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    deptName: { fontSize: 13, fontWeight: '800', color: c.text },
    deptMeta: { fontSize: 10, color: c.muted, marginTop: 2, marginBottom: 8 },
    deptValue: { fontSize: 20, fontWeight: '800', color: c.primary, marginLeft: 12 },

    colWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    col: { flex: 1, alignItems: 'center' },
    colValue: { fontSize: 11, fontWeight: '800', color: c.text, marginBottom: 6 },
    colTrack: {
      width: 22,
      height: 120,
      borderRadius: 11,
      backgroundColor: c.surfaceAlt,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    colFill: { width: '100%', borderRadius: 11 },
    colDay: { fontSize: 10, fontWeight: '800', color: c.muted, marginTop: 8 },

    exportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    exportBubble: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    exportGlyph: { fontSize: 17, fontWeight: '800' },
    exportTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    exportSub: { fontSize: 11, color: c.muted, marginTop: 2 },
    exportAction: { fontSize: 12, fontWeight: '800', marginLeft: 8 },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16, lineHeight: 15 },
  });