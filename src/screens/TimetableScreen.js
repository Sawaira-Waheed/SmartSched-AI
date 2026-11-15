import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import {
  DAYS,
  DEPARTMENTS,
  FACULTY,
  COURSES,
  SECTIONS,
  ROOMS,
  TIMETABLE,
} from '../data/sampleData';
import { findConflicts, checkRoomFit } from '../utils/conflicts';
import { useTheme } from '../theme/theme';

// ---------- SETTINGS ----------

// Demo: the logged-in faculty member. Connect to the real login later.
const MY_FACULTY_ID = 'f2';

const GRID_START = 8 * 60; // 08:00
const GRID_END = 17 * 60; // 17:00
const ROW_H = 72; // height of one hour on screen
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

// Each course gets a color from the palette, in order.
const COLOR_CYCLE = ['primary', 'sky', 'mint', 'pink', 'amber'];

// ---------- HELPERS ----------

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;

const colorFor = (courseId) => {
  const i = COURSES.findIndex((co) => co.id === courseId);
  return COLOR_CYCLE[(i < 0 ? 0 : i) % COLOR_CYCLE.length];
};

const courseOf = (id) => COURSES.find((co) => co.id === id);
const sectionOf = (id) => SECTIONS.find((sec) => sec.id === id);
const facultyOf = (id) => FACULTY.find((f) => f.id === id);
const roomOf = (id) => ROOMS.find((r) => r.id === id);

const sectionDept = (sectionId) => sectionOf(sectionId)?.departmentId;

const emptyForm = (day) => ({
  courseId: '',
  sectionId: '',
  facultyId: '',
  roomId: '',
  day,
  start: '09:00',
});

const describeClash = (clash, entries) => {
  const other = entries.find((e) => e.id === clash.withId);
  const otherCourse = courseOf(other?.courseId)?.name || 'another class';
  const otherSection = sectionOf(other?.sectionId)?.name || 'another section';

  if (clash.type === 'teacher') return `Teacher is already teaching ${otherCourse} at this time`;
  if (clash.type === 'section') return `${otherSection} already has ${otherCourse} at this time`;
  return `Room is already booked for ${otherCourse} at this time`;
};

// ---------- SCREEN ----------

const TimetableScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const role = route?.params?.role || 'hod';
  const canEdit = role !== 'faculty';

  const [entries, setEntries] = useState(TIMETABLE);
  const [day, setDay] = useState('Mon');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm('Mon'));
  const [check, setCheck] = useState(null);

  // Every class that clashes with another class
  const clashIds = useMemo(() => {
    const ids = new Set();
    entries.forEach((e) => {
      if (findConflicts(entries, e, e.id).length) ids.add(e.id);
    });
    return ids;
  }, [entries]);

  // What this user is allowed to see
  const visible = entries.filter((e) => {
    if (role === 'faculty' && e.facultyId !== MY_FACULTY_ID) return false;
    if (deptFilter !== 'all' && sectionDept(e.sectionId) !== deptFilter) return false;
    if (sectionFilter !== 'all' && e.sectionId !== sectionFilter) return false;
    return true;
  });

  const dayItems = visible
    .filter((e) => e.day === day)
    .sort((a, b) => toMin(a.start) - toMin(b.start));

  const dayCount = (d) => visible.filter((e) => e.day === d).length;
  const weekClashes = entries.filter((e) => clashIds.has(e.id)).length;
  const roomsInUse = new Set(visible.map((e) => e.roomId)).size;

  const sectionChoices = SECTIONS.filter((sec) => deptFilter === 'all' || sec.departmentId === deptFilter);

  // ---------- ACTIONS ----------

  const openNew = () => {
    setForm(emptyForm(day));
    setCheck(null);
    setEditing(true);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setCheck(null);
  };

  const buildCandidate = () => {
    const course = courseOf(form.courseId);
    if (!course || !form.sectionId || !form.facultyId || !form.roomId) return null;
    return {
      courseId: form.courseId,
      sectionId: form.sectionId,
      facultyId: form.facultyId,
      roomId: form.roomId,
      day: form.day,
      start: form.start,
      durationMins: course.durationMins,
    };
  };

  const runCheck = () => {
    const candidate = buildCandidate();
    if (!candidate) {
      setCheck({ ok: false, issues: ['Please choose a course, section, faculty and room'] });
      return;
    }

    const issues = [
      ...findConflicts(entries, candidate, null).map((cf) => describeClash(cf, entries)),
      ...checkRoomFit(roomOf(candidate.roomId), courseOf(candidate.courseId), sectionOf(candidate.sectionId)),
    ];

    setCheck({ ok: issues.length === 0, issues, end: fmt(toMin(candidate.start) + candidate.durationMins) });
  };

  const saveClass = () => {
    const candidate = buildCandidate();
    if (!candidate || !check?.ok) return;

    setEntries((prev) => [...prev, { id: `t${Date.now()}`, ...candidate }]);
    setDay(candidate.day);
    setEditing(false);
    setCheck(null);
    Alert.alert('Class saved', `${courseOf(candidate.courseId).name} added on ${candidate.day} at ${candidate.start}.`);
  };

  const removeClass = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const onBlockPress = (e) => {
    const course = courseOf(e.courseId);
    const section = sectionOf(e.sectionId);
    const room = roomOf(e.roomId);
    const info = `${section?.name} · Room ${room?.name} · ${facultyOf(e.facultyId)?.name}\n${e.day} ${e.start} to ${fmt(
      toMin(e.start) + e.durationMins,
    )}`;

    if (!canEdit) {
      Alert.alert(course?.name || 'Class', info);
      return;
    }

    Alert.alert(course?.name || 'Class', info, [
      { text: 'Close', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeClass(e.id) },
    ]);
  };

  // ---------- NEW CLASS FORM ----------

  if (editing) {
    const course = courseOf(form.courseId);
    const facultyChoices = FACULTY.filter((f) => !course || f.departmentId === course.departmentId);
    const hasFaculty = facultyChoices.some((f) => f.id === form.facultyId);

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setEditing(false)} style={s.backRow}>
          <Text style={s.backText}>← Back to timetable</Text>
        </Pressable>

        <Text style={s.title}>New class</Text>
        <Text style={s.subtitle}>Pick the details, then check availability before saving.</Text>

        <Text style={s.fieldLabel}>Course</Text>
        <View style={s.chipWrap}>
          {COURSES.map((co) => (
            <Chip
              key={co.id}
              s={s}
              active={form.courseId === co.id}
              label={co.code}
              sub={co.name}
              onPress={() => setField('courseId', co.id)}
            />
          ))}
        </View>

        <Text style={s.fieldLabel}>Section</Text>
        <View style={s.chipWrap}>
          {SECTIONS.map((sec) => (
            <Chip
              key={sec.id}
              s={s}
              active={form.sectionId === sec.id}
              label={sec.name}
              sub={`${sec.studentCount} students`}
              onPress={() => setField('sectionId', sec.id)}
            />
          ))}
        </View>

        <Text style={s.fieldLabel}>Faculty</Text>
        <View style={s.chipWrap}>
          {facultyChoices.map((f) => (
            <Chip
              key={f.id}
              s={s}
              active={form.facultyId === f.id}
              label={f.name}
              sub={DEPARTMENTS.find((d) => d.id === f.departmentId)?.name}
              onPress={() => setField('facultyId', f.id)}
            />
          ))}
        </View>
        {course && !hasFaculty && facultyChoices.length === 0 ? (
          <Text style={s.hint}>No faculty found in this department.</Text>
        ) : null}

        <Text style={s.fieldLabel}>Room</Text>
        <View style={s.chipWrap}>
          {ROOMS.map((r) => (
            <Chip
              key={r.id}
              s={s}
              active={form.roomId === r.id}
              label={r.name}
              sub={`${r.type} · ${r.capacity} seats`}
              onPress={() => setField('roomId', r.id)}
            />
          ))}
        </View>

        <Text style={s.fieldLabel}>Day</Text>
        <View style={s.chipWrap}>
          {DAYS.map((d) => (
            <Chip key={d} s={s} active={form.day === d} label={d} onPress={() => setField('day', d)} />
          ))}
        </View>

        <Text style={s.fieldLabel}>Start time</Text>
        <View style={s.chipWrap}>
          {START_TIMES.map((t) => (
            <Chip key={t} s={s} active={form.start === t} label={t} onPress={() => setField('start', t)} />
          ))}
        </View>

        {course ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              {course.name} runs for {course.durationMins} minutes, ending at{' '}
              {fmt(toMin(form.start) + course.durationMins)}.
            </Text>
          </View>
        ) : null}

        <Pressable style={s.checkBtn} onPress={runCheck}>
          <Text style={s.checkBtnText}>Check availability</Text>
        </Pressable>

        {check ? (
          check.ok ? (
            <View style={s.resultOk}>
              <Text style={s.resultOkTitle}>✓ Slot is free</Text>
              <Text style={s.resultText}>No teacher, section or room clashes. Room fits the course.</Text>
            </View>
          ) : (
            <View style={s.resultBad}>
              <Text style={s.resultBadTitle}>Can't save yet</Text>
              {check.issues.map((issue) => (
                <Text key={issue} style={s.resultBadItem}>
                  • {issue}
                </Text>
              ))}
            </View>
          )
        ) : null}

        <Pressable
          style={[s.primaryBtn, !check?.ok && s.primaryBtnDisabled]}
          onPress={saveClass}
          disabled={!check?.ok}
        >
          <Text style={s.primaryBtnText}>Save class</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={() => setEditing(false)}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- TIMETABLE VIEW ----------

  const TIMELINE_H = (GRID_END - GRID_START) / 60 * ROW_H;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Timetable</Text>
          <Text style={s.subtitle}>
            {role === 'faculty' ? 'Your weekly classes' : 'Weekly schedule by department and section'}
          </Text>
        </View>
        {canEdit ? (
          <Pressable style={s.newBtn} onPress={openNew}>
            <Text style={s.newBtnText}>+ New</Text>
          </Pressable>
        ) : null}
      </View>

      {/* STATS */}
      <View style={s.statsRow}>
        <StatCard s={s} value={visible.length} label="Classes" colorKey="primary" c={c} />
        <StatCard s={s} value={roomsInUse} label="Rooms used" colorKey="sky" c={c} />
        <StatCard s={s} value={weekClashes} label="Clashes" colorKey={weekClashes ? 'red' : 'mint'} c={c} />
      </View>

      {/* DEPARTMENT FILTER */}
      {role !== 'faculty' ? (
        <>
          <Text style={s.sectionLabel}>DEPARTMENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {[{ id: 'all', name: 'All departments' }, ...DEPARTMENTS].map((d) => (
              <Chip
                key={d.id}
                s={s}
                active={deptFilter === d.id}
                label={d.name}
                onPress={() => {
                  setDeptFilter(d.id);
                  setSectionFilter('all');
                }}
              />
            ))}
          </ScrollView>

          <Text style={s.sectionLabel}>SECTION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            <Chip s={s} active={sectionFilter === 'all'} label="All sections" onPress={() => setSectionFilter('all')} />
            {sectionChoices.map((sec) => (
              <Chip
                key={sec.id}
                s={s}
                active={sectionFilter === sec.id}
                label={sec.name}
                onPress={() => setSectionFilter(sec.id)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* DAY TABS */}
      <View style={s.dayRow}>
        {DAYS.map((d) => {
          const active = d === day;
          return (
            <Pressable key={d} style={[s.dayTab, active && s.dayTabActive]} onPress={() => setDay(d)}>
              <Text style={[s.dayName, active && s.dayNameActive]}>{d}</Text>
              <Text style={[s.dayCount, active && s.dayCountActive]}>{dayCount(d)} classes</Text>
            </Pressable>
          );
        })}
      </View>

      {/* TIMELINE */}
      <View style={s.card}>
        <View style={[s.timeline, { height: TIMELINE_H }]}>
          {HOURS.map((h) => (
            <View key={h} style={[s.hourRow, { top: (h - 8) * ROW_H }]}>
              <Text style={s.hourLabel}>{hourLabel(h)}</Text>
              <View style={s.hourLine} />
            </View>
          ))}

          {dayItems.map((e) => {
            const top = ((toMin(e.start) - GRID_START) / 60) * ROW_H;
            const height = Math.max((e.durationMins / 60) * ROW_H - 6, 64);
            const color = colorFor(e.courseId);
            const clash = clashIds.has(e.id);
            const course = courseOf(e.courseId);

            return (
              <Pressable
                key={e.id}
                onPress={() => onBlockPress(e)}
                style={({ pressed }) => [
                  s.block,
                  { top: top + 2, height, backgroundColor: c[`${color}Soft`] },
                  pressed && s.blockPressed,
                ]}
              >
                <View style={[s.blockBar, { backgroundColor: clash ? c.red : c[color] }]} />
                <View style={s.blockBody}>
                  <View style={s.blockTop}>
                    <Text style={[s.blockTime, { color: c[color] }]}>
                      {e.start} – {fmt(toMin(e.start) + e.durationMins)}
                    </Text>
                    {clash ? (
                      <View style={[s.badge, { backgroundColor: c.redSoft }]}>
                        <Text style={[s.badgeText, { color: c.red }]}>CLASH</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.blockName} numberOfLines={1}>
                    {course?.name}
                  </Text>
                  <Text style={s.blockMeta} numberOfLines={1}>
                    {sectionOf(e.sectionId)?.name} · {roomOf(e.roomId)?.name} · {facultyOf(e.facultyId)?.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {dayItems.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyTitle}>No classes on {day}</Text>
              <Text style={s.emptyText}>
                {canEdit ? 'Tap + New to schedule one.' : 'Enjoy your free day.'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={s.demoNote}>Sample data · tap a class to see details{canEdit ? ' or delete it' : ''}</Text>
    </ScrollView>
  );
};

// ---------- SMALL PIECES ----------

const Chip = ({ s, active, label, sub, onPress }) => (
  <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
    <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    {sub ? <Text style={[s.chipSub, active && s.chipSubActive]}>{sub}</Text> : null}
  </Pressable>
);

const StatCard = ({ s, c, value, label, colorKey }) => (
  <View style={s.statCard}>
    <View style={[s.statDot, { backgroundColor: c[colorKey] }]} />
    <Text style={[s.statValue, { color: c[colorKey] }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

export default TimetableScreen;

// ---------- STYLES ----------

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 40,
    },

    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3, lineHeight: 17 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    newBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 11,
      ...shadow,
    },
    newBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 14,
      marginHorizontal: 4,
      ...shadow,
    },
    statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 11, color: c.muted, fontWeight: '700', marginTop: 2 },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.muted,
      letterSpacing: 1.2,
      marginBottom: 8,
      marginTop: 4,
    },
    filterRow: { paddingBottom: 12 },

    chip: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
      ...shadow,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipSub: { fontSize: 10, color: c.muted, marginTop: 2 },
    chipSubActive: { color: 'rgba(255,255,255,0.85)' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },

    dayRow: { flexDirection: 'row', marginBottom: 14 },
    dayTab: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingVertical: 10,
      alignItems: 'center',
      marginHorizontal: 3,
      ...shadow,
    },
    dayTabActive: { backgroundColor: c.primary },
    dayName: { fontSize: 13, fontWeight: '800', color: c.text },
    dayNameActive: { color: c.white },
    dayCount: { fontSize: 9, color: c.muted, marginTop: 3, fontWeight: '700' },
    dayCountActive: { color: 'rgba(255,255,255,0.9)' },

    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 12,
      ...shadow,
    },

    timeline: {
      position: 'relative',
    },
    hourRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      height: 1,
    },
    hourLabel: {
      width: 52,
      fontSize: 10,
      fontWeight: '700',
      color: c.muted,
    },
    hourLine: { flex: 1, height: 1, backgroundColor: c.border },

    block: {
      position: 'absolute',
      left: 60,
      right: 4,
      borderRadius: 16,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    blockPressed: { opacity: 0.85 },
    blockBar: { width: 5 },
    blockBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
    blockTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    blockTime: { fontSize: 10, fontWeight: '800' },
    blockName: { fontSize: 13, fontWeight: '800', color: c.text, marginTop: 2 },
    blockMeta: { fontSize: 10, color: c.muted, marginTop: 2 },

    badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

    emptyWrap: {
      position: 'absolute',
      top: 80,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    emptyText: { fontSize: 12, color: c.muted, marginTop: 4 },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },

    // FORM
    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: c.primary,
      marginTop: 14,
      marginBottom: 8,
    },
    hint: { fontSize: 11, color: c.amber, marginTop: 2 },

    infoBox: {
      backgroundColor: c.skySoft,
      borderRadius: 16,
      padding: 14,
      marginTop: 18,
    },
    infoText: { fontSize: 12, color: c.text, lineHeight: 18 },

    checkBtn: {
      borderWidth: 1.5,
      borderColor: c.primary,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    checkBtnText: { color: c.primary, fontSize: 14, fontWeight: '800' },

    resultOk: {
      backgroundColor: c.mintSoft,
      borderRadius: 18,
      padding: 16,
      marginTop: 14,
    },
    resultOkTitle: { fontSize: 14, fontWeight: '800', color: c.mint },
    resultText: { fontSize: 12, color: c.text, marginTop: 4, lineHeight: 18 },

    resultBad: {
      backgroundColor: c.redSoft,
      borderRadius: 18,
      padding: 16,
      marginTop: 14,
    },
    resultBadTitle: { fontSize: 14, fontWeight: '800', color: c.red, marginBottom: 6 },
    resultBadItem: { fontSize: 12, color: c.text, lineHeight: 19 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
      ...shadow,
    },
    primaryBtnDisabled: { backgroundColor: c.border },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    secondaryBtn: {
      backgroundColor: c.pinkSoft,
      borderRadius: 18,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },
  });