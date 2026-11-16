import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { DEPARTMENTS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

// DEMO: the faculty member signed in. Replace with the real login.
const MY_FACULTY_ID = 'f2';

const TYPE = {
  clash: { glyph: '!', color: 'red', soft: 'redSoft', label: 'Clash' },
  ai: { glyph: '✦', color: 'primary', soft: 'primarySoft', label: 'AI' },
  updated: { glyph: '✓', color: 'mint', soft: 'mintSoft', label: 'Update' },
  system: { glyph: 'i', color: 'sky', soft: 'skySoft', label: 'System' },
};

// SAMPLE DATA: replace with the notification feed from the server.
const NOTIFICATIONS = [
  { id: 'n1', type: 'clash', title: 'Timetable conflict', body: 'Dr. Ahmed is double-booked on Mon 10:00 AM.', time: '10 min ago', departmentId: 'cs', facultyId: 'f1' },
  { id: 'n2', type: 'ai', title: 'AI suggestion ready', body: 'Three better slots were found for CS-310 Operating Systems Lab.', time: '1 hr ago', departmentId: 'cs' },
  { id: 'n3', type: 'clash', title: 'Room conflict', body: 'Room B-204 is double-booked on Tue 2:00 PM.', time: '2 hrs ago', departmentId: 'cs' },
  { id: 'n4', type: 'updated', title: 'Timetable updated', body: 'The HOD updated the Computer Science timetable.', time: 'Yesterday', departmentId: 'cs' },
  { id: 'n5', type: 'updated', title: 'Class moved', body: 'Your Thursday class moved to 2:00 PM.', time: 'Today', departmentId: 'cs', facultyId: MY_FACULTY_ID },
  { id: 'n6', type: 'system', title: 'Availability saved', body: 'Your availability for next week is saved.', time: 'Yesterday', departmentId: 'cs', facultyId: MY_FACULTY_ID },
  { id: 'n7', type: 'updated', title: 'Timetable published', body: 'Mathematics timetable was published.', time: '2 days ago', departmentId: 'math' },
];

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || '';

const NotificationsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [readIds, setReadIds] = useState({});
  const [filter, setFilter] = useState('all');

  // Who sees what
  const visible = NOTIFICATIONS.filter((n) => {
    if (isFaculty) {
      return n.facultyId === MY_FACULTY_ID || (!n.facultyId && n.type === 'updated' && inScope(access, n));
    }
    return inScope(access, n);
  });

  const isRead = (n) => !!readIds[n.id];
  const unread = visible.filter((n) => !isRead(n)).length;
  const clashes = visible.filter((n) => n.type === 'clash').length;

  const markRead = (id) => setReadIds((prev) => ({ ...prev, [id]: true }));
  const markAll = () => setReadIds(Object.fromEntries(visible.map((n) => [n.id, true])));

  const shown = visible.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !isRead(n);
    return n.type === filter;
  });

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.subtitle}>{unread > 0 ? `${unread} unread` : 'You are all caught up'}</Text>
        </View>
        {unread > 0 ? (
          <Pressable onPress={markAll} hitSlop={10} style={s.markAll}>
            <Text style={s.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <StatsRow>
        <StatTile value={visible.length} label="Total" color={c.primary} />
        <StatTile value={unread} label="Unread" color={unread ? c.pink : c.mint} />
        <StatTile value={clashes} label="Clashes" color={clashes ? c.red : c.mint} />
      </StatsRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Unread" active={filter === 'unread'} onPress={() => setFilter('unread')} />
        <Chip label="Clashes" active={filter === 'clash'} onPress={() => setFilter('clash')} />
        <Chip label="AI" active={filter === 'ai'} onPress={() => setFilter('ai')} />
        <Chip label="Updates" active={filter === 'updated'} onPress={() => setFilter('updated')} />
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyCard text="Nothing here right now." />
      ) : (
        shown.map((n) => {
          const t = TYPE[n.type];
          const read = isRead(n);
          return (
            <Pressable
              key={n.id}
              onPress={() => markRead(n.id)}
              style={({ pressed }) => [s.card, read && s.cardRead, pressed && s.pressed]}
            >
              <View style={[s.bubble, { backgroundColor: c[t.soft] }]}>
                <Text style={[s.bubbleGlyph, { color: c[t.color] }]}>{t.glyph}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={s.topLine}>
                  <Text style={[s.cardTitle, read && s.cardTitleRead]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  {!read ? <View style={[s.dot, { backgroundColor: c.pink }]} /> : null}
                </View>
                <Text style={s.body}>{n.body}</Text>
                <View style={s.metaLine}>
                  <Text style={[s.tag, { color: c[t.color] }]}>{t.label.toUpperCase()}</Text>
                  <Text style={s.meta}>
                    {n.time} · {deptName(n.departmentId)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      <Text style={s.demoNote}>Sample data · tap a notification to mark it as read</Text>
    </ScrollView>
  );
};

export default NotificationsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    markAll: { backgroundColor: c.primarySoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    markAllText: { fontSize: 12, fontWeight: '800', color: c.primary },
    filterRow: { paddingBottom: 14 },

    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 10,
      ...shadow,
    },
    cardRead: { backgroundColor: c.surfaceAlt, shadowOpacity: 0, elevation: 0 },
    bubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bubbleGlyph: { fontSize: 16, fontWeight: '800' },

    topLine: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: c.text },
    cardTitleRead: { color: c.muted, fontWeight: '700' },
    dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
    body: { fontSize: 12, color: c.muted, marginTop: 4, lineHeight: 17 },
    metaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    tag: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginRight: 8 },
    meta: { fontSize: 10, color: c.muted, fontWeight: '600' },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });