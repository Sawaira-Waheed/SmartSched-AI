import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FACULTY, DEPARTMENTS, COURSES, SECTIONS, TIMETABLE } from '../data/sampleData';

const C = {
  bg: '#060A14',
  surface: '#0E1626',
  surfaceHi: '#15203A',
  border: '#1C2A47',
  blue: '#4F7CFF',
  lavender: '#A9B6FF',
  green: '#2BD39A',
  amber: '#FFB547',
  red: '#FF5C7A',
  white: '#FFFFFF',
  text: '#E9EEFA',
  muted: '#7D8AA6',
};

const EMPTY_FORM = { name: '', email: '', departmentId: '', maxHoursPerWeek: '' };

// Hours per week = total minutes of this teacher's classes / 60
const weeklyHours = (facultyId) =>
  TIMETABLE.filter((t) => t.facultyId === facultyId).reduce((sum, t) => sum + t.durationMins, 0) / 60;

const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || 'Unassigned';

const initialOf = (name) => name.replace(/^(Dr\.|Ms\.|Mr\.|Prof\.)\s*/, '').charAt(0).toUpperCase();

const FacultyScreen = () => {
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
      const matchesQuery =
        !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q);
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setEditing(null)} style={styles.backRow}>
          <Text style={styles.backText}>← Cancel</Text>
        </Pressable>

        <Text style={styles.title}>{isNew ? 'Add faculty' : 'Edit faculty'}</Text>
        <Text style={styles.subtitle}>Fill in the teacher's details</Text>

        <Field label="Full name" error={errors.name}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dr. Ayesha Khan"
            placeholderTextColor={C.muted}
            value={editing.values.name}
            onChangeText={set('name')}
          />
        </Field>

        <Field label="University email" error={errors.email}>
          <TextInput
            style={styles.input}
            placeholder="name@uni.edu"
            placeholderTextColor={C.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={editing.values.email}
            onChangeText={set('email')}
          />
        </Field>

        <Field label="Department" error={errors.departmentId}>
          <View style={styles.chipWrap}>
            {DEPARTMENTS.map((d) => {
              const active = editing.values.departmentId === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => set('departmentId')(d.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Max hours per week" error={errors.maxHoursPerWeek}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 20"
            placeholderTextColor={C.muted}
            keyboardType="number-pad"
            value={editing.values.maxHoursPerWeek}
            onChangeText={set('maxHoursPerWeek')}
          />
        </Field>

        <Pressable style={styles.primaryButton} onPress={saveForm}>
          <Text style={styles.primaryButtonText}>{isNew ? 'Add faculty' : 'Save changes'}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---------- DETAILS VIEW ----------

  if (selected) {
    const hours = weeklyHours(selected.id);
    const max = selected.maxHoursPerWeek;
    const percent = Math.min((hours / max) * 100, 100);
    const loadColor = hours > max ? C.red : hours / max > 0.85 ? C.amber : C.green;
    const classes = TIMETABLE.filter((t) => t.facultyId === selected.id);

    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSelectedId(null)} style={styles.backRow}>
          <Text style={styles.backText}>← All faculty</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{initialOf(selected.name)}</Text>
          </View>
          <Text style={styles.heroName}>{selected.name}</Text>
          <Text style={styles.heroMeta}>{deptName(selected.departmentId)}</Text>
          <Text style={styles.heroMeta}>{selected.email}</Text>

          <View style={styles.loadRow}>
            <Text style={styles.loadLabel}>Weekly load</Text>
            <Text style={[styles.loadValue, { color: loadColor }]}>
              {hours} / {max} hrs
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%`, backgroundColor: loadColor }]} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>ASSIGNED CLASSES</Text>
        {classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes assigned yet.</Text>
          </View>
        ) : (
          classes.map((t) => {
            const course = COURSES.find((c) => c.id === t.courseId);
            const section = SECTIONS.find((s) => s.id === t.sectionId);
            return (
              <View key={t.id} style={styles.classCard}>
                <View style={styles.classBar} />
                <View style={styles.classBody}>
                  <Text style={styles.classTitle}>{course?.name}</Text>
                  <Text style={styles.classMeta}>
                    {t.day} · {t.start} · {t.durationMins} min · {section?.name} · Room {t.roomId}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => openEdit(selected)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmDelete(selected)}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ---------- LIST VIEW ----------

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Faculty</Text>
          <Text style={styles.subtitle}>{list.length} teachers across departments</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {[{ id: 'all', name: 'All departments' }, ...DEPARTMENTS].map((d) => {
          const active = deptFilter === d.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => setDeptFilter(d.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No faculty match your search.</Text>
        </View>
      ) : (
        filtered.map((f) => {
          const hours = weeklyHours(f.id);
          const percent = Math.min((hours / f.maxHoursPerWeek) * 100, 100);
          const color = hours > f.maxHoursPerWeek ? C.red : percent > 85 ? C.amber : C.green;
          return (
            <Pressable
              key={f.id}
              onPress={() => setSelectedId(f.id)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialOf(f.name)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{f.name}</Text>
                <Text style={styles.cardMeta}>{deptName(f.departmentId)}</Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${percent}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.miniText}>
                  {hours} of {f.maxHoursPerWeek} hrs this week
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
};

const Field = ({ label, error, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export default FacultyScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  title: { fontSize: 24, fontWeight: '800', color: C.white },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 3 },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },

  addBtn: {
    backgroundColor: C.blue,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 18, color: C.muted, marginRight: 8 },
  searchInput: { flex: 1, height: 46, color: C.text, fontSize: 14 },

  filterRow: { paddingBottom: 14 },

  chip: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontSize: 12, fontWeight: '700', color: C.muted },
  chipTextActive: { color: C.white },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: C.bg, fontSize: 18, fontWeight: '800' },

  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', color: C.text },
  cardMeta: { fontSize: 11, color: C.muted, marginTop: 2 },

  miniTrack: {
    height: 5,
    backgroundColor: C.surfaceHi,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  miniFill: { height: '100%', borderRadius: 3 },
  miniText: { fontSize: 10, color: C.muted, marginTop: 5 },

  chevron: { fontSize: 24, color: C.muted, marginLeft: 8 },

  emptyCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: C.muted },

  backRow: { marginBottom: 14 },
  backText: { fontSize: 13, fontWeight: '700', color: C.lavender },

  heroCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLg: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLgText: { color: C.bg, fontSize: 28, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', color: C.white },
  heroMeta: { fontSize: 12, color: C.muted, marginTop: 3 },

  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 18,
  },
  loadLabel: { fontSize: 12, color: C.muted, fontWeight: '700' },
  loadValue: { fontSize: 12, fontWeight: '800' },

  track: {
    height: 8,
    alignSelf: 'stretch',
    backgroundColor: C.surfaceHi,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  classCard: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  classBar: { width: 4, backgroundColor: C.blue },
  classBody: { flex: 1, padding: 14 },
  classTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  classMeta: { fontSize: 11, color: C.muted, marginTop: 4 },

  actionRow: { flexDirection: 'row', marginTop: 16 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtn: { backgroundColor: C.blue, marginRight: 8 },
  editText: { color: C.white, fontWeight: '800', fontSize: 14 },
  deleteBtn: { borderWidth: 1, borderColor: 'rgba(255,92,122,0.5)' },
  deleteText: { color: C.red, fontWeight: '800', fontSize: 14 },

  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.lavender,
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    color: C.text,
    fontSize: 14,
  },
  errorText: { fontSize: 11, color: C.red, marginTop: 6 },

  primaryButton: {
    backgroundColor: C.blue,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: { color: C.white, fontSize: 15, fontWeight: '800' },
});