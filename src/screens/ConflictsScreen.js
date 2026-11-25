import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { buildClashes } from '../utils/clashes';
import { supabase } from '../lib/supabase';
import { fetchTimetable, fetchCourses, fetchSections, fetchRooms, fetchFaculty } from '../lib/data';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

const TYPES = {
  teacher: { label: 'Teacher clash', color: 'red', soft: 'redSoft', glyph: '!', hint: 'One teacher is booked for two classes at once.' },
  section: { label: 'Section clash', color: 'amber', soft: 'amberSoft', glyph: '≡', hint: 'One section has two classes at the same time.' },
  room: { label: 'Room clash', color: 'pink', soft: 'pinkSoft', glyph: '▦', hint: 'One room is booked for two classes at once.' },
};

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const nameOf = (map, id, fallback) => map[id]?.name || fallback;

const ClassSide = ({ s, label, e, course, section, room, teacher }) => (
  <View style={s.side}>
    <Text style={s.sideLabel}>{label}</Text>
    <Text style={s.sideTitle} numberOfLines={1}>{course}</Text>
    <Text style={s.sideMeta} numberOfLines={1}>{e.day} · {e.start} · {section}</Text>
    <Text style={s.sideMeta} numberOfLines={1}>{room} · {teacher}</Text>
  </View>
);

const ConflictsScreen = ({ route, navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState({});
  const [sections, setSections] = useState({});
  const [rooms, setRooms] = useState({});
  const [faculty, setFaculty] = useState({});
  const [myFacultyId, setMyFacultyId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tt, co, se, ro, fa, auth] = await Promise.all([
        fetchTimetable(),
        fetchCourses(),
        fetchSections(),
        fetchRooms(),
        fetchFaculty(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.data?.user?.email?.toLowerCase();
      setEntries(tt);
      setCourses(byId(co));
      setSections(byId(se));
      setRooms(byId(ro));
      setFaculty(byId(fa));
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

  const clashes = useMemo(() => buildClashes(entries), [entries]);

  // Faculty: clashes involving their own classes. HOD and Registrar: clashes in their scope.
  const visible = clashes.filter((cl) => {
    if (isFaculty) return cl.a.facultyId === myFacultyId || cl.b.facultyId === myFacultyId;
    const deptA = sections[cl.a.sectionId]?.departmentId;
    const deptB = sections[cl.b.sectionId]?.departmentId;
    return inScope(access, { departmentId: deptA }) || inScope(access, { departmentId: deptB });
  });

  const shown = visible.filter((cl) => filter === 'all' || cl.type === filter);
  const countOf = (t) => visible.filter((cl) => cl.type === t).length;

  if (loading && entries.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Checking the timetable…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Conflicts</Text>
      <Text style={s.subtitle}>Teacher, section and room clashes in the live timetable</Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not check the timetable</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      <StatsRow>
        <StatTile value={visible.length} label="Total" color={visible.length ? c.red : c.mint} />
        <StatTile value={countOf('teacher')} label="Teacher" color={c.red} />
        <StatTile value={countOf('section')} label="Section" color={c.amber} />
        <StatTile value={countOf('room')} label="Room" color={c.pink} />
      </StatsRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        {Object.keys(TYPES).map((t) => (
          <Chip key={t} label={TYPES[t].label} active={filter === t} onPress={() => setFilter(t)} />
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <EmptyCard text="No clashes. Your timetable is clean." />
      ) : shown.length === 0 ? (
        <EmptyCard text="No clashes of this type." />
      ) : (
        shown.map((cl) => {
          const t = TYPES[cl.type];
          return (
            <View key={cl.key} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.typeIcon, { backgroundColor: c[t.soft] }]}>
                  <Text style={[s.typeGlyph, { color: c[t.color] }]}>{t.glyph}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.typeLabel, { color: c[t.color] }]}>{t.label}</Text>
                  <Text style={s.hint}>{t.hint}</Text>
                </View>
              </View>

              <View style={s.sides}>
                <ClassSide
                  s={s}
                  label="CLASS A"
                  e={cl.a}
                  course={nameOf(courses, cl.a.courseId, 'Class')}
                  section={nameOf(sections, cl.a.sectionId, 'Section')}
                  room={nameOf(rooms, cl.a.roomId, 'Room')}
                  teacher={nameOf(faculty, cl.a.facultyId, 'Teacher')}
                />
                <View style={{ width: 8 }} />
                <ClassSide
                  s={s}
                  label="CLASS B"
                  e={cl.b}
                  course={nameOf(courses, cl.b.courseId, 'Class')}
                  section={nameOf(sections, cl.b.sectionId, 'Section')}
                  room={nameOf(rooms, cl.b.roomId, 'Room')}
                  teacher={nameOf(faculty, cl.b.facultyId, 'Teacher')}
                />
              </View>

              {access.canEdit ? (
                <Pressable
                  style={({ pressed }) => [s.fixBtn, pressed && s.pressed]}
                  onPress={() => navigation?.navigate('aischeduling', route?.params)}
                >
                  <Text style={s.fixText}>Find a fix with AI Scheduling →</Text>
                </Pressable>
              ) : (
                <Text style={s.viewOnly}>Ask your HOD or Registrar to resolve this.</Text>
              )}
            </View>
          );
        })
      )}

      <Text style={s.note}>
        The database blocks new clashes when a class is saved, so this list should stay empty. Anything listed here came
        from data added outside the app.
      </Text>
    </ScrollView>
  );
};

export default ConflictsScreen;

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

    filterRow: { paddingBottom: 14 },

    card: { backgroundColor: c.surface, borderRadius: 22, padding: 16, marginBottom: 14, ...shadow },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    typeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    typeGlyph: { fontSize: 18, fontWeight: '800' },
    typeLabel: { fontSize: 14, fontWeight: '800' },
    hint: { fontSize: 11, color: c.muted, marginTop: 3, lineHeight: 16 },

    sides: { flexDirection: 'row' },
    side: { flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 16, padding: 12 },
    sideLabel: { fontSize: 9, fontWeight: '800', color: c.primary, letterSpacing: 1 },
    sideTitle: { fontSize: 13, fontWeight: '800', color: c.text, marginTop: 4 },
    sideMeta: { fontSize: 10, color: c.muted, marginTop: 3 },

    fixBtn: { backgroundColor: c.primary, borderRadius: 16, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
    fixText: { color: c.white, fontSize: 13, fontWeight: '800' },
    viewOnly: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 14 },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16, lineHeight: 15 },
  });