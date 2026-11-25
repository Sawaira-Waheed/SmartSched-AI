import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { buildClashes } from '../utils/clashes';
import { supabase } from '../lib/supabase';
import {
  fetchNotifications,
  fetchNotificationReads,
  markNotificationsRead,
  fetchTimetable,
  fetchSections,
  fetchCourses,
  fetchDepartments,
  fetchFaculty,
} from '../lib/data';
import { Chip, StatsRow, StatTile, EmptyCard } from '../components/ui';

const TYPE = {
  clash: { glyph: '!', color: 'red', soft: 'redSoft', label: 'Clash' },
  ai: { glyph: '✦', color: 'primary', soft: 'primarySoft', label: 'AI' },
  updated: { glyph: '✓', color: 'mint', soft: 'mintSoft', label: 'Update' },
  system: { glyph: 'i', color: 'sky', soft: 'skySoft', label: 'System' },
};

const CLASH_WORD = { teacher: 'Teacher', section: 'Section', room: 'Room' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'clash', label: 'Clashes' },
  { key: 'ai', label: 'AI' },
  { key: 'updated', label: 'Updates' },
];

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
const timeText = (iso) =>
  new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const NotificationsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [stored, setStored] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [entries, setEntries] = useState([]);
  const [sections, setSections] = useState({});
  const [courses, setCourses] = useState({});
  const [departments, setDepartments] = useState({});
  const [myFacultyId, setMyFacultyId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [nt, rd, tt, se, co, de, fa, auth] = await Promise.all([
        fetchNotifications(),
        fetchNotificationReads(),
        fetchTimetable(),
        fetchSections(),
        fetchCourses(),
        fetchDepartments(),
        fetchFaculty(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.data?.user?.email?.toLowerCase();
      setStored(nt);
      setReadIds(new Set(rd.map((r) => r.notification_id)));
      setEntries(tt);
      setSections(byId(se));
      setCourses(byId(co));
      setDepartments(byId(de));
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

  const deptName = (id) => (id ? departments[id]?.name || '' : 'University-wide');

  // Live clash alerts, computed from the timetable the user can see
  const liveItems = useMemo(() => {
    const clashes = buildClashes(entries);
    const mine = clashes.filter((cl) => {
      if (isFaculty) return cl.a.facultyId === myFacultyId || cl.b.facultyId === myFacultyId;
      const deptA = sections[cl.a.sectionId]?.departmentId;
      const deptB = sections[cl.b.sectionId]?.departmentId;
      return inScope(access, { departmentId: deptA }) || inScope(access, { departmentId: deptB });
    });
    return mine.map((cl) => ({
      key: `live-${cl.key}`,
      dbId: null,
      type: 'clash',
      title: `${CLASH_WORD[cl.type]} clash`,
      body: `${courses[cl.a.courseId]?.name || 'A class'} overlaps ${courses[cl.b.courseId]?.name || 'another class'} on ${cl.a.day} at ${cl.a.start}.`,
      time: 'Live',
      dept: sections[cl.a.sectionId]?.departmentId,
      read: false,
      live: true,
    }));
  }, [entries, sections, courses, myFacultyId, isFaculty, access.departmentId, access.scoped]);

  // Saved notifications from the database
  const storedItems = stored.map((n) => ({
    key: `db-${n.id}`,
    dbId: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    time: timeText(n.created_at),
    dept: n.department_id,
    read: readIds.has(n.id),
    live: false,
  }));

  const items = [...liveItems, ...storedItems];
  const unreadCount = items.filter((i) => !i.read).length;
  const storedUnread = storedItems.filter((i) => !i.read).length;
  const shown = items.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !i.read;
    return i.type === filter;
  });

  const markOne = async (item) => {
    if (item.live || item.read) return;
    setReadIds((prev) => new Set(prev).add(item.dbId));
    try {
      await markNotificationsRead([item.dbId]);
    } catch (e) {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(item.dbId);
        return next;
      });
      Alert.alert('Could not mark as read', e.message);
    }
  };

  const markAll = async () => {
    const ids = storedItems.filter((i) => !i.read).map((i) => i.dbId);
    if (ids.length === 0) return;
    setReadIds((prev) => new Set([...prev, ...ids]));
    try {
      await markNotificationsRead(ids);
    } catch (e) {
      Alert.alert('Could not mark all as read', e.message);
      await load();
    }
  };

  if (loading && stored.length === 0 && entries.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading notifications…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.subtitle}>{unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}</Text>
        </View>
        {storedUnread > 0 ? (
          <Pressable onPress={markAll} hitSlop={10} style={s.markAll}>
            <Text style={s.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load notifications</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <StatsRow>
        <StatTile value={items.length} label="Total" color={c.primary} />
        <StatTile value={unreadCount} label="Unread" color={unreadCount ? c.pink : c.mint} />
        <StatTile value={liveItems.length} label="Clashes" color={liveItems.length ? c.red : c.mint} />
      </StatsRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {shown.length === 0 ? (
        <EmptyCard text="Nothing here right now." />
      ) : (
        shown.map((item) => {
          const t = TYPE[item.type] || TYPE.system;
          return (
            <Pressable
              key={item.key}
              onPress={() => markOne(item)}
              style={({ pressed }) => [s.card, item.read && s.cardRead, pressed && s.pressed]}
            >
              <View style={[s.bubble, { backgroundColor: c[t.soft] }]}>
                <Text style={[s.bubbleGlyph, { color: c[t.color] }]}>{t.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.topLine}>
                  <Text style={[s.cardTitle, item.read && s.cardTitleRead]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read ? <View style={s.dot} /> : null}
                </View>
                <Text style={s.body}>{item.body}</Text>
                <View style={s.metaLine}>
                  <Text style={[s.tag, { color: c[t.color] }]}>{t.label.toUpperCase()}</Text>
                  <Text style={s.meta}>
                    {item.time} · {deptName(item.dept)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      <Text style={s.note}>
        Clash alerts are live from the timetable. Other alerts are saved by the system when the timetable changes.
      </Text>
    </ScrollView>
  );
};

export default NotificationsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    markAll: { backgroundColor: c.primarySoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    markAllText: { fontSize: 12, fontWeight: '800', color: c.primary },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    filterRow: { paddingBottom: 14 },

    card: { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 20, padding: 14, marginBottom: 10, ...shadow },
    cardRead: { backgroundColor: c.surfaceAlt },
    bubble: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    bubbleGlyph: { fontSize: 16, fontWeight: '800' },
    topLine: { flexDirection: 'row', alignItems: 'center' },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: c.text },
    cardTitleRead: { color: c.muted, fontWeight: '700' },
    dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8, backgroundColor: c.pink },
    body: { fontSize: 12, color: c.muted, marginTop: 4, lineHeight: 17 },
    metaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    tag: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginRight: 8 },
    meta: { fontSize: 10, color: c.muted, fontWeight: '600' },

    note: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16, lineHeight: 15 },
  });