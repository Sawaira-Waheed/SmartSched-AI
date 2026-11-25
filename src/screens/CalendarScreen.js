import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, ROLE } from '../utils/permissions';
import { supabase } from '../lib/supabase';
import { fetchTimetable, fetchCourses, fetchSections, fetchRooms, fetchFaculty } from '../lib/data';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));

const CalendarScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState({});
  const [sections, setSections] = useState({});
  const [rooms, setRooms] = useState({});
  const [teachers, setTeachers] = useState({});
  const [myFacultyId, setMyFacultyId] = useState(null);
  const [day, setDay] = useState('Mon');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [tt, co, se, ro, fa, auth] = await Promise.all([
          fetchTimetable(),
          fetchCourses(),
          fetchSections(),
          fetchRooms(),
          fetchFaculty(),
          supabase.auth.getUser(),
        ]);
        if (!active) return;

        // Link the login to a teacher record by email
        const email = auth?.data?.user?.email?.toLowerCase();
        const me = fa.find((f) => f.email?.toLowerCase() === email);

        setEntries(tt);
        setCourses(byId(co));
        setSections(byId(se));
        setRooms(byId(ro));
        setTeachers(byId(fa));
        setMyFacultyId(me?.id || null);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  // Faculty see only their own classes. HOD and Registrar see what the database allows.
  const visible = entries.filter((e) => !isFaculty || e.facultyId === myFacultyId);
  const countFor = (d) => visible.filter((e) => e.day === d).length;
  const dayItems = visible
    .filter((e) => e.day === day)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const activeDays = DAYS.filter((d) => countFor(d) > 0).length;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading your calendar…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Calendar</Text>
      <Text style={s.subtitle}>{isFaculty ? 'Your weekly classes' : 'Weekly classes in your scope'}</Text>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorTitle}>Could not load the calendar</Text>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {isFaculty && !myFacultyId && !error ? (
        <View style={s.noticeBox}>
          <Text style={s.noticeTitle}>Not linked to a teacher record</Text>
          <Text style={s.noticeText}>
            Your login email doesn't match a teacher record yet. Ask the HOD to add your university email, so your classes
            appear here.
          </Text>
        </View>
      ) : null}

      <View style={s.statsRow}>
        <View style={s.statTile}>
          <Text style={[s.statValue, { color: c.primary }]}>{visible.length}</Text>
          <Text style={s.statLabel}>Classes / week</Text>
        </View>
        <View style={s.statTile}>
          <Text style={[s.statValue, { color: c.sky }]}>{activeDays}</Text>
          <Text style={s.statLabel}>Teaching days</Text>
        </View>
      </View>

      <View style={s.dayRow}>
        {DAYS.map((d) => {
          const active = d === day;
          return (
            <Pressable key={d} onPress={() => setDay(d)} style={[s.dayTab, active && s.dayTabActive]}>
              <Text style={[s.dayName, active && s.dayNameActive]}>{d}</Text>
              <Text style={[s.dayCount, active && s.dayCountActive]}>{countFor(d)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.sectionLabel}>{day.toUpperCase()}</Text>

      {dayItems.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyTitle}>No classes on {day}</Text>
          <Text style={s.emptyText}>Enjoy the free time.</Text>
        </View>
      ) : (
        dayItems.map((e) => {
          const end = fmt(toMin(e.start) + e.durationMins);
          return (
            <View key={e.id} style={s.card}>
              <View style={s.timeBlock}>
                <Text style={s.timeStart}>{e.start}</Text>
                <Text style={s.timeEnd}>{end}</Text>
              </View>
              <View style={s.bar} />
              <View style={{ flex: 1 }}>
                <Text style={s.courseName} numberOfLines={1}>
                  {courses[e.courseId]?.name || 'Course'}
                </Text>
                <Text style={s.meta} numberOfLines={1}>
                  {sections[e.sectionId]?.name || 'Section'} · Room {rooms[e.roomId]?.name || '—'}
                </Text>
                {!isFaculty ? (
                  <Text style={s.meta} numberOfLines={1}>
                    {teachers[e.facultyId]?.name || 'Teacher'}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default CalendarScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3, marginBottom: 16 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },

    noticeBox: { backgroundColor: c.amberSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    noticeTitle: { fontSize: 13, fontWeight: '800', color: c.text },
    noticeText: { fontSize: 11, color: c.text, marginTop: 4, lineHeight: 16 },

    statsRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 16 },
    statTile: { flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5, ...shadow },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3 },

    dayRow: { flexDirection: 'row', marginHorizontal: -3, marginBottom: 14 },
    dayTab: { flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 10, alignItems: 'center', marginHorizontal: 3, ...shadow },
    dayTabActive: { backgroundColor: c.primary },
    dayName: { fontSize: 13, fontWeight: '800', color: c.text },
    dayNameActive: { color: c.white },
    dayCount: { fontSize: 11, color: c.muted, marginTop: 3, fontWeight: '700' },
    dayCountActive: { color: 'rgba(255,255,255,0.9)' },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginBottom: 10 },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 20, padding: 14, marginBottom: 10, ...shadow },
    timeBlock: { width: 56, alignItems: 'center' },
    timeStart: { fontSize: 13, fontWeight: '800', color: c.primary },
    timeEnd: { fontSize: 10, color: c.muted, marginTop: 3, fontWeight: '700' },
    bar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: c.pink, marginHorizontal: 12 },
    courseName: { fontSize: 14, fontWeight: '800', color: c.text },
    meta: { fontSize: 11, color: c.muted, marginTop: 3 },

    emptyCard: { backgroundColor: c.surface, borderRadius: 22, padding: 24, alignItems: 'center', ...shadow },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    emptyText: { fontSize: 12, color: c.muted, marginTop: 4 },
  });