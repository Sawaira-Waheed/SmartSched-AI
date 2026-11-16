import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { COURSES, DEPARTMENTS, TIMETABLE, SECTIONS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';

const DURATIONS = [60, 90, 120, 180];
const ROOM_TYPES = ['Lecture', 'Lab'];

const EMPTY_FORM = {
  code: '',
  name: '',
  creditHours: '3',
  departmentId: '',
  classesPerDay: '1',
  durationMins: 60,
  roomType: 'Lecture',
};

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';
const usageOf = (courseId) => TIMETABLE.filter((t) => t.courseId === courseId);
const sectionName = (id) => SECTIONS.find((sec) => sec.id === id)?.name || '';

const CoursesScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [list, setList] = useState(COURSES);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null, or { id: string|null, values: {...} }
  const [errors, setErrors] = useState({});

  // Only the courses this user is allowed to see
  const scoped = list.filter((co) => inScope(access, co));

  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((co) => {
    const matchesDept = !access.canChooseDept || deptFilter === 'all' || co.departmentId === deptFilter;
    const matchesQuery = !q || co.name.toLowerCase().includes(q) || co.code.toLowerCase().includes(q);
    return matchesDept && matchesQuery;
  });

  const selected = scoped.find((co) => co.id === selectedId);
  const totalCredits = scoped.reduce((sum, co) => sum + co.creditHours, 0);
  const labCount = scoped.filter((co) => co.roomType === 'Lab').length;

  // ---------- ACTIONS ----------

  const openAdd = () => {
    if (!access.canEdit) return;
    setErrors({});
    setEditing({
      id: null,
      values: { ...EMPTY_FORM, departmentId: access.canChooseDept ? '' : access.departmentId },
    });
  };

  const openEdit = (course) => {
    if (!access.canEdit || !inScope(access, course)) return;
    setErrors({});
    setEditing({
      id: course.id,
      values: {
        code: course.code,
        name: course.name,
        creditHours: String(course.creditHours),
        departmentId: course.departmentId,
        classesPerDay: String(course.classesPerDay),
        durationMins: course.durationMins,
        roomType: course.roomType,
      },
    });
  };

  const cancelForm = () => {
    setErrors({});
    setEditing(null);
  };

  const validate = (v, id) => {
    const e = {};
    const code = v.code.trim().toUpperCase();
    if (!code) {
      e.code = 'Course code is required';
    } else if (list.some((co) => co.code === code && co.id !== id)) {
      e.code = 'This code is already used';
    }

    if (!v.name.trim()) e.name = 'Course name is required';

    const credits = Number(v.creditHours);
    if (!credits || credits < 1 || credits > 6) e.creditHours = 'Credit hours must be between 1 and 6';

    const perDay = Number(v.classesPerDay);
    if (!perDay || perDay < 1 || perDay > 4) e.classesPerDay = 'Classes per day must be between 1 and 4';

    if (!v.departmentId) {
      e.departmentId = 'Choose a department';
    } else if (!access.canChooseDept && v.departmentId !== access.departmentId) {
      e.departmentId = 'You can only manage your own department';
    }
    return e;
  };

  const saveForm = () => {
    if (!access.canEdit) return;
    const v = editing.values;
    const found = validate(v, editing.id);
    setErrors(found);
    if (Object.keys(found).length) return;

    const record = {
      code: v.code.trim().toUpperCase(),
      name: v.name.trim(),
      creditHours: Number(v.creditHours),
      departmentId: v.departmentId,
      classesPerDay: Number(v.classesPerDay),
      durationMins: v.durationMins,
      roomType: v.roomType,
    };

    if (editing.id) {
      setList((prev) => prev.map((co) => (co.id === editing.id ? { ...co, ...record } : co)));
    } else {
      setList((prev) => [...prev, { id: `c${Date.now()}`, ...record }]);
    }
    setErrors({});
    setEditing(null);
  };

  const confirmDelete = (course) => {
    if (!access.canEdit || !inScope(access, course)) return;

    const used = usageOf(course.id).length;
    if (used > 0) {
      Alert.alert(
        'Cannot delete yet',
        `${course.name} is scheduled in ${used} timetable class${used > 1 ? 'es' : ''}. Remove those classes first.`,
      );
      return;
    }

    Alert.alert('Delete course', `Remove ${course.name} (${course.code})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setList((prev) => prev.filter((co) => co.id !== course.id));
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

        <Text style={s.title}>{isNew ? 'Add course' : 'Edit course'}</Text>
        <Text style={s.subtitle}>Details used when scheduling classes</Text>

        <Field s={s} label="Course code" error={errors.code}>
          <TextInput
            style={s.input}
            placeholder="e.g. CS-401"
            placeholderTextColor={c.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            value={editing.values.code}
            onChangeText={set('code')}
          />
        </Field>

        <Field s={s} label="Course name" error={errors.name}>
          <TextInput
            style={s.input}
            placeholder="e.g. Computer Networks"
            placeholderTextColor={c.muted}
            value={editing.values.name}
            onChangeText={set('name')}
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
              <Text style={s.lockedHint}>Your department. Courses are added here only.</Text>
            </View>
          )}
        </Field>

        <View style={s.twoCol}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field s={s} label="Credit hours" error={errors.creditHours}>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={editing.values.creditHours}
                onChangeText={set('creditHours')}
              />
            </Field>
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Field s={s} label="Classes per day" error={errors.classesPerDay}>
              <TextInput
                style={s.input}
                keyboardType="number-pad"
                value={editing.values.classesPerDay}
                onChangeText={set('classesPerDay')}
              />
            </Field>
          </View>
        </View>

        <Text style={s.fieldLabel}>Preferred duration</Text>
        <View style={[s.chipWrap, { marginBottom: 18 }]}>
          {DURATIONS.map((d) => {
            const active = editing.values.durationMins === d;
            return (
              <Pressable key={d} onPress={() => set('durationMins')(d)} style={[s.chip, active && s.chipActive]}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{d} min</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.fieldLabel}>Room type</Text>
        <View style={[s.chipWrap, { marginBottom: 18 }]}>
          {ROOM_TYPES.map((r) => {
            const active = editing.values.roomType === r;
            return (
              <Pressable key={r} onPress={() => set('roomType')(r)} style={[s.chip, active && s.chipActive]}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={s.primaryBtn} onPress={saveForm}>
          <Text style={s.primaryBtnText}>{isNew ? 'Save course' : 'Save changes'}</Text>
        </Pressable>

        <Pressable style={s.secondaryBtn} onPress={cancelForm}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- DETAILS VIEW ----------

  if (selected) {
    const uses = usageOf(selected.id);

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setSelectedId(null)} style={s.backRow}>
          <Text style={s.backText}>← All courses</Text>
        </Pressable>

        <View style={s.hero}>
          <View style={s.codePill}>
            <Text style={s.codePillText}>{selected.code}</Text>
          </View>
          <Text style={s.heroName}>{selected.name}</Text>
          <Text style={s.heroMeta}>{deptName(selected.departmentId)}</Text>
        </View>

        <View style={s.infoGrid}>
          <InfoTile s={s} label="Credit hours" value={selected.creditHours} color={c.primary} />
          <InfoTile s={s} label="Classes per day" value={selected.classesPerDay} color={c.sky} />
          <InfoTile s={s} label="Duration" value={`${selected.durationMins} min`} color={c.mint} />
          <InfoTile
            s={s}
            label="Room type"
            value={selected.roomType}
            color={selected.roomType === 'Lab' ? c.amber : c.pink}
          />
        </View>

        <Text style={s.sectionLabel}>SCHEDULED CLASSES</Text>
        {uses.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>Not scheduled yet. Add it from the Timetable screen.</Text>
          </View>
        ) : (
          uses.map((t) => (
            <View key={t.id} style={s.useRow}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>{t.day.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.useTitle} numberOfLines={1}>
                  {sectionName(t.sectionId)} · {t.start}
                </Text>
                <Text style={s.useMeta} numberOfLines={1}>
                  Room {t.roomId}
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
          <Text style={s.viewOnly}>View only. Your role can't change course records.</Text>
        )}
      </ScrollView>
    );
  }

  // ---------- LIST VIEW ----------

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Courses</Text>
          <Text style={s.subtitle}>Subjects, credits and room needs</Text>
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
              ? 'You can add, edit and remove courses in your department.'
              : 'View only. Showing courses in your department.'}
          </Text>
        </View>
      )}

      <View style={s.statsRow}>
        <StatTile s={s} value={scoped.length} label="Courses" color={c.primary} />
        <StatTile s={s} value={totalCredits} label="Credit hours" color={c.sky} />
        <StatTile s={s} value={labCount} label="Labs" color={c.amber} />
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or code"
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
          <Text style={s.emptyText}>No courses match your search.</Text>
        </View>
      ) : (
        filtered.map((co) => (
          <Pressable
            key={co.id}
            onPress={() => setSelectedId(co.id)}
            style={({ pressed }) => [s.card, pressed && s.pressed]}
          >
            <View style={s.codeTile}>
              <Text style={s.codeTileText} numberOfLines={1}>
                {co.code}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={s.cardName} numberOfLines={1}>
                {co.name}
              </Text>
              <Text style={s.cardMeta} numberOfLines={1}>
                {deptName(co.departmentId)}
              </Text>

              <View style={s.tagRow}>
                <View style={[s.tag, { backgroundColor: c.primarySoft }]}>
                  <Text style={[s.tagText, { color: c.primary }]}>{co.creditHours} cr</Text>
                </View>
                <View style={[s.tag, { backgroundColor: co.roomType === 'Lab' ? c.amberSoft : c.skySoft }]}>
                  <Text style={[s.tagText, { color: co.roomType === 'Lab' ? c.amber : c.sky }]}>{co.roomType}</Text>
                </View>
                <View style={[s.tag, { backgroundColor: c.surfaceAlt }]}>
                  <Text style={[s.tagText, { color: c.muted }]}>{co.durationMins} min</Text>
                </View>
              </View>
            </View>

            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))
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

const InfoTile = ({ s, label, value, color }) => (
  <View style={s.infoTile}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, { color }]} numberOfLines={1}>
      {value}
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

export default CoursesScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    addBtn: { backgroundColor: c.primary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 11, ...shadow },
    addBtnText: { color: c.white, fontSize: 13, fontWeight: '800' },

    scopeBanner: { backgroundColor: c.primarySoft, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 },
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
    chip: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8, marginBottom: 8, ...shadow },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 14,
      marginBottom: 12,
      ...shadow,
    },
    codeTile: {
      width: 64,
      height: 64,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      paddingHorizontal: 4,
    },
    codeTileText: { fontSize: 11, fontWeight: '800', color: c.primary },
    cardName: { fontSize: 15, fontWeight: '800', color: c.text },
    cardMeta: { fontSize: 11, color: c.muted, marginTop: 2 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    tag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
    tagText: { fontSize: 10, fontWeight: '800' },
    chevron: { fontSize: 24, color: c.primary, marginLeft: 8 },

    emptyCard: { backgroundColor: c.surface, borderRadius: 22, padding: 24, alignItems: 'center', ...shadow },
    emptyText: { fontSize: 13, color: c.muted, textAlign: 'center' },

    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    hero: { backgroundColor: c.surface, borderRadius: 26, padding: 22, alignItems: 'center', marginBottom: 16, ...shadow },
    codePill: { backgroundColor: c.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
    codePillText: { fontSize: 12, fontWeight: '800', color: c.primary, letterSpacing: 0.5 },
    heroName: { fontSize: 20, fontWeight: '800', color: c.text, marginTop: 12, textAlign: 'center' },
    heroMeta: { fontSize: 12, color: c.muted, marginTop: 4 },

    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 6 },
    infoTile: {
      width: '47%',
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 14,
      margin: 5,
      ...shadow,
    },
    infoLabel: { fontSize: 10, color: c.muted, fontWeight: '700' },
    infoValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 14, marginBottom: 10 },
    useRow: {
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
    useTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    useMeta: { fontSize: 11, color: c.muted, marginTop: 3 },

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
    twoCol: { flexDirection: 'row' },

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