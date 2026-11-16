import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SECTIONS, DEPARTMENTS, COURSES, TIMETABLE, DAYS, FACULTY, ROOMS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope } from '../utils/permissions';

const EMPTY_FORM = { name: '', semester: '1', studentCount: '', departmentId: '' };
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';
const usageOf = (sectionId) => TIMETABLE.filter((t) => t.sectionId === sectionId);
const courseOf = (id) => COURSES.find((co) => co.id === id);
const facultyName = (id) => FACULTY.find((f) => f.id === id)?.name || '';
const roomName = (id) => ROOMS.find((r) => r.id === id)?.name || '';

const SectionsScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);

  const [list, setList] = useState(SECTIONS);
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null); // null, or { id: string|null, values: {...} }
  const [errors, setErrors] = useState({});

  // Only sections the user can see
  const scoped = list.filter((sec) => inScope(access, sec));
  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((sec) => {
    const deptOk = !access.canChooseDept || deptFilter === 'all' || sec.departmentId === deptFilter;
    return deptOk && (!q || sec.name.toLowerCase().includes(q));
  });

  const selected = scoped.find((sec) => sec.id === selectedId);
  const totalStudents = scoped.reduce((sum, sec) => sum + sec.studentCount, 0);
  const weeklyClasses = scoped.reduce((sum, sec) => sum + usageOf(sec.id).length, 0);

  // ---------- ACTIONS ----------

  const openAdd = () => {
    if (!access.canEdit) return;
    setErrors({});
    setEditing({ id: null, values: { ...EMPTY_FORM, departmentId: access.canChooseDept ? '' : access.departmentId } });
  };

  const openEdit = (sec) => {
    if (!access.canEdit || !inScope(access, sec)) return;
    setErrors({});
    setEditing({
      id: sec.id,
      values: {
        name: sec.name,
        semester: String(sec.semester),
        studentCount: String(sec.studentCount),
        departmentId: sec.departmentId,
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
      e.name = 'Section name is required';
    } else if (list.some((sec) => sec.name.toLowerCase() === name.toLowerCase() && sec.id !== id)) {
      e.name = 'This section name already exists';
    }

    const sem = Number(v.semester);
    if (!sem || sem < 1 || sem > 8) e.semester = 'Semester must be between 1 and 8';

    const students = Number(v.studentCount);
    if (!students || students < 1 || students > 300) e.studentCount = 'Enter a student count between 1 and 300';

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
      name: v.name.trim(),
      semester: Number(v.semester),
      studentCount: Number(v.studentCount),
      departmentId: v.departmentId,
    };

    if (editing.id) {
      setList((prev) => prev.map((sec) => (sec.id === editing.id ? { ...sec, ...record } : sec)));
    } else {
      setList((prev) => [...prev, { id: `s${Date.now()}`, ...record }]);
    }
    setErrors({});
    setEditing(null);
  };

  const confirmDelete = (sec) => {
    if (!access.canEdit || !inScope(access, sec)) return;

    const used = usageOf(sec.id).length;
    if (used > 0) {
      Alert.alert(
        'Cannot delete yet',
        `${sec.name} has ${used} timetable class${used > 1 ? 'es' : ''}. Remove those classes first.`,
      );
      return;
    }

    Alert.alert('Delete section', `Remove ${sec.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setList((prev) => prev.filter((x) => x.id !== sec.id));
          setSelectedId(null);
        },
      },
    ]);
  };

  // ---------- FORM ----------

  if (editing) {
    const isNew = !editing.id;
    const set = (key) => (value) => setEditing((prev) => ({ ...prev, values: { ...prev.values, [key]: value } }));

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={cancelForm} style={s.backRow}>
          <Text style={s.backText}>← Cancel</Text>
        </Pressable>

        <Text style={s.title}>{isNew ? 'Add section' : 'Edit section'}</Text>
        <Text style={s.subtitle}>Student group that attends classes together</Text>

        <Field s={s} label="Section name" error={errors.name}>
          <TextInput
            style={s.input}
            placeholder="e.g. CS-4A"
            placeholderTextColor={c.muted}
            autoCapitalize="characters"
            value={editing.values.name}
            onChangeText={set('name')}
          />
        </Field>

        <Field s={s} label="Semester" error={errors.semester}>
          <View style={s.chipWrap}>
            {SEMESTERS.map((n) => {
              const active = Number(editing.values.semester) === n;
              return (
                <Pressable key={n} onPress={() => set('semester')(String(n))} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field s={s} label="Number of students" error={errors.studentCount}>
          <TextInput
            style={s.input}
            placeholder="e.g. 40"
            placeholderTextColor={c.muted}
            keyboardType="number-pad"
            value={editing.values.studentCount}
            onChangeText={set('studentCount')}
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
              <Text style={s.lockedHint}>Your department. Sections are added here only.</Text>
            </View>
          )}
        </Field>

        <Pressable style={s.primaryBtn} onPress={saveForm}>
          <Text style={s.primaryBtnText}>{isNew ? 'Save section' : 'Save changes'}</Text>
        </Pressable>
        <Pressable style={s.secondaryBtn} onPress={cancelForm}>
          <Text style={s.secondaryBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- DETAILS ----------

  if (selected) {
    const uses = usageOf(selected.id);
    const courseIds = [...new Set(uses.map((t) => t.courseId))];
    const schedule = [...uses].sort(
      (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start),
    );

    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setSelectedId(null)} style={s.backRow}>
          <Text style={s.backText}>← All sections</Text>
        </Pressable>

        <View style={s.hero}>
          <View style={s.heroPill}>
            <Text style={s.heroPillText}>SEMESTER {selected.semester}</Text>
          </View>
          <Text style={s.heroName}>{selected.name}</Text>
          <Text style={s.heroMeta}>{deptName(selected.departmentId)}</Text>
          <View style={s.heroStats}>
            <HeroStat s={s} value={selected.studentCount} label="Students" />
            <HeroStat s={s} value={uses.length} label="Classes / week" />
            <HeroStat s={s} value={courseIds.length} label="Courses" />
          </View>
        </View>

        <Text style={s.sectionLabel}>COURSES</Text>
        {courseIds.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No courses scheduled for this section yet.</Text>
          </View>
        ) : (
          courseIds.map((id) => (
            <View key={id} style={s.rowCard}>
              <View style={s.codeTile}>
                <Text style={s.codeTileText}>{courseOf(id)?.code}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>
                  {courseOf(id)?.name}
                </Text>
                <Text style={s.rowMeta}>
                  {uses.filter((t) => t.courseId === id).length} class(es) per week
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={s.sectionLabel}>WEEKLY SCHEDULE</Text>
        {schedule.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>Nothing scheduled yet.</Text>
          </View>
        ) : (
          schedule.map((t) => (
            <View key={t.id} style={s.rowCard}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>{t.day.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>
                  {courseOf(t.courseId)?.name}
                </Text>
                <Text style={s.rowMeta} numberOfLines={1}>
                  {t.start} · {t.durationMins} min · Room {roomName(t.roomId)} · {facultyName(t.facultyId)}
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
          <Text style={s.viewOnly}>View only. Your role can't change section records.</Text>
        )}
      </ScrollView>
    );
  }

  // ---------- LIST ----------

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Sections</Text>
          <Text style={s.subtitle}>Student groups and their weekly classes</Text>
        </View>
        {access.canEdit ? (
          <Pressable style={s.addBtn} onPress={openAdd}>
            <Text style={s.addBtnText}>+ Add</Text>
          </Pressable>
        ) : null}
      </View>

      {!access.canChooseDept ? (
        <View style={s.scopeBanner}>
          <Text style={s.scopeTitle}>{deptName(access.departmentId)}</Text>
          <Text style={s.scopeText}>
            {access.canEdit ? 'You can add, edit and remove sections in your department.' : 'View only. Showing your department.'}
          </Text>
        </View>
      ) : null}

      <View style={s.statsRow}>
        <StatTile s={s} value={scoped.length} label="Sections" color={c.primary} />
        <StatTile s={s} value={totalStudents} label="Students" color={c.sky} />
        <StatTile s={s} value={weeklyClasses} label="Classes / wk" color={c.mint} />
      </View>

      <View style={s.searchBox}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput style={s.searchInput} placeholder="Search by section name" placeholderTextColor={c.muted} value={query} onChangeText={setQuery} />
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
          <Text style={s.emptyText}>No sections match your search.</Text>
        </View>
      ) : (
        filtered.map((sec) => {
          const classes = usageOf(sec.id).length;
          return (
            <Pressable key={sec.id} onPress={() => setSelectedId(sec.id)} style={({ pressed }) => [s.card, pressed && s.pressed]}>
              <View style={s.sectionTile}>
                <Text style={s.sectionTileText} numberOfLines={1}>
                  {sec.name}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.tagRow}>
                  <View style={[s.tag, { backgroundColor: c.primarySoft }]}>
                    <Text style={[s.tagText, { color: c.primary }]}>Semester {sec.semester}</Text>
                  </View>
                  <View style={[s.tag, { backgroundColor: c.mintSoft }]}>
                    <Text style={[s.tagText, { color: c.mint }]}>{classes} / week</Text>
                  </View>
                </View>
                <Text style={s.cardName} numberOfLines={1}>
                  {sec.studentCount} students
                </Text>
                <Text style={s.cardMeta} numberOfLines={1}>
                  {deptName(sec.departmentId)}
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
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

export default SectionsScreen;

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
    sectionTile: { width: 74, height: 64, borderRadius: 18, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14, paddingHorizontal: 4 },
    sectionTileText: { fontSize: 12, fontWeight: '800', color: c.primary },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
    tag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 4 },
    tagText: { fontSize: 10, fontWeight: '800' },
    cardName: { fontSize: 14, fontWeight: '800', color: c.text },
    cardMeta: { fontSize: 11, color: c.muted, marginTop: 2 },
    chevron: { fontSize: 24, color: c.primary, marginLeft: 8 },

    emptyCard: { backgroundColor: c.surface, borderRadius: 22, padding: 24, alignItems: 'center', marginBottom: 12, ...shadow },
    emptyText: { fontSize: 13, color: c.muted, textAlign: 'center' },

    backRow: { marginBottom: 14 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    hero: { backgroundColor: c.surface, borderRadius: 26, padding: 22, marginBottom: 6, ...shadow },
    heroPill: { alignSelf: 'flex-start', backgroundColor: c.primarySoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    heroPillText: { fontSize: 10, fontWeight: '800', color: c.primary, letterSpacing: 1 },
    heroName: { fontSize: 24, fontWeight: '800', color: c.text, marginTop: 12 },
    heroMeta: { fontSize: 12, color: c.muted, marginTop: 3 },
    heroStats: { flexDirection: 'row', marginTop: 18, marginHorizontal: -6 },
    heroStat: { flex: 1, backgroundColor: c.surfaceAlt, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginHorizontal: 6 },
    heroStatValue: { fontSize: 18, fontWeight: '800', color: c.text },
    heroStatLabel: { fontSize: 9, color: c.muted, fontWeight: '700', marginTop: 3, textAlign: 'center' },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 18, marginBottom: 10 },
    rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 18, padding: 12, marginBottom: 10, ...shadow },
    codeTile: { width: 62, height: 46, borderRadius: 14, backgroundColor: c.skySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    codeTileText: { fontSize: 11, fontWeight: '800', color: c.sky },
    dayBadge: { width: 50, height: 46, borderRadius: 14, backgroundColor: c.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dayBadgeText: { fontSize: 11, fontWeight: '800', color: c.primary },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowMeta: { fontSize: 11, color: c.muted, marginTop: 3 },

    actionRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -5 },
    actionBtn: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginHorizontal: 5 },
    actionText: { fontSize: 14, fontWeight: '800' },
    viewOnly: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 16 },

    field: { marginBottom: 18 },
    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    input: { backgroundColor: c.surface, borderRadius: 16, paddingHorizontal: 14, height: 50, color: c.text, fontSize: 14, borderWidth: 1, borderColor: c.border },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },
    lockedBox: { backgroundColor: c.primarySoft, borderRadius: 16, padding: 14 },
    lockedText: { fontSize: 14, fontWeight: '800', color: c.primary },
    lockedHint: { fontSize: 11, color: c.muted, marginTop: 4 },

    title2: { display: 'none' },
    primaryBtn: { backgroundColor: c.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 6, ...shadow },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },
    secondaryBtn: { backgroundColor: c.pinkSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    secondaryBtnText: { color: c.pink, fontSize: 14, fontWeight: '800' },
  });