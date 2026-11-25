import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { DAYS } from '../data/sampleData';
import { useTheme } from '../theme/theme';
import { getAccess, inScope, ROLE } from '../utils/permissions';
import { supabase } from '../lib/supabase';
import { fetchFaculty, fetchDepartments, fetchTimetable, fetchUnavailableSlots, setSlotOff } from '../lib/data';
import { Chip, StatsRow, StatTile, ScopeBanner, EmptyCard } from '../components/ui';

// Five 2-hour blocks across the teaching day, by start hour
const BANDS = [
  { hour: 8, label: '08:00' },
  { hour: 10, label: '10:00' },
  { hour: 12, label: '12:00' },
  { hour: 14, label: '14:00' },
  { hour: 16, label: '16:00' },
];

const STATUS = {
  scheduled: { label: 'Booked', glyph: '●', bg: 'primarySoft', fg: 'primary' },
  available: { label: 'Free', glyph: '▲', bg: 'mintSoft', fg: 'mint' },
  unavailable: { label: 'Off', glyph: '■', bg: 'redSoft', fg: 'red' },
};

const toHours = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};

// True if a timetable class falls inside a 2-hour block on a given day
const overlaps = (t, day, band) => {
  if (t.day !== day) return false;
  const start = toHours(t.start);
  const end = start + t.durationMins / 60;
  return start < band.hour + 2 && end > band.hour;
};

const keyOf = (facultyId, day, hour) => `${facultyId}|${day}|${hour}`;

// Registrar: anyone. HOD: teachers in their department. Faculty: only themselves.
const canSetFor = (access, teacher, myFacultyId) => {
  if (!teacher) return false;
  if (access.role === ROLE.REGISTRAR) return true;
  if (access.role === ROLE.HOD) return inScope(access, teacher);
  return teacher.id === myFacultyId;
};

const AvailabilityScreen = ({ route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);
  const access = getAccess(route?.params);
  const isFaculty = access.role === ROLE.FACULTY;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [offSet, setOffSet] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());
  const [myFacultyId, setMyFacultyId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [fa, de, tt, off, auth] = await Promise.all([
        fetchFaculty(),
        fetchDepartments(),
        fetchTimetable(),
        fetchUnavailableSlots(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.data?.user?.email?.toLowerCase();
      setFaculty(fa);
      setDepartments(de);
      setEntries(tt);
      setOffSet(new Set(off.map((r) => keyOf(r.faculty_id, r.day, r.start_hour))));
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

  const teachers = faculty.filter((f) => (isFaculty ? f.id === myFacultyId : inScope(access, f)));
  const teacher = teachers.find((f) => f.id === selectedId) || teachers[0] || null;
  const editable = canSetFor(access, teacher, myFacultyId);

  const deptName = (id) => departments.find((d) => d.id === id)?.name || '';

  const bookedBy = (fid, day, band) =>
    entries.some((t) => t.facultyId === fid && overlaps(t, day, band));

  const statusOf = (day, band) => {
    if (!teacher) return 'available';
    if (bookedBy(teacher.id, day, band)) return 'scheduled';
    return offSet.has(keyOf(teacher.id, day, band.hour)) ? 'unavailable' : 'available';
  };

  const counts = { scheduled: 0, available: 0, unavailable: 0 };
  DAYS.forEach((d) => BANDS.forEach((b) => {
    counts[statusOf(d, b)] += 1;
  }));

  // Saves the change right away. If the save fails, the grid goes back to the saved state.
  const toggle = async (day, band) => {
    if (!teacher || !editable) return;
    const k = keyOf(teacher.id, day, band.hour);
    if (pending.has(k)) return;

    const nowOff = !offSet.has(k);

    setOffSet((prev) => {
      const next = new Set(prev);
      if (nowOff) next.add(k);
      else next.delete(k);
      return next;
    });
    setPending((prev) => new Set(prev).add(k));

    try {
      await setSlotOff({ facultyId: teacher.id, day, startHour: band.hour, off: nowOff });
    } catch (e) {
      setOffSet((prev) => {
        const next = new Set(prev);
        if (nowOff) next.delete(k);
        else next.add(k);
        return next;
      });
      Alert.alert('Could not save', e.message);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
    }
  };

  const onCellPress = (day, band) => {
    if (!teacher) return;
    if (bookedBy(teacher.id, day, band)) {
      Alert.alert('Booked', 'A class is scheduled here. Change it from the Timetable.');
      return;
    }
    if (!editable) return;
    toggle(day, band);
  };

  if (loading && faculty.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading availability…</Text>
      </View>
    );
  }

  if (!teacher) {
    return (
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Availability</Text>
        <Text style={s.subtitle}>{isFaculty ? 'Your availability' : 'Weekly availability by teacher'}</Text>
        <View style={{ height: 16 }} />
        <EmptyCard
          text={
            isFaculty
              ? 'Your login email does not match a teacher record yet. Ask the HOD to add your university email.'
              : 'No teachers in your scope yet.'
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Availability</Text>
      <Text style={s.subtitle}>{isFaculty ? 'Mark when you are free or off' : 'Weekly availability by teacher'}</Text>

      {loadError ? (
        <Pressable style={s.errorBox} onPress={load}>
          <Text style={s.errorTitle}>Could not load availability</Text>
          <Text style={s.errorText}>{loadError}</Text>
          <Text style={s.retry}>Tap to try again</Text>
        </Pressable>
      ) : null}

      <View style={{ height: 16 }} />

      {!isFaculty && access.canChooseDept ? null : (
        <ScopeBanner
          title={deptName(teacher.departmentId)}
          text={
            isFaculty
              ? 'Tap a free or off block to change it. Booked blocks come from your timetable.'
              : 'You can update teachers in this department.'
          }
        />
      )}

      {!isFaculty ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {teachers.map((f) => (
            <Chip
              key={f.id}
              label={f.name}
              sub={deptName(f.departmentId)}
              active={teacher.id === f.id}
              onPress={() => setSelectedId(f.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <StatsRow>
        <StatTile value={counts.available} label="Free" color={c.mint} />
        <StatTile value={counts.unavailable} label="Off" color={c.red} />
        <StatTile value={counts.scheduled} label="Booked" color={c.primary} />
      </StatsRow>

      <View style={s.card}>
        <View style={s.gridRow}>
          <View style={s.timeCol} />
          {DAYS.map((d) => (
            <Text key={d} style={s.dayHead}>
              {d}
            </Text>
          ))}
        </View>

        {BANDS.map((b) => (
          <View key={b.hour} style={s.gridRow}>
            <Text style={s.timeLabel}>{b.label}</Text>
            {DAYS.map((d) => {
              const st = STATUS[statusOf(d, b)];
              const busy = pending.has(keyOf(teacher.id, d, b.hour));
              return (
                <Pressable
                  key={d}
                  onPress={() => onCellPress(d, b)}
                  style={({ pressed }) => [
                    s.cell,
                    { backgroundColor: c[st.bg] },
                    pressed && s.cellPressed,
                    busy && s.cellBusy,
                  ]}
                >
                  <Text style={[s.cellGlyph, { color: c[st.fg] }]}>{busy ? '…' : st.glyph}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={s.legend}>
        {Object.values(STATUS).map((st) => (
          <View key={st.label} style={s.legendItem}>
            <Text style={[s.legendGlyph, { color: c[st.fg] }]}>{st.glyph}</Text>
            <Text style={s.legendText}>{st.label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.hint}>
        {editable ? 'Tap a free or off block to switch it. Changes are saved right away.' : 'View only. You can’t change this teacher’s availability.'}
      </Text>
    </ScrollView>
  );
};

export default AvailabilityScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    filterRow: { paddingBottom: 12 },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginTop: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 14, ...shadow },
    gridRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    timeCol: { width: 52 },
    dayHead: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 0.5 },
    timeLabel: { width: 52, fontSize: 10, fontWeight: '700', color: c.muted },
    cell: { flex: 1, height: 52, borderRadius: 14, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
    cellPressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
    cellBusy: { opacity: 0.6 },
    cellGlyph: { fontSize: 16, fontWeight: '800' },

    legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 9 },
    legendGlyph: { fontSize: 12, fontWeight: '800', marginRight: 5 },
    legendText: { fontSize: 11, color: c.muted, fontWeight: '700' },

    hint: { fontSize: 12, color: c.muted, textAlign: 'center', marginTop: 14 },
  });