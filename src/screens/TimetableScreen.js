import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DAYS } from '../data/sampleData';
import { findConflicts, checkRoomFit } from '../utils/conflicts';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { supabase } from '../lib/supabase';
import {
  fetchTimetable,
  fetchCourses,
  fetchSections,
  fetchRooms,
  fetchFaculty,
  fetchDepartments,
  saveTimetableEntry,
  deleteTimetableEntry,
} from '../lib/data';

const GRID_START = 8 * 60;
const GRID_END = 17 * 60;
const ROW_H = 72;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const COLOR_CYCLE = ['primary', 'sky', 'mint', 'pink', 'amber'];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));

const emptyForm = (day) => ({ courseId: '', sectionId: '', facultyId: '', roomId: '', day, start: '09:00' });

const describeClash = (clash, entries, maps) => {
  const other = entries.find((e) => e.id === clash.withId);
  const otherCourse = maps.courses[other?.courseId]?.name || 'another class';
  const otherSection = maps.sections[other?.sectionId]?.name || 'another section';
  if (clash.type === 'teacher') return `Teacher is already teaching ${otherCourse} at this time`;
  if (clash.type === 'section') return `${otherSection} already has ${otherCourse} at this time`;
  return `Room is already booked for ${otherCourse} at this time`;
};

const TimetableScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [myFacultyId, setMyFacultyId] = useState(null);

  const [day, setDay] = useState('Mon');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm('Mon'));
  const [check, setCheck] = useState(null);

  const maps = useMemo(
    () => ({
      courses: byId(courses),
      sections: byId(sections),
      rooms: byId(rooms),
      faculty: byId(faculty),
    }),
    [courses, sections, rooms, faculty],
  );

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tt, co, se, ro, fa, de, auth] = await Promise.all([
        fetchTimetable(),
        fetchCourses(),
        fetchSections(),
        fetchRooms(),
        fetchFaculty(),
        fetchDepartments(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.data?.user?.email?.toLowerCase();
      setEntries(tt);
      setCourses(co);
      setSections(se);
      setRooms(ro);
      setFaculty(fa);
      setDepartments(de);
      setMyFacultyId(fa.find((f) => f.email?.toLowerCase() === email)?.id || null);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sectionDept = (sectionId) => maps.sections[sectionId]?.departmentId;
  const colorFor = (courseId) => {
    const i = courses.findIndex((co) => co.id === courseId);
    return COLOR_CYCLE[(i < 0 ? 0 : i) % COLOR_CYCLE.length];
  };

  // Faculty see only their own classes. HOD and Registrar see the rows the database returns.
  const isMine = (e) =>
    isFaculty ? e.facultyId === myFacultyId : inScope(access, { departmentId: sectionDept(e.sectionId) });

  // Clashes are checked on the rows this user can read (see the note below).
  const clashIds = useMemo(() => {
    const ids = new Set();
    entries.forEach((e) => {
      if (findConflicts(entries, e, e.id).length) ids.add(e.id);
    });
    return ids;
  }, [entries]);

  const visible = entries.filter((e) => {
    if (!isMine(e)) return false;
    if (deptFilter !== 'all' && sectionDept(e.sectionId) !== deptFilter) return false;
    if (sectionFilter !== 'all' && e.sectionId !== sectionFilter) return false;
    return true;
  });

  const dayItems = visible.filter((e) => e.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
  const dayCount = (d) => visible.filter((e) => e.day === d).length;
  const weekClashes = visible.filter((e) => clashIds.has(e.id)).length;
  const roomsInUse = new Set(visible.map((e) => e.roomId)).size;

  const sectionChoices = sections.filter(
    (sec) => inScope(access, sec) && (deptFilter === 'all' || sec.departmentId === deptFilter),
  );

  // Form choices are limited to the user's department
  const courseChoices = courses.filter((co) => inScope(access, co));
  const sectionFormChoices = sections.filter((sec) => inScope(access, sec));
  const roomChoices = rooms.filter((r) => inScope(access, r));
  const formCourse = maps.courses[form.courseId];
  const facultyChoices = faculty.filter(
    (f) => inScope(access, f) && (!formCourse || f.departmentId === formCourse.departmentId),
  );

  // ---------- ACTIONS ----------

  const openNew = () => {
    if (!access.canEdit) return;
    setForm(emptyForm(day));
    setCheck(null);
    setEditing(true);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setCheck(null);
  };

  const buildCandidate = () => {
    const course = maps.courses[form.courseId];
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

    const course = maps.courses[candidate.courseId];
    const section = maps.sections[candidate.sectionId];
    const room = maps.rooms[candidate.roomId];

    const issues = [];
    if (!inScope(access, course) || !inScope(access, section)) {
      issues.push('You can only schedule courses and sections in your department');
    }
    if (!inScope(access, room)) {
      issues.push('This room belongs to another department');
    }
    issues.push(...findConflicts(entries, candidate, null).map((cf) => describeClash(cf, entries, maps)));
    issues.push(...checkRoomFit(room, course, section));

    setCheck({ ok: issues.length === 0, issues, end: fmt(toMin(candidate.start) + candidate.durationMins) });
  };

  const saveClass = async () => {
    const candidate = buildCandidate();
    if (!candidate || !check?.ok || saving) return;

    setSaving(true);
    try {
      await saveTimetableEntry(candidate);
      setDay(candidate.day);
      setEditing(false);
      setCheck(null);
      await load();
      Alert.alert(
        'Class saved',
        `${maps.courses[candidate.courseId].name} added on ${candidate.day} at ${candidate.start}.`,
      );
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeClass = async (id) => {
    try {
      await deleteTimetableEntry(id);
      await load();
    } catch (e) {
      Alert.alert('Could not delete', e.message);
    }
  };

  const onBlockPress = (e) => {
    const course = maps.courses[e.courseId];
    const info = `${maps.sections[e.sectionId]?.name} · Room ${maps.rooms[e.roomId]?.name} · ${
      maps.faculty[e.facultyId]?.name
    }\n${e.day} ${e.start} to ${fmt(toMin(e.start) + e.durationMins)}`;

    if (!access.canEdit || !isMine(e)) {
      Alert.alert(course?.name || 'Class', info);
      return;
    }
    Alert.alert(course?.name || 'Class', info, [
      { text: 'Close', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeClass(e.id) },
    ]);
  };

  // ---------- LOADING ----------

  if (loading && entries.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading timetable…</Text>
      </View>
    );
  }

  // ---------- NEW CLASS FORM ----------

  if (editing) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setEditing(false)} style={s.backRow}>
          <Text style={s.backText}>← Back to timetable</Text>
        </Pressable>

        <Text style={s.title}>New class</Text>
        <Text style={s.subtitle}>Pick the details, then check availability before saving.</Text>

        <Text style={s.fieldLabel}>Course</Text>
        <View style={s.chipWrap}>
          {courseChoices.map((co) => (
            <Chip key={co.id} s={s} active={form.courseId === co.id} label={co.code} sub={co.name} onPress={() => setField('courseId', co.id)} />
          ))}
        </View>

        <Text style={s.fieldLabel}>Section</Text>
        <View style={s.chipWrap}>
          {sectionFormChoices.map((sec) => (
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
              sub={departments.find((d) => d.id === f.departmentId)?.name}
              onPress={() => setField('facultyId', f.id)}
            />
          ))}
        </View>
        {facultyChoices.length === 0 ? <Text style={s.hint}>No faculty found in this department.</Text> : null}

        <Text style={s.fieldLabel}>Room</Text>
        <View style={s.chipWrap}>
          {roomChoices.map((r) => (
            <Chip key={r.id} s={s} active={form.roomId === r.id} label={r.name} sub={`${r.type} · ${r.capacity} seats`} onPress={() => setField('roomId', r.id)} />
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

        {formCourse ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              {formCourse.name} runs for {formCourse.durationMins} minutes, ending at {fmt(toMin(form.start) + formCourse.durationMins)}.
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
          style={[s.primaryBtn, (!check?.ok || saving) && s.primaryBtnDisabled]}
          onPress={saveClass}
          disabled={!check?.ok || saving}
        >
          <Text style={s.primaryBtnText}>{saving ? 'Saving…' : 'Save class'}</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={() => setEditing(false)}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- TIMETABLE VIEW ----------

  const TIMELINE_H = ((GRID_END - GRID_START) / 60) * ROW_H;
  const headerSub = isFaculty
    ? 'Your weekly classes'
    : access.canChooseDept
      ? 'All departments'
      : `${departments.find((d) => d.id === access.departmentId)?.name || ''} department`;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Timetable</Text>
          <Text style={s.subtitle}>{headerSub}</Text>
        </View>
        {access.canEdit ? (
          <Pressable style={s.newBtn} onPress={openNew}>
            <Text style={s.newBtnText}>+ New</Text>
          </Pressable>
        ) : null}
      </View>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load the timetable</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={s.statsRow}>
        <StatCard s={s} c={c} value={visible.length} label="Classes" colorKey="primary" />
        <StatCard s={s} c={c} value={roomsInUse} label="Rooms used" colorKey="sky" />
        <StatCard s={s} c={c} value={weekClashes} label="Clashes" colorKey={weekClashes ? 'red' : 'mint'} />
      </View>

      {!isFaculty ? (
        <>
          {access.canChooseDept ? (
            <>
              <Text style={s.sectionLabel}>DEPARTMENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {[{ id: 'all', name: 'All departments' }, ...departments].map((d) => (
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
            </>
          ) : null}

          <Text style={s.sectionLabel}>SECTION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            <Chip s={s} active={sectionFilter === 'all'} label="All sections" onPress={() => setSectionFilter('all')} />
            {sectionChoices.map((sec) => (
              <Chip key={sec.id} s={s} active={sectionFilter === sec.id} label={sec.name} onPress={() => setSectionFilter(sec.id)} />
            ))}
          </ScrollView>
        </>
      ) : null}

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

      <View style={s.card}>
        <View style={[s.timeline, { height: TIMELINE_H }]}>
          {HOURS.map((h) => (
            <View key={h} style={[s.hourRow, { top: (h - 8) * ROW_H }]}>
              <Text style={s.hourText}>{hourLabel(h)}</Text>
              <View style={s.hourLine} />
            </View>
          ))}

          {dayItems.map((e) => {
            const top = ((toMin(e.start) - GRID_START) / 60) * ROW_H;
            const height = Math.max((e.durationMins / 60) * ROW_H - 6, 64);
            const color = colorFor(e.courseId);
            const clash = clashIds.has(e.id);
            const course = maps.courses[e.courseId];

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
                    {maps.sections[e.sectionId]?.name} · {maps.rooms[e.roomId]?.name} · {maps.faculty[e.facultyId]?.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {dayItems.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyTitle}>No classes on {day}</Text>
              <Text style={s.emptyText}>{access.canEdit ? 'Tap + New to schedule one.' : 'Enjoy your free day.'}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={s.demoNote}>
        Live data · tap a class to see details{access.canEdit ? ' or delete it' : ''}
      </Text>
    </ScrollView>
  );
};

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

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3, lineHeight: 17 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    newBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, ...shadow },
    newBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    statsRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 18 },
    statCard: { flex: 1, backgroundColor: c.surface, borderRadius: 20, padding: 14, marginHorizontal: 5, ...shadow },
    statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 11, color: c.muted, fontWeight: '700', marginTop: 2 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    filterRow: { paddingBottom: 12 },
    chip: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, ...shadow },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipSub: { fontSize: 10, color: c.muted, marginTop: 2 },
    chipSubActive: { color: 'rgba(255,255,255,0.85)' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },

    dayRow: { flexDirection: 'row', marginBottom: 14, marginHorizontal: -3 },
    dayTab: { flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 10, alignItems: 'center', marginHorizontal: 3, ...shadow },
    dayTabActive: { backgroundColor: c.primary },
    dayName: { fontSize: 13, fontWeight: '800', color: c.text },
    dayNameActive: { color: c.white },
    dayCount: { fontSize: 9, color: c.muted, marginTop: 3, fontWeight: '700' },
    dayCountActive: { color: 'rgba(255,255,255,0.9)' },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 12, ...shadow },
    timeline: { position: 'relative' },
    hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', height: 1 },
    hourText: { width: 52, fontSize: 10, fontWeight: '700', color: c.muted },
    hourLine: { flex: 1, height: 1, backgroundColor: c.border },

    block: { position: 'absolute', left: 60, right: 4, borderRadius: 16, flexDirection: 'row', overflow: 'hidden' },
    blockPressed: { opacity: 0.85 },
    blockBar: { width: 5 },
    blockBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
    blockTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    blockTime: { fontSize: 10, fontWeight: '800' },
    blockName: { fontSize: 13, fontWeight: '800', color: c.text, marginTop: 2 },
    blockMeta: { fontSize: 10, color: c.muted, marginTop: 2 },
    badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

    emptyWrap: { position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center' },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    emptyText: { fontSize: 12, color: c.muted, marginTop: 4 },
    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },

    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },
    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginTop: 14, marginBottom: 8 },
    hint: { fontSize: 11, color: c.amber, marginTop: 2 },
    infoBox: { backgroundColor: c.skySoft, borderRadius: 16, padding: 14, marginTop: 18 },
    infoText: { fontSize: 12, color: c.text, lineHeight: 18 },
    checkBtn: { borderWidth: 1.5, borderColor: c.primary, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
    checkBtnText: { color: c.primary, fontSize: 14, fontWeight: '800' },
    resultOk: { backgroundColor: c.mintSoft, borderRadius: 18, padding: 16, marginTop: 14 },
    resultOkTitle: { fontSize: 14, fontWeight: '800', color: c.mint },
    resultText: { fontSize: 12, color: c.text, marginTop: 4, lineHeight: 18 },
    resultBad: { backgroundColor: c.redSoft, borderRadius: 18, padding: 16, marginTop: 14 },
    resultBadTitle: { fontSize: 14, fontWeight: '800', color: c.red, marginBottom: 6 },
    resultBadItem: { fontSize: 12, color: c.text, lineHeight: 19 },
    primaryBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 16, ...shadow },
    primaryBtnDisabled: { backgroundColor: c.border },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },
    secondaryBtn: { backgroundColor: c.pinkSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },
  });