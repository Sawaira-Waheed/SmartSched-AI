import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { DAYS, DEPARTMENTS, FACULTY, COURSES, SECTIONS, ROOMS, TIMETABLE } from '../data/sampleData';
import { findConflicts } from '../utils/conflicts';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';
import { Chip, StatsRow, StatTile, ScopeBanner, EmptyCard } from '../components/ui';

const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const DAY_END = 17 * 60;
const REQUIRED_OPTIONS = [1, 2, 3, 4, 5];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Ranking only. Hard rules (clashes, room fit, weekly hours) have already removed invalid slots.
const scoreSlot = (start, teacherDay, sectionDay) => {
  let score = 100;
  score -= teacherDay * 10; // lighter days for the teacher score higher
  score -= sectionDay * 6; // spread a section's classes across the week
  const hour = Number(start.split(':')[0]);
  if (hour < 9 || hour > 14) score -= 5; // prefer mid-day
  return Math.max(55, Math.min(98, score));
};

const findSlots = (course, section, faculty, access) => {
  const rooms = ROOMS.filter(
    (r) => inScope(access, r) && r.type === course.roomType && r.capacity >= section.studentCount,
  );

  const hoursNow = TIMETABLE.filter((t) => t.facultyId === faculty.id).reduce((sum, t) => sum + t.durationMins, 0) / 60;
  const withinHours = hoursNow + course.durationMins / 60 <= faculty.maxHoursPerWeek;

  let checked = 0;
  const free = [];

  DAYS.forEach((day) => {
    START_TIMES.forEach((start) => {
      const startMin = toMin(start);
      if (startMin + course.durationMins > DAY_END) return;

      rooms.forEach((room) => {
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
        if (findConflicts(TIMETABLE, candidate, null).length > 0) return;

        const teacherDay = TIMETABLE.filter((t) => t.facultyId === faculty.id && t.day === day).length;
        const sectionDay = TIMETABLE.filter((t) => t.sectionId === section.id && t.day === day).length;

        free.push({
          ...candidate,
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

  return { slots, checked, freeCount: free.length };
};

const AiSchedulingScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const courseChoices = COURSES.filter((co) => inScope(access, co));
  const sectionChoices = SECTIONS.filter((sec) => inScope(access, sec));

  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [required, setRequired] = useState(1);
  const [result, setResult] = useState(null);

  const course = COURSES.find((co) => co.id === courseId);
  const section = SECTIONS.find((sec) => sec.id === sectionId);
  const faculty = FACULTY.find((f) => f.id === facultyId);
  const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || '';

  const facultyChoices = FACULTY.filter(
    (f) => inScope(access, f) && (!course || f.departmentId === course.departmentId),
  );

  const pickCourse = (id) => {
    setCourseId(id);
    setFacultyId('');
    setResult(null);
  };

  const runAnalysis = () => {
    if (!course || !section || !faculty) {
      setResult({ error: 'Choose a course, section and faculty first.' });
      return;
    }
    setResult(findSlots(course, section, faculty, access));
  };

  const accept = (slot) => {
    Alert.alert(
      'Added to draft',
      `${course.name} on ${slot.day} at ${slot.start} in ${slot.room.name}. Nothing is published until the HOD approves.`,
    );
  };

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>AI Scheduling</Text>
      <Text style={s.subtitle}>Find the best free slots for a class</Text>

      <View style={{ height: 16 }} />

      <ScopeBanner
        title={access.canChooseDept ? '' : deptName(access.departmentId)}
        text="You can only schedule courses, sections and faculty in your department."
      />

      <Text style={s.sectionLabel}>COURSE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {courseChoices.map((co) => (
          <Chip key={co.id} label={co.code} sub={co.name} active={courseId === co.id} onPress={() => pickCourse(co.id)} />
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>SECTION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {sectionChoices.map((sec) => (
          <Chip
            key={sec.id}
            label={sec.name}
            sub={`${sec.studentCount} students`}
            active={sectionId === sec.id}
            onPress={() => {
              setSectionId(sec.id);
              setResult(null);
            }}
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
            onPress={() => {
              setFacultyId(f.id);
              setResult(null);
            }}
          />
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>CLASSES PER WEEK</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {REQUIRED_OPTIONS.map((n) => (
          <Chip key={n} label={String(n)} active={required === n} onPress={() => setRequired(n)} />
        ))}
      </ScrollView>

      <Pressable style={({ pressed }) => [s.runBtn, pressed && s.pressed]} onPress={runAnalysis}>
        <Text style={s.runText}>Analyze schedule →</Text>
      </Pressable>

      {result?.error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{result.error}</Text>
        </View>
      ) : null}

      {result && !result.error ? (
        <>
          <Text style={s.sectionLabel}>RESULT</Text>
          <StatsRow>
            <StatTile value={result.checked} label="Checked" color={c.sky} />
            <StatTile value={result.freeCount} label="Free options" color={c.mint} />
            <StatTile value={result.slots.length} label="Suggested" color={c.primary} />
          </StatsRow>

          {result.slots.length === 0 ? (
            <EmptyCard text="No free slot fits this course. Try another section, faculty member or room type." />
          ) : (
            result.slots.map((slot, i) => (
              <View key={`${slot.day}-${slot.start}-${slot.room.id}`} style={s.slotCard}>
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
                  <Text style={s.reason}>
                    ✓ {slot.score >= 90 ? 'Lightest day for this teacher' : 'Teacher stays within weekly hours'}
                  </Text>
                </View>

                {access.canEdit ? (
                  <Pressable style={({ pressed }) => [s.acceptBtn, pressed && s.pressed]} onPress={() => accept(slot)}>
                    <Text style={s.acceptText}>Add to draft</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}

          {result.slots.length > 0 && result.slots.length < required ? (
            <View style={s.warnBox}>
              <Text style={s.warnText}>
                Only {result.slots.length} free day{result.slots.length > 1 ? 's' : ''} found, but you need {required}. Free up time or change the room type.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={s.engineBox}>
        <Text style={s.engineTitle}>How it works</Text>
        <Text style={s.engineText}>
          Hard rules come first: no teacher, section or room clashes, correct room type and size, and weekly hours. Only valid
          slots are ranked. The ranking prefers lighter days for the teacher and spreads a section's classes across the week.
          A trained model can replace the ranking later.
        </Text>
      </View>

      <Text style={s.demoNote}>Sample data · suggestions are not saved until the HOD accepts them</Text>
    </ScrollView>
  );
};

export default AiSchedulingScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
    filterRow: { paddingBottom: 4 },

    runBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 18, ...shadow },
    runText: { color: c.white, fontSize: 15, fontWeight: '800' },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 16, padding: 14, marginTop: 14 },
    errorText: { fontSize: 12, color: c.red, fontWeight: '700' },

    slotCard: { backgroundColor: c.surface, borderRadius: 22, padding: 16, marginBottom: 12, ...shadow },
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

    acceptBtn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
    acceptText: { color: c.white, fontSize: 13, fontWeight: '800' },

    warnBox: { backgroundColor: c.amberSoft, borderRadius: 16, padding: 14, marginTop: 4 },
    warnText: { fontSize: 12, color: c.text, lineHeight: 18 },

    engineBox: { backgroundColor: c.skySoft, borderRadius: 18, padding: 16, marginTop: 18 },
    engineTitle: { fontSize: 13, fontWeight: '800', color: c.sky, marginBottom: 6 },
    engineText: { fontSize: 11, color: c.text, lineHeight: 17 },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });