import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/theme';
import { supabase } from '../lib/supabase';
import {
  fetchFaculty,
  fetchDepartments,
  fetchCourses,
  fetchSections,
  fetchRooms,
  fetchTimetable,
  fetchUnavailableSlots,
} from '../lib/data';
import { findConflicts } from '../utils/conflicts';
import { getAccess, inScope, ROLE } from '../utils/permissions';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_INNER_W = SCREEN_W - 40 - 36;

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOT_LABELS = ['8AM', '10AM', '12PM', '2PM', '4PM'];
const SLOT_HOURS = [8, 10, 12, 14, 16];
const WEEK_MINUTES = 5 * 9 * 60;

const toHours = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const useStyles = () => {
  const { c, shadow } = useTheme();
  return useMemo(() => makeStyles(c, shadow), [c, shadow]);
};

// ---------- CHART PIECES ----------

const GradientDef = ({ id, colors, vertical = false }) => (
  <Defs>
    <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2="1">
      <Stop offset="0" stopColor={colors[0]} />
      <Stop offset="1" stopColor={colors[1]} />
    </LinearGradient>
  </Defs>
);

const Donut = ({ id, value, size = 120, stroke = 12, gradient, track, children }) => {
  const s = useStyles();
  const center = size / 2;
  const r = center - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <GradientDef id={id} colors={gradient} />
        <Circle cx={center} cy={center} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={s.donutCenter}>{children}</View>
    </View>
  );
};

const Sparkline = ({ id, data, color, width = 110, height = 40 }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i * width) / (data.length - 1),
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${id})`} />
      <Path d={line} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const WeekBars = ({ values, labels }) => {
  const { c } = useTheme();
  const H = 110;
  const gap = 12;
  const n = values.length;
  const barW = (CARD_INNER_W - gap * (n - 1)) / n;
  const max = Math.max(...values, 1);
  const peakIndex = values.indexOf(Math.max(...values));

  return (
    <Svg width={CARD_INNER_W} height={H + 30}>
      <GradientDef id="weekBlue" colors={c.grad.primary} vertical />
      <GradientDef id="weekPeak" colors={c.grad.mint} vertical />
      {values.map((v, i) => {
        const h = Math.max(10, (v / max) * H);
        const x = i * (barW + gap);
        const isPeak = i === peakIndex && v > 0;
        return (
          <React.Fragment key={labels[i]}>
            <Rect x={x} y={H - h} width={barW} height={h} rx={10} fill={isPeak ? 'url(#weekPeak)' : 'url(#weekBlue)'} />
            <SvgText x={x + barW / 2} y={H - h - 7} fontSize="11" fontWeight="700" fill={isPeak ? c.mint : c.muted} textAnchor="middle">
              {v}
            </SvgText>
            <SvgText x={x + barW / 2} y={H + 20} fontSize="11" fontWeight="700" fill={c.muted} textAnchor="middle">
              {labels[i]}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

const UsageBar = ({ id, name, percent, colorKey }) => {
  const { c } = useTheme();
  const s = useStyles();
  const safe = Math.min(Math.max(percent, 0), 100);
  return (
    <View style={s.usageRow}>
      <View style={s.usageHeader}>
        <Text style={s.usageLabel}>{name}</Text>
        <Text style={[s.usageValue, { color: c[colorKey] }]}>{Math.round(safe)}%</Text>
      </View>
      <Svg width={CARD_INNER_W} height={10}>
        <Rect x={0} y={0} width={CARD_INNER_W} height={10} rx={5} fill={c.surfaceAlt} />
        <GradientDef id={id} colors={c.grad[colorKey]} />
        <Rect x={0} y={0} width={(CARD_INNER_W * safe) / 100} height={10} rx={5} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
};

// ---------- QUICK ACTIONS ----------

const ACTIONS_BY_ROLE = {
  registrar: [
    { label: 'Generate', sub: 'Build a new timetable', glyph: '✦', colorKey: 'primary', screen: 'aischeduling' },
    { label: 'Timetable', sub: 'View all departments', glyph: '▦', colorKey: 'sky', screen: 'timetable' },
    { label: 'Faculty', sub: 'Manage staff and load', glyph: '◉', colorKey: 'mint', screen: 'faculty' },
    { label: 'Conflicts', sub: 'Scan for clashes', glyph: '!', colorKey: 'pink', screen: 'conflicts' },
  ],
  hod: [
    { label: 'Generate', sub: 'Build department timetable', glyph: '✦', colorKey: 'primary', screen: 'aischeduling' },
    { label: 'Timetable', sub: 'View your sections', glyph: '▦', colorKey: 'sky', screen: 'timetable' },
    { label: 'Faculty', sub: 'Teacher details and load', glyph: '◉', colorKey: 'mint', screen: 'faculty' },
    { label: 'Conflicts', sub: 'Scan for clashes', glyph: '!', colorKey: 'pink', screen: 'conflicts' },
  ],
  faculty: [
    { label: 'My Timetable', sub: 'Your weekly classes', glyph: '▦', colorKey: 'primary', screen: 'timetable' },
    { label: 'Availability', sub: 'Update free slots', glyph: '◷', colorKey: 'mint', screen: 'availability' },
    { label: 'Calendar', sub: 'Dates and events', glyph: '◫', colorKey: 'sky', screen: 'calendar' },
    { label: 'Profile', sub: 'Account and settings', glyph: '◉', colorKey: 'amber', screen: 'profile' },
  ],
};

const QuickActions = ({ role, navigation, routeParams }) => {
  const { c } = useTheme();
  const s = useStyles();
  const actions = ACTIONS_BY_ROLE[role] || ACTIONS_BY_ROLE.hod;

  const handlePress = (action) => {
    if (action.screen && navigation) {
      navigation.navigate(action.screen, routeParams);
    } else {
      Alert.alert('Coming soon', `${action.label} will be available in the next update.`);
    }
  };

  return (
    <>
      <Text style={s.sectionTitle}>QUICK ACTIONS</Text>
      <View style={s.qaGrid}>
        {actions.map((action, i) => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [s.qaTile, pressed && s.pressed]}
            onPress={() => handlePress(action)}
          >
            <View style={s.qaIconWrap}>
              <Svg style={StyleSheet.absoluteFill} width={46} height={46}>
                <GradientDef id={`qa${i}`} colors={c.grad[action.colorKey]} />
                <Circle cx={23} cy={23} r={23} fill={`url(#qa${i})`} />
              </Svg>
              <Text style={s.qaGlyph}>{action.glyph}</Text>
            </View>
            <Text style={s.qaLabel}>{action.label}</Text>
            <Text style={s.qaSub}>{action.sub}</Text>
            <Text style={[s.qaOpen, { color: c[action.colorKey] }]}>Open →</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
};

// ---------- SCREEN ----------

