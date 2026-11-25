import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DAYS } from '../data/sampleData';
import { findConflicts } from '../utils/conflicts';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import {
  fetchCourses,
  fetchSections,
  fetchFaculty,
  fetchRooms,
  fetchTimetable,
  fetchDepartments,
  saveTimetableEntry,
} from '../lib/data';
import { Chip, StatsRow, StatTile, ScopeBanner, EmptyCard } from '../components/ui';

const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const DAY_END = 17 * 60;
const REQUIRED_OPTIONS = [1, 2, 3, 4, 5];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Ranking only. The hard rules (clashes, room fit, weekly hours) remove invalid slots first.
const scoreSlot = (start, teacherDay, sectionDay) => {
  let score = 100;
  score -= teacherDay * 10; // lighter days for the teacher score higher
  score -= sectionDay * 6; // spread a section's classes across the week
  const hour = Number(start.split(':')[0]);
  if (hour < 9 || hour > 14) score -= 5; // prefer mid-day
  return Math.max(55, Math.min(98, score));
};

const findSlots = ({ course, section, faculty, rooms, timetable }) => {
  const fitRooms = rooms.filter((r) => r.type === course.roomType && r.capacity >= section.studentCount);
  const hoursNow =
    timetable.filter((t) => t.facultyId === faculty.id).reduce((sum, t) => sum + t.durationMins, 0) / 60;
  const withinHours = hoursNow + course.durationMins / 60 <= faculty.maxHoursPerWeek;

  let checked = 0;
  const free = [];

  DAYS.forEach((day) => {
    START_TIMES.forEach((start) => {
      const startMin = toMin(start);
      if (startMin + course.durationMins > DAY_END) return;

      fitRooms.forEach((room) => {
        checked += 1;
        if (!withinHours) return;

        const candidate = {
          courseId: course.id,
          sectionId: section.id,
          facultyId: faculty.id,
          roomId: room.id,
          day,
          start,
          durationMins: course.durationMins,
        };
        if (findConflicts(timetable, candidate, null).length > 0) return;

        const teacherDay = timetable.filter((t) => t.facultyId === faculty.id && t.day === day).length;
        const sectionDay = timetable.filter((t) => t.sectionId === section.id && t.day === day).length;

        free.push({
          ...candidate,
          key: `${day}-${start}-${room.id}`,
          room,
          end: fmt(startMin + course.durationMins),
          score: scoreSlot(start, teacherDay, sectionDay),
        });
      });
    });
  });

  // Best slot per day, then the strongest overall
  const slots = DAYS.map((day) => free.filter((x) => x.day === day).sort((a, b) => b.score - a.score)[0])
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { slots, checked, freeCount: free.length, withinHours };
};

const AiSchedulingScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [required, setRequired] = useState(1);
  const [analyzed, setAnalyzed] = useState(false);
  const [adding, setAdding] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [co, se, fa, ro, tt, de] = await Promise.all([
        fetchCourses(),
        fetchSections(),
        fetchFaculty(),
        fetchRooms(),
        fetchTimetable(),
        fetchDepartments(),
      ]);
      setData({ courses: co, sections: se, faculty: fa, rooms: ro, timetable: tt, departments: de });
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFaculty) load();
    else setLoading(false);
  }, []);

  // Only what this user may schedule
  const scope = useMemo(() => {
    if (!data) return null;
    return {
      courses: data.courses.filter((co) => inScope(access, co)),
      sections: data.sections.filter((sec) => inScope(access, sec)),
      faculty: data.faculty.filter((f) => inScope(access, f)),
      rooms: data.rooms.filter((r) => inScope(access, r)),
    };
  }, [data, access.scoped, access.departmentId]);

  const course = scope?.courses.find((co) => co.id === courseId);
  const section = scope?.sections.find((sec) => sec.id === sectionId);
  const faculty = scope?.faculty.find((f) => f.id === facultyId);
  const facultyChoices = scope ? scope.faculty.filter((f) => !course || f.departmentId === course.departmentId) : [];
  const deptName = (id) => data?.departments.find((d) => d.id === id)?.name || '';

  // Recalculated whenever the timetable changes, so a suggestion disappears once it's added
  const result = useMemo(() => {
    if (!analyzed || !course || !section || !faculty || !data) return null;
    return findSlots({ course, section, faculty, rooms: scope.rooms, timetable: data.timetable });
  }, [analyzed, course, section, faculty, data, scope]);

  const pick = (setter) => (value) => {
    setter(value);
    setAnalyzed(false);
  };

  const analyze = () => {
    if (!course || !section || !faculty) {
      Alert.alert('Choose first', 'Pick a course, a section and a faculty member.');
      return;
    }
    setAnalyzed(true);
  };

  const addSlot = async (slot) => {
    if (!access.canEdit || adding) return;
    setAdding(slot.key);
    try {
      await saveTimetableEntry({
        courseId: slot.courseId,
        sectionId: slot.sectionId,
        facultyId: slot.facultyId,
        roomId: slot.roomId,
        day: slot.day,
        start: slot.start,
        durationMins: slot.durationMins,
      });
      Alert.alert('Added to timetable', `${course.name} on ${slot.day} at ${slot.start} in ${slot.room.name}.`);
      await load();
    } catch (e) {
      // The database rules report the reason, for example a clash or a wrong room type
      Alert.alert('Could not add', e.message);
    } finally {
      setAdding('');
    }
  };

  if (isFaculty) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>AI Scheduling</Text>
        <Text style={s.subtitle}>Find the best free slots for a class</Text>
        <View style={{ height: 16 }} />
        <EmptyCard text="AI Scheduling is available to the HOD and Registrar." />
      </ScrollView>
    );
  }

  if (loading && !data) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading scheduling data…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>AI Scheduling</Text>
      <Text style={s.subtitle}>Find the best free slots for a class · live</Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load scheduling data</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      <ScopeBanner
        title={access.canChooseDept ? '' : deptName(access.departmentId)}
        text="You can only schedule courses, sections and faculty in your department."
      />

      <Text style={s.sectionLabel}>COURSE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {(scope?.courses || []).map((co) => (
          <Chip key={co.id} label={co.code} sub={co.name} active={courseId === co.id} onPress={() => pick(setCourseId)(co.id)} />
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>SECTION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {(scope?.sections || []).map((sec) => (
          <Chip
            key={sec.id}
            label={sec.name}
            sub={`${sec.studentCount} students`}
            active={sectionId === sec.id}
            onPress={() => pick(setSectionId)(sec.id)}
          />
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>FACULTY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {facultyChoices.map((f) => (
          <Chip
            key={f.id}
            label={f.name}
            sub={deptName(f.departmentId)}
            active={facultyId === f.id}
            onPress={() => pick(setFacultyId)(f.id)}
          />
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>CLASSES PER WEEK</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {REQUIRED_OPTIONS.map((n) => (
          <Chip key={n} label={String(n)} active={required === n} onPress={() => setRequired(n)} />
        ))}
      </ScrollView>

      <Pressable style={({ pressed }) => [s.runBtn, pressed && s.pressed]} onPress={analyze}>
        <Text style={s.runText}>Analyze schedule →</Text>
      </Pressable>

      {result ? (
        <>
          <Text style={s.sectionLabel}>RESULT</Text>
          <StatsRow>
            <StatTile value={result.checked} label="Checked" color={c.sky} />
            <StatTile value={result.freeCount} label="Free options" color={c.mint} />
            <StatTile value={result.slots.length} label="Suggested" color={c.primary} />
          </StatsRow>

          {!result.withinHours ? (
            <EmptyCard text={`${faculty.name} would go over their weekly hours with this class. Choose another teacher or lower the load.`} />
          ) : result.slots.length === 0 ? (
            <EmptyCard text="No free slot fits this course. Try another section, faculty member or room type." />
          ) : (
            result.slots.map((slot, i) => (
              <View key={slot.key} style={s.slotCard}>
                <View style={s.slotTop}>
                  <View style={[s.rankPill, { backgroundColor: i === 0 ? c.mintSoft : c.surfaceAlt }]}>
                    <Text style={[s.rankText, { color: i === 0 ? c.mint : c.muted }]}>
                      {i === 0 ? 'BEST MATCH' : `OPTION ${i + 1}`}
                    </Text>
                  </View>
                  <Text style={s.slotTime}>
                    {slot.day} · {slot.start}–{slot.end}
                  </Text>
                </View>

                <Text style={s.slotRoom}>
                  {slot.room.name} · {slot.room.type} · {slot.room.capacity} seats
                </Text>

                <View style={s.scoreRow}>
                  <View style={s.scoreTrack}>
                    <View style={[s.scoreFill, { width: `${slot.score}%`, backgroundColor: c.primary }]} />
                  </View>
                  <Text style={s.scoreText}>{slot.score}% fit</Text>
                </View>

                <View style={s.reasons}>
                  <Text style={s.reason}>✓ No teacher, section or room clash</Text>
                  <Text style={s.reason}>✓ Room type and size fit this section</Text>
                  <Text style={s.reason}>✓ Teacher stays within weekly hours</Text>
                </View>

                {access.canEdit ? (
                  <Pressable
                    style={({ pressed }) => [s.addBtn, pressed && s.pressed, adding === slot.key && s.addBtnBusy]}
                    onPress={() => addSlot(slot)}
                    disabled={!!adding}
                  >
                    <Text style={s.addText}>{adding === slot.key ? 'Adding…' : 'Add to timetable'}</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}

          {result.withinHours && result.slots.length > 0 && result.slots.length < required ? (
            <View style={s.warnBox}>
              <Text style={s.warnText}>
                Only {result.slots.length} free day{result.slots.length > 1 ? 's' : ''} found, but you need {required}. Free
                up time or change the room type.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={s.engineBox}>
        <Text style={s.engineTitle}>How it works</Text>
        <Text style={s.engineText}>
          Hard rules come first: no teacher, section or room clashes, correct room type and size, and weekly hours. Only
          valid slots are ranked. Adding a slot saves it through the database, which checks the same rules again, so
          nothing can bypass them. A trained model can replace the ranking later.
        </Text>
      </View>
    </ScrollView>
  );
};

export default AiSchedulingScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginTop: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
    filterRow: { paddingBottom: 4 },

    runBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 18, ...shadow },
    runText: { color: c.white, fontSize: 15, fontWeight: '800' },

    slotCard: { backgroundColor: c.surface, borderRadius: 22, padding: 16, marginTop: 12, ...shadow },
    slotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rankPill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
    rankText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
    slotTime: { fontSize: 13, fontWeight: '800', color: c.text },
    slotRoom: { fontSize: 12, color: c.muted, marginTop: 8 },

    scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    scoreTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
    scoreFill: { height: '100%', borderRadius: 4 },
    scoreText: { fontSize: 11, fontWeight: '800', color: c.primary, marginLeft: 10 },

    reasons: { marginTop: 12 },
    reason: { fontSize: 12, color: c.text, lineHeight: 19 },

    addBtn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    addBtnBusy: { opacity: 0.6 },
    addText: { color: c.white, fontSize: 13, fontWeight: '800' },

    warnBox: { backgroundColor: c.amberSoft, borderRadius: 16, padding: 14, marginTop: 6 },
    warnText: { fontSize: 12, color: c.text, lineHeight: 18 },

    engineBox: { backgroundColor: c.skySoft, borderRadius: 18, padding: 16, marginTop: 18 },
    engineTitle: { fontSize: 13, fontWeight: '800', color: c.sky, marginBottom: 6 },
    engineText: { fontSize: 11, color: c.text, lineHeight: 17 },
  });