import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DAYS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';
import {
  fetchRooms,
  fetchDepartments,
  fetchTimetable,
  fetchSections,
  fetchCourses,
  fetchFaculty,
  saveRoom,
  deleteRoom,
} from '../lib/data';
import { StatsRow, StatTile as UiStatTile, EmptyCard } from '../components/ui';

const ROOM_TYPES = ['Lecture', 'Lab'];
const DAY_MINUTES = 9 * 60;
const EMPTY_FORM = { name: '', type: 'Lecture', capacity: '', departmentId: '' };

const RoomsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});

  const deptName = (id) => departments.find((d) => d.id === id)?.name || 'Unassigned';
  const usageOf = (roomId) => timetable.filter((t) => t.roomId === roomId);
  const courseName = (id) => courses.find((co) => co.id === id)?.name || '';
  const sectionName = (id) => sections.find((sec) => sec.id === id)?.name || '';
  const facultyName = (id) => faculty.find((f) => f.id === id)?.name || '';

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [ro, de, tt, se, co, fa] = await Promise.all([
        fetchRooms(),
        fetchDepartments(),
        fetchTimetable(),
        fetchSections(),
        fetchCourses(),
        fetchFaculty(),
      ]);
      setList(ro);
      setDepartments(de);
      setTimetable(tt);
      setSections(se);
      setCourses(co);
      setFaculty(fa);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scoped = list.filter((r) => inScope(access, r));
  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((r) => {
    const deptOk = !access.canChooseDept || deptFilter === 'all' || r.departmentId === deptFilter;
    const typeOk = typeFilter === 'all' || r.type === typeFilter;
    return deptOk && typeOk && (!q || r.name.toLowerCase().includes(q));
  });

  const selected = scoped.find((r) => r.id === selectedId);
  const totalSeats = scoped.reduce((sum, r) => sum + r.capacity, 0);
  const labCount = scoped.filter((r) => r.type === 'Lab').length;

  const openAdd = () => {
    if (!access.canEdit) return;
    setErrors({});
    setEditing({ id: null, values: { ...EMPTY_FORM, departmentId: access.canChooseDept ? '' : access.departmentId } });
  };

  const openEdit = (room) => {
    if (!access.canEdit || !inScope(access, room)) return;
    setErrors({});
    setEditing({
      id: room.id,
      values: {
        name: room.name,
        type: room.type,
        capacity: String(room.capacity),
        departmentId: room.departmentId,
      },
    });
  };

  const cancelForm = () => {
    setErrors({});
    setEditing(null);
  };

  const validate = (v, id) => {
    const e = {};
    const name = v.name.trim();
    if (!name) {
      e.name = 'Room name is required';
    } else if (list.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== id)) {
      e.name = 'This room name already exists';
    }

    const cap = Number(v.capacity);
    if (!cap || cap < 1 || cap > 500) e.capacity = 'Capacity must be between 1 and 500';

    if (!v.departmentId) {
      e.departmentId = 'Choose a department';
    } else if (!access.canChooseDept && v.departmentId !== access.departmentId) {
      e.departmentId = 'You can only manage your own department';
    }
    return e;
  };

  const saveForm = async () => {
    if (!access.canEdit || saving) return;
    const v = editing.values;
    const found = validate(v, editing.id);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await saveRoom({
        id: editing.id,
        name: v.name.trim(),
        type: v.type,
        capacity: Number(v.capacity),
        departmentId: v.departmentId,
      });
      setEditing(null);
      setErrors({});
      await load();
    } catch (e) {
      Alert.alert('Could not save', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (room) => {
    if (!access.canEdit || !inScope(access, room)) return;

    const used = usageOf(room.id).length;
    if (used > 0) {
      Alert.alert('Cannot delete yet', `${room.name} is booked for ${used} timetable class${used > 1 ? 'es' : ''}. Move those classes first.`);
      return;
    }

    Alert.alert('Delete room', `Remove ${room.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoom(room.id);
            setSelectedId(null);
            await load();
          } catch (e) {
            Alert.alert('Could not delete', e.message);
          }
        },
      },
    ]);
  };

  if (loading && list.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading rooms…</Text>
      </View>
    );
  }

  if (editing) {
    const isNew = !editing.id;
    const set = (key) => (value) => setEditing((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={cancelForm} style={s.backRow}>
          <Text style={s.backText}>← Cancel</Text>
        </Pressable>

        <Text style={s.title}>{isNew ? 'Add room' : 'Edit room'}</Text>
        <Text style={s.subtitle}>Rooms available for your department's classes</Text>

        <Field s={s} label="Room name" error={errors.name}>
          <TextInput
            style={s.input}
            placeholder="e.g. C-210"
            placeholderTextColor={c.muted}
            autoCapitalize="characters"
            value={editing.values.name}
            onChangeText={set('name')}
          />
        </Field>

        <Field s={s} label="Room type">
          <View style={s.chipWrap}>
            {ROOM_TYPES.map((t) => {
              const active = editing.values.type === t;
              return (
                <Pressable key={t} onPress={() => set('type')(t)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field s={s} label="Capacity (seats)" error={errors.capacity}>
          <TextInput
            style={s.input}
            placeholder="e.g. 40"
            placeholderTextColor={c.muted}
            keyboardType="number-pad"
            value={editing.values.capacity}
            onChangeText={set('capacity')}
          />
        </Field>

        <Field s={s} label="Department" error={errors.departmentId}>
          {access.canChooseDept ? (
            <View style={s.chipWrap}>
              {departments.map((d) => {
                const active = editing.values.departmentId === d.id;
                return (
                  <Pressable key={d.id} onPress={() => set('departmentId')(d.id)} style={[s.chip, active && s.chipActive]}>
                    <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={s.lockedBox}>
              <Text style={s.lockedText}>{deptName(access.departmentId)}</Text>
              <Text style={s.lockedHint}>Your department. Rooms are added here only.</Text>
            </View>
          )}
        </Field>

        <Pressable style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={saveForm} disabled={saving}>
          <Text style={s.primaryBtnText}>{saving ? 'Saving…' : isNew ? 'Save room' : 'Save changes'}</Text>
        </Pressable>
        <Pressable style={s.secondaryBtn} onPress={cancelForm}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (selected) {
    const uses = usageOf(selected.id);
    const schedule = [...uses].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start));

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setSelectedId(null)} style={s.backRow}>
          <Text style={s.backText}>← All rooms</Text>
        </Pressable>

        <View style={s.hero}>
          <View style={[s.heroPill, { backgroundColor: selected.type === 'Lab' ? c.amberSoft : c.skySoft }]}>
            <Text style={[s.heroPillText, { color: selected.type === 'Lab' ? c.amber : c.sky }]}>{selected.type.toUpperCase()}</Text>
          </View>
          <Text style={s.heroName}>{selected.name}</Text>
          <Text style={s.heroMeta}>{deptName(selected.departmentId)}</Text>
          <View style={s.heroStats}>
            <HeroStat s={s} value={selected.capacity} label="Seats" />
            <HeroStat s={s} value={uses.length} label="Classes / week" />
          </View>
        </View>

        <Text style={s.sectionLabel}>AVAILABILITY</Text>
        <View style={s.card}>
          {DAYS.map((d) => {
            const minutes = uses.filter((t) => t.day === d).reduce((sum, t) => sum + t.durationMins, 0);
            const pct = Math.min((minutes / DAY_MINUTES) * 100, 100);
            const free = Math.max(Math.round((DAY_MINUTES - minutes) / 60), 0);
            return (
              <View key={d} style={s.dayRow}>
                <Text style={s.dayName}>{d}</Text>
                <View style={s.track}>
                  <View style={[s.fill, { width: `${pct}%`, backgroundColor: pct > 80 ? c.amber : c.mint }]} />
                </View>
                <Text style={s.dayFree}>{free}h free</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.sectionLabel}>BOOKINGS</Text>
        {schedule.length === 0 ? (
          <EmptyCard text="No bookings yet. This room is free all week." />
        ) : (
          schedule.map((t) => (
            <View key={t.id} style={s.rowCard}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>{t.day.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>
                  {courseName(t.courseId)}
                </Text>
                <Text style={s.rowMeta} numberOfLines={1}>
                  {t.start} · {sectionName(t.sectionId)} · {facultyName(t.facultyId)}
                </Text>
              </View>
            </View>
          ))
        )}

        {access.canEdit ? (
          <View style={s.actionRow}>
            <Pressable style={[s.actionBtn, { backgroundColor: c.primary }]} onPress={() => openEdit(selected)}>
              <Text style={[s.actionText, { color: c.white }]}>Edit</Text>
            </Pressable>
            <Pressable style={[s.actionBtn, { backgroundColor: c.redSoft }]} onPress={() => confirmDelete(selected)}>
              <Text style={[s.actionText, { color: c.red }]}>Delete</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={s.viewOnly}>View only. Your role can't change room records.</Text>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Rooms</Text>
          <Text style={s.subtitle}>Capacity, type and availability</Text>
        </View>
        {access.canEdit ? (
          <Pressable style={s.addBtn} onPress={openAdd}>
            <Text style={s.addBtnText}>+ Add</Text>
          </Pressable>
        ) : null}
      </View>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load rooms</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      {!access.canChooseDept ? (
        <View style={s.scopeBanner}>
          <Text style={s.scopeTitle}>{deptName(access.departmentId)}</Text>
          <Text style={s.scopeText}>
            {access.canEdit ? 'You can add, edit and remove rooms in your department.' : 'View only. Showing your department.'}
          </Text>
        </View>
      ) : null}

      <View style={s.statsRow}>
        <StatTile s={s} value={scoped.length} label="Rooms" color={c.primary} />
        <StatTile s={s} value={totalSeats} label="Seats" color={c.sky} />
        <StatTile s={s} value={labCount} label="Labs" color={c.amber} />
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput style={s.searchInput} placeholder="Search by room name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} keyboardShouldPersistTaps="handled">
        {['all', ...ROOM_TYPES].map((t) => {
          const active = typeFilter === t;
          return (
            <Pressable key={t} onPress={() => setTypeFilter(t)} style={[s.chip, active && s.chipActive]}>
              <Text style={[s.chipText, active && s.chipTextActive]}>{t === 'all' ? 'All types' : t}</Text>
            </Pressable>
          );
        })}
        {access.canChooseDept
          ? [{ id: 'all', name: 'All departments' }, ...departments].map((d) => {
              const active = deptFilter === d.id;
              return (
                <Pressable key={d.id} onPress={() => setDeptFilter(d.id)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
                </Pressable>
              );
            })
          : null}
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyCard text="No rooms match your search." />
      ) : (
        filtered.map((r) => {
          const isLab = r.type === 'Lab';
          const classes = usageOf(r.id).length;
          return (
            <Pressable key={r.id} onPress={() => setSelectedId(r.id)} style={({ pressed }) => [s.card, pressed && s.pressed]}>
              <View style={[s.roomTile, { backgroundColor: isLab ? c.amberSoft : c.skySoft }]}>
                <Text style={[s.roomTileText, { color: isLab ? c.amber : c.sky }]} numberOfLines={1}>
                  {r.name}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.tagRow}>
                  <View style={[s.tag, { backgroundColor: isLab ? c.amberSoft : c.skySoft }]}>
                    <Text style={[s.tagText, { color: isLab ? c.amber : c.sky }]}>{r.type}</Text>
                  </View>
                  <View style={[s.tag, { backgroundColor: c.mintSoft }]}>
                    <Text style={[s.tagText, { color: c.mint }]}>{classes} / week</Text>
                  </View>
                </View>
                <Text style={s.cardName} numberOfLines={1}>
                  {r.capacity} seats
                </Text>
                <Text style={s.cardMeta} numberOfLines={1}>
                  {deptName(r.departmentId)}
                </Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
};

const StatTile = ({ s, value, label, color }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    <Text style={s.statLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const HeroStat = ({ s, value, label }) => (
  <View style={s.heroStat}>
    <Text style={s.heroStatValue}>{value}</Text>
    <Text style={s.heroStatLabel}>{label}</Text>
  </View>
);

const Field = ({ s, label, error, children }) => (
  <View style={s.field}>
    <Text style={s.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={s.errorTextField}>{error}</Text> : null}
  </View>
);

export default RoomsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    addBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, ...shadow },
    addBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    errorTextField: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    scopeBanner: { backgroundColor: c.primarySoft, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 },
    scopeTitle: { fontSize: 13, fontWeight: '800', color: c.primary },
    scopeText: { fontSize: 11, color: c.text, marginTop: 3, lineHeight: 16 },

    statsRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 16 },
    statTile: { flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5, ...shadow },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3 },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 18, paddingHorizontal: 14, marginBottom: 12, ...shadow },
    searchIcon: { fontSize: 18, color: c.primary, marginRight: 8 },
    searchInput: { flex: 1, height: 48, color: c.text, fontSize: 14 },

    filterRow: { paddingBottom: 14 },
    chip: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, ...shadow },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 22, padding: 14, marginBottom: 12, ...shadow },
    roomTile: { width: 74, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 14, paddingHorizontal: 4 },
    roomTileText: { fontSize: 12, fontWeight: '800' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
    tag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
    tagText: { fontSize: 10, fontWeight: '800' },
    cardName: { fontSize: 14, fontWeight: '800', color: c.text },
    cardMeta: { fontSize: 11, color: c.muted, marginTop: 2 },
    chevron: { fontSize: 24, color: c.primary, marginLeft: 8 },

    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    hero: { backgroundColor: c.surface, borderRadius: 26, padding: 22, marginBottom: 6, ...shadow },
    heroPill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    heroPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    heroName: { fontSize: 24, fontWeight: '800', color: c.text, marginTop: 12 },
    heroMeta: { fontSize: 12, color: c.muted, marginTop: 3 },
    heroStats: { flexDirection: 'row', marginTop: 18, marginHorizontal: -6 },
    heroStat: { flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginHorizontal: 6 },
    heroStatValue: { fontSize: 18, fontWeight: '800', color: c.text },
    heroStatLabel: { fontSize: 9, color: c.muted, fontWeight: '700', marginTop: 3, textAlign: 'center' },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 18, marginBottom: 10 },
    rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 18, padding: 12, marginBottom: 10, ...shadow },
    dayBadge: { width: 50, height: 46, borderRadius: 14, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dayBadgeText: { fontSize: 11, fontWeight: '800', color: c.primary },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowMeta: { fontSize: 11, color: c.muted, marginTop: 3 },

    card2: { backgroundColor: c.surface, borderRadius: 22, padding: 16, ...shadow },
    dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dayName: { width: 36, fontSize: 12, fontWeight: '800', color: c.text },
    track: { flex: 1, height: 9, borderRadius: 5, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },
    dayFree: { width: 58, textAlign: 'right', fontSize: 11, color: c.muted, fontWeight: '700' },

    actionRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -5 },
    actionBtn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5 },
    actionText: { fontSize: 14, fontWeight: '800' },
    viewOnly: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 16 },

    field: { marginBottom: 18 },
    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    input: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, height: 50, color: c.text, fontSize: 14, borderWidth: 1, borderColor: c.border },
    lockedBox: { backgroundColor: c.primarySoft, borderRadius: 16, padding: 14 },
    lockedText: { fontSize: 14, fontWeight: '800', color: c.primary },
    lockedHint: { fontSize: 11, color: c.muted, marginTop: 4 },

    primaryBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 6, ...shadow },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },
    secondaryBtn: { backgroundColor: c.pinkSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },
  });