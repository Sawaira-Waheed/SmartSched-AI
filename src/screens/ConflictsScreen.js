import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { FACULTY, COURSES, SECTIONS, ROOMS, TIMETABLE } from '../data/sampleData';
import { findConflicts } from '../utils/conflicts';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

// DEMO: the faculty member signed in. Replace with the real login.
const MY_FACULTY_ID = 'f2';

const TYPES = {
  teacher: { label: 'Teacher clash', color: 'red', soft: 'redSoft', glyph: '!', hint: 'One teacher is booked for two classes at once.' },
  section: { label: 'Section clash', color: 'amber', soft: 'amberSoft', glyph: '≡', hint: 'One section has two classes at the same time.' },
  room: { label: 'Room clash', color: 'pink', soft: 'pinkSoft', glyph: '▦', hint: 'One room is booked for two classes at once.' },
};

const courseName = (id) => COURSES.find((co) => co.id === id)?.name || 'Class';
const sectionOf = (id) => SECTIONS.find((sec) => sec.id === id);
const sectionName = (id) => sectionOf(id)?.name || '';
const teacherName = (id) => FACULTY.find((f) => f.id === id)?.name || '';
const roomName = (id) => ROOMS.find((r) => r.id === id)?.name || '';
const deptOfEntry = (e) => sectionOf(e.sectionId)?.departmentId;

// Each clash appears once, even though it is found from both classes
const buildClashes = (entries) => {
  const seen = new Set();
  const out = [];
  entries.forEach((e) => {
    findConflicts(entries, e, e.id).forEach((cf) => {
      const other = entries.find((x) => x.id === cf.withId);
      if (!other) return;
      const id = `${[e.id, other.id].sort().join('|')}|${cf.type}`;
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ id, type: cf.type, a: e, b: other });
    });
  });
  return out;
};

const ClassSide = ({ s, label, e }) => (
  <View style={s.side}>
    <Text style={s.sideLabel}>{label}</Text>
    <Text style={s.sideTitle} numberOfLines={1}>
      {courseName(e.courseId)}
    </Text>
    <Text style={s.sideMeta} numberOfLines={1}>
      {e.day} · {e.start} · {sectionName(e.sectionId)}
    </Text>
    <Text style={s.sideMeta} numberOfLines={1}>
      {roomName(e.roomId)} · {teacherName(e.facultyId)}
    </Text>
  </View>
);

const ConflictsScreen = ({ route, navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const allClashes = useMemo(() => buildClashes(TIMETABLE), []);
  const [filter, setFilter] = useState('all');

  // Which clashes this user should see
  const mine = (cl) => {
    if (isFaculty) return cl.a.facultyId === MY_FACULTY_ID || cl.b.facultyId === MY_FACULTY_ID;
    return inScope(access, { departmentId: deptOfEntry(cl.a) }) || inScope(access, { departmentId: deptOfEntry(cl.b) });
  };

  const visible = allClashes.filter(mine);
  const shown = visible.filter((cl) => filter === 'all' || cl.type === filter);
  const countOf = (t) => visible.filter((cl) => cl.type === t).length;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Conflicts</Text>
      <Text style={s.subtitle}>Teacher, section and room clashes found by rules</Text>

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
            <View key={cl.id} style={s.card}>
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
                <ClassSide s={s} label="CLASS A" e={cl.a} />
                <View style={{ width: 8 }} />
                <ClassSide s={s} label="CLASS B" e={cl.b} />
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

      <Text style={s.demoNote}>Sample data · clashes are checked by rules, not by AI</Text>
    </ScrollView>
  );
};

export default ConflictsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
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

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });