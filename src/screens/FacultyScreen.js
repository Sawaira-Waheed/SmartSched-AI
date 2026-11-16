import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { FACULTY, DEPARTMENTS, TIMETABLE } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';

const EMPTY_FORM = { name: '', email: '', departmentId: '', maxHoursPerWeek: '' };

const classesOf = (facultyId) => TIMETABLE.filter((t) => t.facultyId === facultyId);

const weeklyHours = (facultyId) =>
  classesOf(facultyId).reduce((sum, t) => sum + t.durationMins, 0) / 60;

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';

const initialOf = (name) => name.replace(/^(Dr\.|Ms\.|Mr\.|Prof\.)\s*/, '').charAt(0).toUpperCase();

const loadTone = (hours, max, c) => {
  if (hours > max) return { color: c.red, soft: c.redSoft, label: 'Overloaded' };
  if (hours / max > 0.85) return { color: c.amber, soft: c.amberSoft, label: 'Near limit' };
  return { color: c.mint, soft: c.mintSoft, label: 'Comfortable' };
};

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const FacultyScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [list, setList] = useState(FACULTY);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null, or { id: string|null, values: {...} }
  const [errors, setErrors] = useState({});

  // Only the teachers this user is allowed to see
  const scoped = list.filter((f) => inScope(access, f));

  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((f) => {
    const matchesDept = !access.canChooseDept || deptFilter === 'all' || f.departmentId === deptFilter;
    const matchesQuery = !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q);
    return matchesDept && matchesQuery;
  });

  const selected = scoped.find((f) => f.id === selectedId);
  const overloaded = scoped.filter((f) => weeklyHours(f.id) > f.maxHoursPerWeek).length;
  const totalClasses = scoped.reduce((sum, f) => sum + classesOf(f.id).length, 0);

  // ---------- ACTIONS ----------

  const openAdd = () => {
    if (!access.canEdit) return;
    setErrors({});
    setEditing({
      id: null,
      values: { ...EMPTY_FORM, departmentId: access.canChooseDept ? '' : access.departmentId },
    });
  };

  const openEdit = (faculty) => {
    if (!access.canEdit || !inScope(access, faculty)) return;
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
    if (!v.departmentId) {
      e.departmentId = 'Choose a department';
    } else if (!access.canChooseDept && v.departmentId !== access.departmentId) {
      e.departmentId = 'You can only manage your own department';
    }
    const hours = Number(v.maxHoursPerWeek);
    if (!hours || hours < 1 || hours > 40) e.maxHoursPerWeek = 'Enter hours between 1 and 40';
    return e;
  };

  const saveForm = () => {
    if (!access.canEdit) return;
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
    if (!access.canEdit || !inScope(access, faculty)) return;

    const assigned = classesOf(faculty.id).length;
    if (assigned > 0) {
      Alert.alert(
        'Cannot delete yet',
        `${faculty.name} teaches ${assigned} class${assigned > 1 ? 'es' : ''}. Reassign ${
          assigned > 1 ? 'them' : 'it'
        } in Timetable first.`,
      );
      return;
    }

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
          {access.canChooseDept ? (
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
          ) : (
            <View style={s.lockedBox}>
              <Text style={s.lockedText}>{deptName(access.departmentId)}</Text>
              <Text style={s.lockedHint}>Your department. Teachers are added here only.</Text>
            </View>
          )}
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
    const classes = classesOf(selected.id).sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start.localeCompare(b.start),
    );

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setSelectedId(null)} style={s.backRow}>
          <Text style={s.backText}>← All faculty</Text>
        </Pressable>

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

        <Text style={s.sectionLabel}>ASSIGNED CLASSES</Text>
        {classes.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No classes assigned yet.</Text>
          </View>
        ) : (
          classes.map((t) => {
            const course = COURSES_BY_ID[t.courseId];
            const sectionName = SECTIONS_BY_ID[t.sectionId];
            return (
              <View key={t.id} style={s.classCard}>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeText}>{t.day.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.classTitle} numberOfLines={1}>
                    {course || 'Course'}
                  </Text>
                  <Text style={s.classMeta} numberOfLines={1}>
                    {t.start} · {t.durationMins} min · {sectionName} · Room {t.roomId}
                  </Text>
                </View>
              </View>
            );
          })
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
          <Text style={s.viewOnly}>View only. Your role can't change teacher records.</Text>
        )}
      </ScrollView>
    );
  }

  // ---------- LIST VIEW ----------

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Faculty</Text>
          <Text style={s.subtitle}>Teachers, workload and assignments</Text>
        </View>
        {access.canEdit ? (
          <Pressable style={s.addBtn} onPress={openAdd}>
            <Text style={s.addBtnText}>+ Add</Text>
          </Pressable>
        ) : null}
      </View>

      {access.canChooseDept ? null : (
        <View style={s.scopeBanner}>
          <Text style={s.scopeTitle}>{deptName(access.departmentId)}</Text>
          <Text style={s.scopeText}>
            {access.canEdit
              ? 'You can add, edit and remove teachers in your department.'
              : 'View only. Showing teachers in your department.'}
          </Text>
        </View>
      )}

      <View style={s.statsRow}>
        <StatTile s={s} value={scoped.length} label="Teachers" color={c.primary} />
        <StatTile s={s} value={totalClasses} label="Classes" color={c.sky} />
        <StatTile s={s} value={overloaded} label="Overloaded" color={overloaded ? c.red : c.mint} />
      </View>

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

      {access.canChooseDept ? (
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
      ) : null}

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

const StatTile = ({ s, value, label, color }) => (
  <View style={s.statTile}>
    <Text style={[s.statValue, { color }]}>{value}</Text>
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

// Lookups used in the details view
import { COURSES, SECTIONS } from '../data/sampleData';
const COURSES_BY_ID = Object.fromEntries(COURSES.map((co) => [co.id, co.name]));
const SECTIONS_BY_ID = Object.fromEntries(SECTIONS.map((sec) => [sec.id, sec.name]));

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    addBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, ...shadow },
    addBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    scopeBanner: {
      backgroundColor: c.primarySoft,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    scopeTitle: { fontSize: 13, fontWeight: '800', color: c.primary },
    scopeText: { fontSize: 11, color: c.text, marginTop: 3, lineHeight: 16 },

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
    chip: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, ...shadow },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    card: { backgroundColor: c.surface, borderRadius: 22, padding: 16, marginBottom: 12, ...shadow },
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
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },

    toneChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    toneText: { fontSize: 10, fontWeight: '800' },

    miniTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, marginTop: 10, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 3 },
    miniText: { fontSize: 10, color: c.muted, marginTop: 5, fontWeight: '600' },

    emptyCard: { backgroundColor: c.surface, borderRadius: 22, padding: 24, alignItems: 'center', ...shadow },
    emptyText: { fontSize: 13, color: c.muted },

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

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 14, marginBottom: 10 },

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
    viewOnly: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 16 },

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

    lockedBox: { backgroundColor: c.primarySoft, borderRadius: 16, padding: 14 },
    lockedText: { fontSize: 14, fontWeight: '800', color: c.primary },
    lockedHint: { fontSize: 11, color: c.muted, marginTop: 4 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 6,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },
    secondaryBtn: { backgroundColor: c.pinkSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },
  });