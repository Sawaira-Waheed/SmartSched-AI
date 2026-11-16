import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { DAYS, FACULTY, DEPARTMENTS, TIMETABLE, COURSES } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { Chip, StatsRow, StatTile, ScopeBanner } from '../components/ui';

// DEMO: the faculty member signed in. Replace with the real login.
const MY_FACULTY_ID = 'f2';

// Five 2-hour blocks across the teaching day
const BANDS = [
  { key: '08', label: '08:00', start: 8, end: 10 },
  { key: '10', label: '10:00', start: 10, end: 12 },
  { key: '12', label: '12:00', start: 12, end: 14 },
  { key: '14', label: '14:00', start: 14, end: 16 },
  { key: '16', label: '16:00', start: 16, end: 18 },
];

const STATUS = {
  scheduled: { label: 'Booked', glyph: '●', bg: 'primarySoft', fg: 'primary' },
  available: { label: 'Free', glyph: '▲', bg: 'mintSoft', fg: 'mint' },
  unavailable: { label: 'Off', glyph: '■', bg: 'redSoft', fg: 'red' },
};

const toHours = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};

// True if a timetable class falls inside a block on a given day
const overlaps = (t, day, band) => {
  if (t.day !== day) return false;
  const start = toHours(t.start);
  const end = start + t.durationMins / 60;
  return start < band.end && end > band.start;
};

const cellKey = (facultyId, day, band) => `${facultyId}|${day}|${band.key}`;

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || '';

// Registrar: anyone. HOD: teachers in their department. Faculty: only themselves.
const canSetFor = (access, faculty) => {
  if (!faculty) return false;
  if (access.role === ROLE.REGISTRAR) return true;
  if (access.role === ROLE.HOD) return inScope(access, faculty);
  return faculty.id === MY_FACULTY_ID;
};

const AvailabilityScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const teachers = isFaculty
    ? FACULTY.filter((f) => f.id === MY_FACULTY_ID)
    : FACULTY.filter((f) => inScope(access, f));

  const [selectedId, setSelectedId] = useState(teachers[0]?.id);
  const [offSlots, setOffSlots] = useState({});

  const teacher = teachers.find((f) => f.id === selectedId) || teachers[0] || null;
  const editable = canSetFor(access, teacher);

  const classesFor = (fid) => TIMETABLE.filter((t) => t.facultyId === fid);

  const statusOf = (day, band) => {
    if (!teacher) return 'available';
    if (classesFor(teacher.id).some((t) => overlaps(t, day, band))) return 'scheduled';
    return offSlots[cellKey(teacher.id, day, band)] ? 'unavailable' : 'available';
  };

  const counts = { scheduled: 0, available: 0, unavailable: 0 };
  DAYS.forEach((d) => BANDS.forEach((b) => {
    counts[statusOf(d, b)] += 1;
  }));

  const onCellPress = (day, band) => {
    if (!teacher || !editable) return;
    const status = statusOf(day, band);

    if (status === 'scheduled') {
      const cls = classesFor(teacher.id).find((t) => overlaps(t, day, band));
      const course = COURSES.find((co) => co.id === cls?.courseId);
      Alert.alert('Booked', `${course?.name || 'A class'} is scheduled here. Change it from the Timetable.`);
      return;
    }

    const k = cellKey(teacher.id, day, band);
    setOffSlots((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = true;
      return next;
    });
  };

  if (!teacher) {
    return (
      <View style={s.scroll}>
        <Text style={s.title}>Availability</Text>
        <Text style={s.subtitle}>No teachers in your department yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Availability</Text>
      <Text style={s.subtitle}>
        {isFaculty ? 'Mark when you are free or off' : 'Weekly availability by teacher'}
      </Text>

      <View style={{ height: 16 }} />

      <ScopeBanner
        title={isFaculty ? 'Your availability' : access.canChooseDept ? '' : deptName(access.departmentId)}
        text={
          isFaculty
            ? 'Tap a free or off block to change it. Booked blocks come from your timetable.'
            : 'You can update teachers in this department.'
        }
      />

      {!isFaculty ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {teachers.map((f) => (
            <Chip
              key={f.id}
              label={f.name}
              sub={deptName(f.departmentId)}
              active={teacher.id === f.id}
              onPress={() => setSelectedId(f.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <StatsRow>
        <StatTile value={counts.available} label="Free" color={c.mint} />
        <StatTile value={counts.unavailable} label="Off" color={c.red} />
        <StatTile value={counts.scheduled} label="Booked" color={c.primary} />
      </StatsRow>

      <View style={s.card}>
        <View style={s.gridRow}>
          <View style={s.timeCol} />
          {DAYS.map((d) => (
            <Text key={d} style={s.dayHead}>
              {d}
            </Text>
          ))}
        </View>

        {BANDS.map((b) => (
          <View key={b.key} style={s.gridRow}>
            <Text style={s.timeLabel}>{b.label}</Text>
            {DAYS.map((d) => {
              const st = STATUS[statusOf(d, b)];
              return (
                <Pressable
                  key={d}
                  onPress={() => onCellPress(d, b)}
                  style={({ pressed }) => [s.cell, { backgroundColor: c[st.bg] }, pressed && s.cellPressed]}
                >
                  <Text style={[s.cellGlyph, { color: c[st.fg] }]}>{st.glyph}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.legend}>
        {Object.values(STATUS).map((st) => (
          <View key={st.label} style={s.legendItem}>
            <Text style={[s.legendGlyph, { color: c[st.fg] }]}>{st.glyph}</Text>
            <Text style={s.legendText}>{st.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.hint}>
        {editable ? 'Tap a free or off block to switch it.' : 'View only. You can’t change this teacher’s availability.'}
      </Text>

      <Text style={s.demoNote}>Sample data · changes stay on this screen until the database is connected</Text>
    </ScrollView>
  );
};

export default AvailabilityScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    filterRow: { paddingBottom: 12 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 14, ...shadow },
    gridRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    timeCol: { width: 52 },
    dayHead: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 0.5 },
    timeLabel: { width: 52, fontSize: 10, fontWeight: '700', color: c.muted },
    cell: { flex: 1, height: 52, borderRadius: 14, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
    cellPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
    cellGlyph: { fontSize: 16, fontWeight: '800' },

    legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 9 },
    legendGlyph: { fontSize: 12, fontWeight: '800', marginRight: 5 },
    legendText: { fontSize: 11, color: c.muted, fontWeight: '700' },

    hint: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 14 },
    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });