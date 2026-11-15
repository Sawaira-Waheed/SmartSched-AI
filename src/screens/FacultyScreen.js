import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { FACULTY, DEPARTMENTS, COURSES, SECTIONS, TIMETABLE } from '../data/sampleData';
import { useTheme } from '../theme/theme';

const EMPTY_FORM = { name: '', email: '', departmentId: '', maxHoursPerWeek: '' };

// Hours per week = total minutes of this teacher's classes / 60
const weeklyHours = (facultyId) =>
  TIMETABLE.filter((t) => t.facultyId === facultyId).reduce((sum, t) => sum + t.durationMins, 0) / 60;

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';

const initialOf = (name) => name.replace(/^(Dr\.|Ms\.|Mr\.|Prof\.)\s*/, '').charAt(0).toUpperCase();

// Color for a load level: green when comfortable, amber when close, red when over.
const loadTone = (hours, max, c) => {
  if (hours > max) return { color: c.red, soft: c.redSoft, label: 'Overloaded' };
  if (hours / max > 0.85) return { color: c.amber, soft: c.amberSoft, label: 'Near limit' };
  return { color: c.mint, soft: c.mintSoft, label: 'Comfortable' };
};

const FacultyScreen = () => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [list, setList] = useState(FACULTY);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null, or { id: string|null, values: {...} }
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((f) => {
      const matchesDept = deptFilter === 'all' || f.departmentId === deptFilter;
      const matchesQuery = !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q);
      return matchesDept && matchesQuery;
    });
  }, [list, query, deptFilter]);

  const selected = list.find((f) => f.id === selectedId);

  // ---------- ACTIONS ----------

  const openAdd = () => {
    setErrors({});
    setEditing({ id: null, values: { ...EMPTY_FORM } });
  };

  const openEdit = (faculty) => {
    setErrors({});
    setEditing({
      id: faculty.id,
      values: {
        name: faculty.name,
        email: faculty.email,
        departmentId: faculty.departmentId,
        maxHoursPerWeek: String(faculty.maxHoursPerWeek),
      },
    });
  };

  const cancelForm = () => {
    setErrors({});
    setEditing(null);
  };

  const validate = (v) => {
    const e = {};
    if (!v.name.trim()) e.name = 'Name is required';
    if (!v.email.includes('@')) e.email = 'Enter a valid email';
    if (!v.departmentId) e.departmentId = 'Choose a department';
    const hours = Number(v.maxHoursPerWeek);
    if (!hours || hours < 1 || hours > 40) e.maxHoursPerWeek = 'Enter hours between 1 and 40';
    return e;
  };

  const saveForm = () => {
    const found = validate(editing.values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const record = {
      name: editing.values.name.trim(),
      email: editing.values.email.trim(),
      departmentId: editing.values.departmentId,
      maxHoursPerWeek: Number(editing.values.maxHoursPerWeek),
    };

    if (editing.id) {
      setList((prev) => prev.map((f) => (f.id === editing.id ? { ...f, ...record } : f)));
    } else {
      setList((prev) => [...prev, { id: `f${Date.now()}`, ...record }]);
    }
    setErrors({});
    setEditing(null);
  };

  const confirmDelete = (faculty) => {
    Alert.alert('Delete faculty', `Remove ${faculty.name} from the system?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setList((prev) => prev.filter((f) => f.id !== faculty.id));
          setSelectedId(null);
        },
      },
    ]);
  };

  // ---------- FORM VIEW ----------

  if (editing) {
    const isNew = !editing.id;
    const set = (key) => (value) =>
      setEditing((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={cancelForm} style={s.backRow}>
          <Text style={s.backText}>← Cancel</Text>
        </Pressable>

        <Text style={s.title}>{isNew ? 'Add faculty' : 'Edit faculty'}</Text>
        <Text style={s.subtitle}>Fill in the teacher's details</Text>

        <Field s={s} label="Full name" error={errors.name}>
          <TextInput
            style={s.input}
            placeholder="e.g. Dr. Ayesha Khan"
            placeholderTextColor={c.muted}
            value={editing.values.name}
            onChangeText={set('name')}
          />
        </Field>

        <Field s={s} label="University email" error={errors.email}>
          <TextInput
            style={s.input}
            placeholder="name@uni.edu"
            placeholderTextColor={c.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={editing.values.email}
            onChangeText={set('email')}
          />
        </Field>

        <Field s={s} label="Department" error={errors.departmentId}>
          <View style={s.chipWrap}>
            {DEPARTMENTS.map((d) => {
              const active = editing.values.departmentId === d.id;
              return (
                <Pressable key={d.id} onPress={() => set('departmentId')(d.id)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field s={s} label="Max hours per week" error={errors.maxHoursPerWeek}>
          <TextInput
            style={s.input}
            placeholder="e.g. 20"
            placeholderTextColor={c.muted}
            keyboardType="number-pad"
            value={editing.values.maxHoursPerWeek}
            onChangeText={set('maxHoursPerWeek')}
          />
        </Field>

        <Pressable style={s.primaryBtn} onPress={saveForm}>
          <Text style={s.primaryBtnText}>{isNew ? 'Add faculty' : 'Save changes'}</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={cancelForm}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- DETAILS VIEW ----------

  if (selected) {
    const hours = weeklyHours(selected.id);
    const max = selected.maxHoursPerWeek;
    const percent = Math.min((hours / max) * 100, 100);
    const tone = loadTone(hours, max, c);
    const classes = TIMETABLE.filter((t) => t.facultyId === selected.id).sort((a, b) => {
      const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      return order.indexOf(a.day) - order.indexOf(b.day) || a.start.localeCompare(b.start);
    });

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setSelectedId(null)} style={s.backRow}>
          <Text style={s.backText}>← All faculty</Text>
        </Pressable>

        {/* PROFILE */}
        <View style={s.profileWrap}>
          <View style={s.avatarLg}>
            <Text style={s.avatarLgText}>{initialOf(selected.name)}</Text>
          </View>
          <Text style={s.profileName} numberOfLines={1}>
            {selected.name}
          </Text>
          <Text style={s.profileMeta} numberOfLines={1}>
            {deptName(selected.departmentId)}
          </Text>
          <Text style={s.profileMeta} numberOfLines={1}>
            {selected.email}
          </Text>
        </View>

        {/* LOAD */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Weekly load</Text>
            <View style={[s.toneChip, { backgroundColor: tone.soft }]}>
              <Text style={[s.toneText, { color: tone.color }]}>{tone.label}</Text>
            </View>
          </View>

          <View style={s.loadNumbers}>
            <Text style={[s.loadBig, { color: tone.color }]}>{hours}</Text>
            <Text style={s.loadOf}>of {max} hrs</Text>
          </View>

          <View style={s.track}>
            <View style={[s.fill, { width: `${percent}%`, backgroundColor: tone.color }]} />
          </View>
        </View>

        {/* CLASSES */}
        <Text style={s.sectionLabel}>ASSIGNED CLASSES</Text>
        {classes.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No classes assigned yet.</Text>
          </View>
        ) : (
          classes.map((t) => {
            const course = COURSES.find((co) => co.id === t.courseId);
            const section = SECTIONS.find((sec) => sec.id === t.sectionId);
            return (
              <View key={t.id} style={s.classCard}>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeText}>{t.day.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.classTitle} numberOfLines={1}>
                    {course?.name}
                  </Text>
                  <Text style={s.classMeta} numberOfLines={1}>
                    {t.start} · {t.durationMins} min · {section?.name} · Room {t.roomId}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* ACTIONS */}
        <View style={s.actionRow}>
          <Pressable style={[s.actionBtn, { backgroundColor: c.primary }]} onPress={() => openEdit(selected)}>
            <Text style={[s.actionText, { color: c.white }]}>Edit</Text>
          </Pressable>
          <Pressable style={[s.actionBtn, { backgroundColor: c.redSoft }]} onPress={() => confirmDelete(selected)}>
            <Text style={[s.actionText, { color: c.red }]}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ---------- LIST VIEW ----------

  const overloaded = list.filter((f) => weeklyHours(f.id) > f.maxHoursPerWeek).length;
  const totalClasses = list.reduce((sum, f) => sum + TIMETABLE.filter((t) => t.facultyId === f.id).length, 0);

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* HEADER */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Faculty</Text>
          <Text style={s.subtitle}>Teachers, workload and assignments</Text>
        </View>
        <Pressable style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {/* STATS */}
      <View style={s.statsRow}>
        <StatTile s={s} value={list.length} label="Teachers" colorKey={c.primary} />
        <StatTile s={s} value={totalClasses} label="Classes" colorKey={c.sky} />
        <StatTile s={s} value={overloaded} label="Overloaded" colorKey={overloaded ? c.red : c.mint} />
      </View>

      {/* SEARCH */}
      <View style={s.searchBox}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* DEPARTMENT FILTER */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} keyboardShouldPersistTaps="handled">
        {[{ id: 'all', name: 'All departments' }, ...DEPARTMENTS].map((d) => {
          const active = deptFilter === d.id;
          return (
            <Pressable key={d.id} onPress={() => setDeptFilter(d.id)} style={[s.chip, active && s.chipActive]}>
              <Text style={[s.chipText, active && s.chipTextActive]}>{d.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* LIST */}
      {filtered.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>No faculty match your search.</Text>
        </View>
      ) : (
        filtered.map((f) => {
          const hours = weeklyHours(f.id);
          const percent = Math.min((hours / f.maxHoursPerWeek) * 100, 100);
          const tone = loadTone(hours, f.maxHoursPerWeek, c);
          return (
            <Pressable
              key={f.id}
              onPress={() => setSelectedId(f.id)}
              style={({ pressed }) => [s.card, s.listCard, pressed && s.pressed]}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initialOf(f.name)}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={s.rowBetween}>
                  <Text style={s.cardName} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <View style={[s.toneChip, { backgroundColor: tone.soft }]}>
                    <Text style={[s.toneText, { color: tone.color }]}>{tone.label}</Text>
                  </View>
                </View>
                <Text style={s.cardMeta} numberOfLines={1}>
                  {deptName(f.departmentId)}
                </Text>

                <View style={s.miniTrack}>
                  <View style={[s.miniFill, { width: `${percent}%`, backgroundColor: tone.color }]} />
                </View>
                <Text style={s.miniText}>
                  {hours} of {f.maxHoursPerWeek} hrs
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
};

const StatTile = ({ s, value, label, colorKey }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, { color: colorKey }]}>{value}</Text>
    <Text style={s.statLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const Field = ({ s, label, error, children }) => (
  <View style={s.field}>
    <Text style={s.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

export default FacultyScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    addBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 11,
      ...shadow,
    },
    addBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    // STATS
    statsRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 16 },
    statTile: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 5,
      ...shadow,
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3 },

    // SEARCH + FILTER
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingHorizontal: 14,
      marginBottom: 12,
      ...shadow,
    },
    searchIcon: { fontSize: 18, color: c.primary, marginRight: 8 },
    searchInput: { flex: 1, height: 48, color: c.text, fontSize: 14 },

    filterRow: { paddingBottom: 14 },
    chip: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      ...shadow,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    // LIST CARDS
    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 16,
      marginBottom: 12,
      ...shadow,
    },
    listCard: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    avatarText: { color: c.primary, fontSize: 18, fontWeight: '800' },
    cardName: { flex: 1, fontSize: 15, fontWeight: '800', color: c.text, marginRight: 8 },
    cardMeta: { fontSize: 11, color: c.muted, marginTop: 2 },

    toneChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    toneText: { fontSize: 10, fontWeight: '800' },

    miniTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, marginTop: 10, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 3 },
    miniText: { fontSize: 10, color: c.muted, marginTop: 5, fontWeight: '600' },

    emptyCard: { backgroundColor: c.surface, borderRadius: 22, padding: 24, alignItems: 'center', ...shadow },
    emptyText: { fontSize: 13, color: c.muted },

    // DETAILS
    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    profileWrap: { alignItems: 'center', marginBottom: 18 },
    avatarLg: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarLgText: { color: c.primary, fontSize: 32, fontWeight: '800' },
    profileName: { fontSize: 20, fontWeight: '800', color: c.text, maxWidth: '100%' },
    profileMeta: { fontSize: 12, color: c.muted, marginTop: 3, maxWidth: '100%' },

    loadNumbers: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
    loadBig: { fontSize: 34, fontWeight: '800' },
    loadOf: { fontSize: 13, color: c.muted, fontWeight: '700', marginLeft: 6 },
    track: { height: 10, borderRadius: 5, backgroundColor: c.surfaceAlt, marginTop: 12, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 6, marginBottom: 10 },

    classCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 12,
      marginBottom: 10,
      ...shadow,
    },
    dayBadge: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    dayBadgeText: { fontSize: 11, fontWeight: '800', color: c.primary },
    classTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    classMeta: { fontSize: 11, color: c.muted, marginTop: 3 },

    actionRow: { flexDirection: 'row', marginTop: 14, marginHorizontal: -5 },
    actionBtn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5 },
    actionText: { fontSize: 14, fontWeight: '800' },

    // FORM
    field: { marginBottom: 18 },
    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 50,
      color: c.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },

    primaryBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 6, ...shadow },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },
    secondaryBtn: { backgroundColor: c.pinkSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },

    title2: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle2: { fontSize: 12, color: c.muted },
  });