const DashboardScreen = ({ route, navigation, themeMode, onToggleTheme }) => {
  const { c } = useTheme();
  const s = useStyles();

  const access = getAccess(route?.params);
  const role = access.role;
  const userName = route?.params?.name || 'User';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [fa, de, co, se, ro, tt, off, auth] = await Promise.all([
        fetchFaculty(),
        fetchDepartments(),
        fetchCourses(),
        fetchSections(),
        fetchRooms(),
        fetchTimetable(),
        fetchUnavailableSlots(),
        supabase.auth.getUser(),
      ]);
      const email = auth?.data?.user?.email?.toLowerCase();
      setData({
        faculty: fa,
        departments: de,
        courses: co,
        sections: se,
        rooms: ro,
        timetable: tt,
        unavailable: off,
        myFacultyId: fa.find((f) => f.email?.toLowerCase() === email)?.id || null,
      });
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;

    const sectionDept = (sectionId) => data.sections.find((sec) => sec.id === sectionId)?.departmentId;

    // Who the user can see
    const myFaculty = data.faculty.filter((f) => (role === ROLE.FACULTY ? f.id === data.myFacultyId : inScope(access, f)));
    const myRooms = data.rooms.filter((r) => inScope(access, r));
    const myEntries = data.timetable.filter((t) =>
      role === ROLE.FACULTY ? t.facultyId === data.myFacultyId : inScope(access, { departmentId: sectionDept(t.sectionId) }),
    );

    // Clashes are found on the full timetable, then limited to this user's classes
    const clashIds = new Set();
    data.timetable.forEach((e) => {
      if (findConflicts(data.timetable, e, e.id).length) clashIds.add(e.id);
    });
    const myClashes = myEntries.filter((e) => clashIds.has(e.id)).length;

    // Weekly load per day
    const perDay = DAY_KEYS.map((d) => myEntries.filter((e) => e.day === d).length);

    // Teacher load: classes and hours against each teacher's limit
    const loads = myFaculty.map((f) => {
      const hours = myEntries.filter((e) => e.facultyId === f.id).reduce((sum, e) => sum + e.durationMins, 0) / 60;
      return { id: f.id, name: f.name, hours, max: f.maxHoursPerWeek, percent: (hours / f.maxHoursPerWeek) * 100 };
    });
    const overloaded = loads.filter((l) => l.hours > l.max).length;
    const avgLoad = loads.length ? loads.reduce((sum, l) => sum + Math.min(l.percent, 100), 0) / loads.length : 0;

    // Room use across the week
    const roomHours = myRooms.map((r) => {
      const minutes = myEntries.filter((e) => e.roomId === r.id).reduce((sum, e) => sum + e.durationMins, 0);
      return { id: r.id, name: r.name, type: r.type, percent: (minutes / WEEK_MINUTES) * 100 };
    });
    const labRooms = roomHours.filter((r) => r.type === 'Lab');
    const lectureRooms = roomHours.filter((r) => r.type === 'Lecture');
    const avgOf = (list) => (list.length ? list.reduce((sum, r) => sum + r.percent, 0) / list.length : 0);
    const roomUse = avgOf(roomHours);

    // Availability heatmap: booked / limited / open / free for each 2-hour block
    const heat = SLOT_HOURS.map((hour) =>
      DAY_KEYS.map((day) => {
        const booked = myEntries.some((e) => {
          if (e.day !== day) return false;
          const start = toHours(e.start);
          const end = start + e.durationMins / 60;
          return start < hour + 2 && end > hour;
        });
        if (booked) return 'booked';
        const off = data.unavailable.some(
          (u) => u.day === day && u.start_hour === hour && myFaculty.some((f) => f.id === u.faculty_id),
        );
        if (off) return 'limited';
        return 'free';
      }),
    );

    // Department breakdown (registrar sees all departments, HOD sees own)
    const deptRows = data.departments
      .filter((d) => inScope(access, { departmentId: d.id }))
      .map((d) => ({
        id: d.id,
        name: d.name,
        classes: myEntries.filter((e) => sectionDept(e.sectionId) === d.id).length,
        teachers: data.faculty.filter((f) => f.departmentId === d.id).length,
      }));

    return {
      myFaculty,
      myRooms,
      myEntries,
      myClashes,
      perDay,
      loads,
      overloaded,
      avgLoad: Math.round(avgLoad),
      roomUse: Math.round(roomUse),
      labUse: Math.round(avgOf(labRooms)),
      lectureUse: Math.round(avgOf(lectureRooms)),
      heat,
      deptRows,
      totalClasses: myEntries.length,
    };
  }, [data, role, access.departmentId]);

  if (loading && !data) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={c.primary} />
        <Text style={s.loadingText}>Loading your dashboard…</Text>
      </View>
    );
  }

  const heroTitle =
    role === ROLE.REGISTRAR
      ? 'Institution overview'
      : role === ROLE.HOD
        ? 'Department overview'
        : 'Your teaching week';
  const heroValue = computed ? Math.min(Math.round(computed.avgLoad), 100) : 0;
  const peakIndex = computed ? computed.perDay.indexOf(Math.max(...computed.perDay)) : 0;
  const peakDay = DAY_KEYS[peakIndex] ? DAYS[peakIndex] : 'MON';
  const initial = userName.charAt(0).toUpperCase();

  const roleLabel = role === ROLE.REGISTRAR ? 'REGISTRAR' : role === ROLE.HOD ? 'HOD' : 'FACULTY';
  const subtitle =
    role === ROLE.REGISTRAR
      ? 'All departments'
      : role === ROLE.HOD
        ? data?.departments.find((d) => d.id === access.departmentId)?.name || 'Your department'
        : 'Your teaching schedule';

  const stats =
    role === ROLE.FACULTY
      ? [
          { label: 'My Courses', value: new Set((computed?.myEntries || []).map((e) => e.courseId)).size, colorKey: 'primary' },
          { label: 'Weekly Classes', value: computed?.totalClasses || 0, colorKey: 'sky' },
          { label: 'Clashes', value: computed?.myClashes || 0, colorKey: computed?.myClashes ? 'red' : 'mint' },
          { label: 'Rooms Used', value: new Set((computed?.myEntries || []).map((e) => e.roomId)).size, colorKey: 'amber' },
        ]
      : [
          { label: role === ROLE.REGISTRAR ? 'Faculty' : 'Dept. Faculty', value: computed?.myFaculty.length || 0, colorKey: 'primary' },
          { label: 'Classes', value: computed?.totalClasses || 0, colorKey: 'sky' },
          { label: 'Rooms', value: computed?.myRooms.length || 0, colorKey: 'mint' },
          { label: 'Clashes', value: computed?.myClashes || 0, colorKey: computed?.myClashes ? 'red' : 'mint' },
        ];

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* GREETING ROW */}
        <View style={s.topBar}>
          <View style={s.greetWrap}>
            <Text style={s.greeting}>{getGreeting()},</Text>
            <Text style={s.name} numberOfLines={1}>
              {userName} 👋
            </Text>
            <Text style={s.greetingSub} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <Pressable style={s.iconBtn} onPress={onToggleTheme} accessibilityRole="button" accessibilityLabel="Switch theme">
            <Text style={s.iconGlyph}>{themeMode === 'light' ? '☾' : '☀'}</Text>
          </Pressable>

          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        </View>

        {loadError ? (
          <Pressable style={s.errorBox} onPress={load}>
            <Text style={s.errorTitle}>Could not load the dashboard</Text>
            <Text style={s.errorText}>{loadError}</Text>
            <Text style={s.retry}>Tap to try again</Text>
          </Pressable>
        ) : null}

        {/* HERO */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.rolePill}>
              <View style={s.roleDot} />
              <Text style={s.rolePillText}>{roleLabel}</Text>
            </View>
            <Text style={s.heroTerm}>This term</Text>
          </View>

          <Text style={s.heroTitle}>{heroTitle}</Text>

          <View style={s.progressHead}>
            <Text style={s.progressLabel}>Average teacher load</Text>
            <Text style={s.progressValue}>{heroValue}%</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${heroValue}%` }]} />
          </View>

          <View style={s.miniRow}>
            <MiniTile s={s} value={computed?.totalClasses || 0} label="Classes" />
            <MiniTile s={s} value={computed?.overloaded || 0} label="Overloaded" />
            <MiniTile s={s} value={computed?.myClashes || 0} label="Clashes" />
          </View>
        </View>

        {/* OVERVIEW */}
        <Text style={s.sectionTitle}>OVERVIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          {stats.map((stat, i) => (
            <View key={stat.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: c[`${stat.colorKey}Soft`] }]}>
                <View style={[s.statIconDot, { backgroundColor: c[stat.colorKey] }]} />
              </View>
              <Text style={s.statLabel} numberOfLines={1}>
                {stat.label}
              </Text>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statDelta}>{role === ROLE.FACULTY ? 'Your week' : 'Live from database'}</Text>
              <View style={s.sparkWrap}>
                <Sparkline id={`spark${i}`} data={computed ? computed.perDay : [0, 0, 0, 0, 0]} color={c[stat.colorKey]} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* WEEKLY LOAD */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.cardTitle}>Weekly load</Text>
              <Text style={s.cardSub}>Classes scheduled per day</Text>
            </View>
            <View style={s.peakChip}>
              <Text style={s.peakChipText}>{peakDay} PEAK</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <WeekBars values={computed ? computed.perDay : [0, 0, 0, 0, 0]} labels={DAYS} />
          </View>
        </View>

        {/* ROOM UTILIZATION */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Room utilization</Text>
          <View style={{ marginTop: 14 }}>
            <UsageBar id="usageLec" name="Lecture rooms" percent={computed?.lectureUse || 0} colorKey="sky" />
            <UsageBar id="usageLab" name="Lab rooms" percent={computed?.labUse || 0} colorKey="pink" />
            <UsageBar id="usageAll" name="All rooms" percent={computed?.roomUse || 0} colorKey="mint" />
          </View>
        </View>

        {/* DEPARTMENT TABLE (registrar and HOD) */}
        {role !== ROLE.FACULTY ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>{role === ROLE.REGISTRAR ? 'Departments' : 'Your department'}</Text>
            <Text style={s.cardSub}>Teachers and classes this week</Text>
            <View style={{ marginTop: 12 }}>
              {(computed?.deptRows || []).map((d) => (
                <View key={d.id} style={s.deptRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.deptName} numberOfLines={1}>
                      {d.name}
                    </Text>
                    <Text style={s.deptMeta}>{d.teachers} teachers</Text>
                  </View>
                  <Text style={s.deptValue}>{d.classes}</Text>
                  <Text style={s.deptUnit}>classes</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* AVAILABILITY HEATMAP */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Availability heatmap</Text>
          <Text style={s.cardSub}>Booked, off and open blocks this week</Text>

          <View style={s.heatHeadRow}>
            <View style={s.heatCorner} />
            {DAYS.map((d) => (
              <Text key={d} style={s.heatHead}>
                {d}
              </Text>
            ))}
          </View>

          {SLOT_LABELS.map((slot, r) => (
            <View key={slot} style={s.heatRow}>
              <Text style={s.heatSlot}>{slot}</Text>
              {DAY_KEYS.map((d, col) => {
                const state = computed ? computed.heat[r][col] : 'free';
                const color = state === 'booked' ? c.pink : state === 'limited' ? c.amber : c.mint;
                return <View key={d} style={[s.heatBlock, { backgroundColor: color }]} />;
              })}
            </View>
          ))}

          <View style={s.legendRow}>
            <LegendItem s={s} color={c.pink} label="Booked" />
            <LegendItem s={s} color={c.amber} label="Off" />
            <LegendItem s={s} color={c.mint} label="Free" />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <QuickActions role={role} navigation={navigation} routeParams={route?.params} />

        <Text style={s.demoNote}>Live data · numbers update when you reopen the dashboard</Text>
      </ScrollView>
    </View>
  );
};

const MiniTile = ({ s, value, label }) => (
  <View style={s.miniTile}>
    <Text style={s.miniValue}>{value}</Text>
    <Text style={s.miniLabel}>{label}</Text>
  </View>
);

const LegendItem = ({ s, color, label }) => (
  <View style={s.legendItem}>
    <View style={[s.legendDot, { backgroundColor: color }]} />
    <Text style={s.legendText}>{label}</Text>
  </View>
);

export default DashboardScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingTop: 18, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 10 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18 },
    greetWrap: { flex: 1, marginRight: 10 },
    greeting: { fontSize: 13, color: c.muted, fontWeight: '700' },
    name: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 2 },
    greetingSub: { fontSize: 12, color: c.muted, marginTop: 3 },
    iconBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 8, ...shadow },
    iconGlyph: { fontSize: 18, color: c.primary, fontWeight: '800' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    avatarText: { color: c.white, fontSize: 17, fontWeight: '800' },

    errorBox: { backgroundColor: c.redSoft, borderRadius: 18, padding: 14, marginHorizontal: 20, marginBottom: 14 },
    errorTitle: { fontSize: 13, fontWeight: '800', color: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 4 },
    retry: { fontSize: 11, fontWeight: '800', color: c.primary, marginTop: 8 },

    hero: { marginHorizontal: 20, paddingTop: 4, paddingBottom: 6 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rolePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.primarySoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginRight: 6 },
    rolePillText: { fontSize: 10, fontWeight: '800', color: c.primary, letterSpacing: 1 },
    heroTerm: { fontSize: 11, color: c.muted, fontWeight: '700' },
    heroTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginTop: 14, lineHeight: 26 },
    progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18 },
    progressLabel: { fontSize: 12, color: c.muted, fontWeight: '700' },
    progressValue: { fontSize: 22, fontWeight: '800', color: c.primary },
    track: { height: 10, borderRadius: 5, backgroundColor: c.surfaceAlt, marginTop: 10, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5, backgroundColor: c.primary },
    miniRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -5 },
    miniTile: { flex: 1, backgroundColor: c.surface, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginHorizontal: 5, ...shadow },
    miniValue: { fontSize: 18, fontWeight: '800', color: c.text },
    miniLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3 },

    sectionTitle: { fontSize: 12, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginHorizontal: 22, marginTop: 24, marginBottom: 12 },

    statsRow: { paddingHorizontal: 20, paddingRight: 8 },
    statCard: { width: 156, backgroundColor: c.surface, borderRadius: 24, padding: 16, marginRight: 12, overflow: 'hidden', ...shadow },
    statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statIconDot: { width: 12, height: 12, borderRadius: 6 },
    statLabel: { fontSize: 11, color: c.muted, fontWeight: '700' },
    statValue: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: 2 },
    statDelta: { fontSize: 10, fontWeight: '700', marginTop: 2, color: c.muted },
    sparkWrap: { marginTop: 10, marginHorizontal: -4 },

    card: { backgroundColor: c.surface, borderRadius: 24, padding: 18, marginHorizontal: 20, marginTop: 14, ...shadow },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    cardSub: { fontSize: 11, color: c.muted, marginTop: 3 },
    peakChip: { backgroundColor: c.mintSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
    peakChipText: { fontSize: 10, fontWeight: '800', color: c.mint, letterSpacing: 0.5 },

    usageRow: { marginBottom: 16 },
    usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    usageLabel: { fontSize: 12, color: c.text, fontWeight: '700' },
    usageValue: { fontSize: 12, fontWeight: '800' },

    deptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    deptName: { fontSize: 13, fontWeight: '800', color: c.text },
    deptMeta: { fontSize: 10, color: c.muted, marginTop: 2 },
    deptValue: { fontSize: 18, fontWeight: '800', color: c.primary, marginLeft: 10 },
    deptUnit: { fontSize: 10, color: c.muted, marginLeft: 4, fontWeight: '700' },

    heatHeadRow: { flexDirection: 'row', marginTop: 16, marginBottom: 6 },
    heatCorner: { width: 44 },
    heatHead: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: c.muted, letterSpacing: 0.5 },
    heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    heatSlot: { width: 44, fontSize: 10, fontWeight: '700', color: c.muted },
    heatBlock: { flex: 1, height: 28, borderRadius: 9, marginHorizontal: 3 },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginTop: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendText: { fontSize: 10, color: c.muted, fontWeight: '700' },

    sectionTitleQa: {},
    qaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    qaTile: { width: '48%', backgroundColor: c.surface, borderRadius: 24, padding: 16, marginBottom: 12, ...shadow },
    qaIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    qaGlyph: { fontSize: 18, fontWeight: '800', color: c.white },
    qaLabel: { fontSize: 14, fontWeight: '800', color: c.text },
    qaSub: { fontSize: 11, color: c.muted, marginTop: 4, lineHeight: 15 },
    qaOpen: { fontSize: 11, fontWeight: '800', marginTop: 12 },

    donutCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 18, paddingHorizontal: 30 },
  });