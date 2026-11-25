import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_INNER_W = SCREEN_W - 40 - 36;

// ---------- SAMPLE DATA ----------
// Replace with database values once the backend is connected.
// colorKey names a color in src/styles/colors.js.

const DASHBOARD_DATA = {
  registrar: {
    roleLabel: 'REGISTRAR',
    greetingSub: 'Institution-wide view',
    heroValue: 72,
    heroCaption: 'Timetable completion',
    heroTitle: 'On track for this term',
    mini: [
      { label: 'Published', value: '38' },
      { label: 'In draft', value: '29' },
      { label: 'Pending', value: '11' },
    ],
    stats: [
      { label: 'Faculty', value: 124, delta: '+3', spark: [110, 112, 115, 118, 119, 122, 124], colorKey: 'primary' },
      { label: 'Courses', value: 86, delta: '+5', spark: [70, 74, 77, 80, 82, 84, 86], colorKey: 'sky' },
      { label: 'Sections', value: 42, delta: '0', spark: [40, 41, 42, 41, 42, 42, 42], colorKey: 'mint' },
      { label: 'Classrooms', value: 38, delta: '-1', spark: [39, 39, 40, 38, 39, 38, 38], colorKey: 'amber' },
    ],
    weekLoad: [48, 52, 45, 50, 31],
    usageTitle: 'Room utilization',
    usage: [
      { name: 'Lecture halls', percent: 84, colorKey: 'sky' },
      { name: 'Computer labs', percent: 92, colorKey: 'pink' },
      { name: 'Seminar rooms', percent: 58, colorKey: 'mint' },
    ],
    listTitle: 'Department conflicts',
    list: [
      { id: 'r1', title: 'Teacher clash · Dr. Ahmed', detail: 'Mon 10:00 AM · CS & Math', tag: 'high' },
      { id: 'r2', title: 'Room double-booked · B-204', detail: 'Tue 2:00 PM · Lab 3', tag: 'high' },
      { id: 'r3', title: 'Section gap · BBA-3A', detail: 'Wed · 3 hour gap', tag: 'low' },
    ],
    suggestions: [
      { id: 'rs1', text: 'Move the Physics Lab to Thursday 11:00 AM to clear the room clash in B-204.', confidence: 94 },
      { id: 'rs2', text: "Balance Dr. Ahmed's workload by moving one lecture from Monday to Friday.", confidence: 81 },
    ],
    activity: [
      { text: 'Timetable draft generated for Computer Science', time: '10 min ago' },
      { text: 'Room B-204 availability updated', time: '1 hr ago' },
      { text: 'Faculty leave added: Dr. Sana (Thu)', time: 'Yesterday' },
    ],
  },

  hod: {
    roleLabel: 'HOD',
    greetingSub: 'Computer Science department',
    heroValue: 64,
    heroCaption: 'Timetable completion',
    heroTitle: 'Needs attention before deadline',
    mini: [
      { label: 'Sections', value: '8' },
      { label: 'Clashes', value: '2' },
      { label: 'Suggestions', value: '1' },
    ],
    stats: [
      { label: 'Dept. Faculty', value: 18, delta: '+1', spark: [15, 16, 16, 17, 17, 18, 18], colorKey: 'primary' },
      { label: 'Courses', value: 12, delta: '+2', spark: [8, 9, 9, 10, 11, 11, 12], colorKey: 'sky' },
      { label: 'Sections', value: 8, delta: '0', spark: [8, 8, 8, 8, 8, 8, 8], colorKey: 'mint' },
      { label: 'Classrooms', value: 6, delta: '-1', spark: [7, 7, 6, 6, 7, 6, 6], colorKey: 'amber' },
    ],
    weekLoad: [14, 16, 12, 15, 9],
    usageTitle: 'Room utilization',
    usage: [
      { name: 'Lecture rooms', percent: 71, colorKey: 'sky' },
      { name: 'Labs', percent: 88, colorKey: 'pink' },
    ],
    listTitle: 'Scheduling conflicts',
    list: [
      { id: 'h1', title: 'Teacher clash · Ms. Sara', detail: 'Mon 9:00 AM · BSCS-2A', tag: 'high' },
      { id: 'h2', title: 'Lab unavailable · Lab 1', detail: 'Thu 2:00 PM', tag: 'low' },
    ],
    suggestions: [
      { id: 'hs1', text: 'Ms. Sara is free Tuesday 11:00 AM. Moving the BSCS-2A lecture there removes the Monday clash.', confidence: 88 },
    ],
    activity: [
      { text: 'Teacher availability updated: Mr. Usman', time: '2 hrs ago' },
      { text: 'Section BSCS-2A timetable edited', time: 'Yesterday' },
    ],
  },

  faculty: {
    roleLabel: 'FACULTY',
    greetingSub: 'Your teaching schedule',
    heroValue: 75,
    heroCaption: 'Weekly load used',
    heroTitle: 'Within your 20-hour limit',
    mini: [
      { label: 'Classes', value: '12' },
      { label: 'Free slots', value: '9' },
      { label: 'Labs', value: '2' },
    ],
    stats: [
      { label: 'My Courses', value: 4, delta: '0', spark: [4, 4, 4, 4, 4, 4, 4], colorKey: 'primary' },
      { label: 'Weekly Classes', value: 12, delta: '+1', spark: [10, 10, 11, 11, 11, 12, 12], colorKey: 'sky' },
      { label: 'Free Slots', value: 9, delta: '+2', spark: [5, 6, 6, 7, 8, 8, 9], colorKey: 'mint' },
      { label: 'Rooms Used', value: 3, delta: '0', spark: [3, 3, 3, 3, 3, 3, 3], colorKey: 'amber' },
    ],
    weekLoad: [3, 2, 3, 2, 2],
    usageTitle: 'Hours this week',
    usage: [
      { name: 'Teaching', percent: 68, colorKey: 'sky' },
      { name: 'Office hours', percent: 40, colorKey: 'mint' },
      { name: 'Free time', percent: 32, colorKey: 'pink' },
    ],
    listTitle: 'My upcoming classes',
    list: [
      { id: 'f1', title: 'Data Structures · CS-2B', detail: 'Mon 9:00 AM · Room A-101', tag: 'info' },
      { id: 'f2', title: 'Lab · Operating Systems', detail: 'Tue 11:00 AM · Lab 2', tag: 'info' },
      { id: 'f3', title: 'Schedule update', detail: 'Thursday class moved to 2:00 PM', tag: 'high' },
    ],
    suggestions: [
      { id: 'fs1', text: 'Your Friday 10:00 AM slot is free and matches your preferred morning timing.', confidence: 90 },
    ],
    activity: [
      { text: 'Schedule updated: Thursday class moved', time: '30 min ago' },
      { text: 'Availability saved for next week', time: 'Yesterday' },
    ],
  },
};

// screen: a key registered in App.js, or null if not built yet
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

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const SLOT_LABELS = ['8AM', '10AM', '12PM', '2PM', '4PM'];
// AVAIL[slot][day]: 0 booked, 1 limited, 2 open, 3 free
const AVAIL = [
  [2, 3, 1, 0, 2],
  [3, 3, 2, 1, 0],
  [1, 2, 3, 2, 1],
  [3, 1, 0, 2, 3],
  [2, 2, 1, 3, 0],
];
const LEVELS = [
  { key: 'pink', label: 'Booked' },
  { key: 'amber', label: 'Limited' },
  { key: 'sky', label: 'Open' },
  { key: 'mint', label: 'Free' },
];

const TAG_LABEL = { high: 'HIGH', low: 'LOW', info: 'INFO' };

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Shared styles hook for the small components below.
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
  const max = Math.max(...values);
  const peakIndex = values.indexOf(max);

  return (
    <Svg width={CARD_INNER_W} height={H + 30}>
      <GradientDef id="weekBlue" colors={c.grad.primary} vertical />
      <GradientDef id="weekPeak" colors={c.grad.mint} vertical />
      {values.map((v, i) => {
        const h = Math.max(10, (v / max) * H);
        const x = i * (barW + gap);
        const isPeak = i === peakIndex;
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
  return (
    <View style={s.usageRow}>
      <View style={s.usageHeader}>
        <Text style={s.usageLabel}>{name}</Text>
        <Text style={[s.usageValue, { color: c[colorKey] }]}>{percent}%</Text>
      </View>
      <Svg width={CARD_INNER_W} height={10}>
        <Rect x={0} y={0} width={CARD_INNER_W} height={10} rx={5} fill={c.surfaceAlt} />
        <GradientDef id={id} colors={c.grad[colorKey]} />
        <Rect x={0} y={0} width={(CARD_INNER_W * percent) / 100} height={10} rx={5} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
};

// ---------- QUICK ACTIONS ----------

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

  const role = route?.params?.role || 'hod';
  const userName = route?.params?.name || 'User';
  const data = DASHBOARD_DATA[role] || DASHBOARD_DATA.hod;

  const [suggestions, setSuggestions] = useState(data.suggestions);

  const handleSuggestion = (id, accepted) => {
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
    if (accepted) {
      Alert.alert('Suggestion accepted', 'Saved to the draft timetable. Nothing is published until it is approved.');
    }
  };

  const counts = data.list.reduce((acc, item) => {
    acc[item.tag] = (acc[item.tag] || 0) + 1;
    return acc;
  }, {});
  const total = data.list.length || 1;
  const tagColor = (tag) => (tag === 'high' ? c.red : tag === 'low' ? c.amber : c.primary);
  const tagSoft = (tag) => (tag === 'high' ? c.redSoft : tag === 'low' ? c.amberSoft : c.primarySoft);

  const initial = userName.charAt(0).toUpperCase();
  const peakDay = DAYS[data.weekLoad.indexOf(Math.max(...data.weekLoad))];

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
              {data.greetingSub}
            </Text>
          </View>

          <Pressable
            style={s.iconBtn}
            onPress={onToggleTheme}
            accessibilityRole="button"
            accessibilityLabel="Switch theme"
          >
            <Text style={s.iconGlyph}>{themeMode === 'light' ? '☾' : '☀'}</Text>
          </Pressable>

          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        </View>

        {/* HERO: open layout, no box around the progress */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.rolePill}>
              <View style={s.roleDot} />
              <Text style={s.rolePillText}>{data.roleLabel}</Text>
            </View>
            <Text style={s.heroTerm}>This term</Text>
          </View>

          <Text style={s.heroTitle}>{data.heroTitle}</Text>

          <View style={s.progressHead}>
            <Text style={s.progressLabel}>{data.heroCaption}</Text>
            <Text style={s.progressValue}>{data.heroValue}%</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${data.heroValue}%` }]} />
          </View>

          <View style={s.miniRow}>
            {data.mini.map((m) => (
              <View key={m.label} style={s.miniTile}>
                <Text style={s.miniValue}>{m.value}</Text>
                <Text style={s.miniLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* OVERVIEW */}
        <Text style={s.sectionTitle}>OVERVIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          {data.stats.map((stat, i) => {
            const isNeg = stat.delta.startsWith('-');
            const isNeutral = stat.delta === '0';
            const deltaColor = isNeg ? c.red : isNeutral ? c.muted : c.mint;
            return (
              <View key={stat.label} style={s.statCard}>
                <View style={[s.statIcon, { backgroundColor: c[`${stat.colorKey}Soft`] }]}>
                  <View style={[s.statIconDot, { backgroundColor: c[stat.colorKey] }]} />
                </View>
                <Text style={s.statLabel} numberOfLines={1}>
                  {stat.label}
                </Text>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={[s.statDelta, { color: deltaColor }]}>
                  {isNeutral ? 'No change' : `${stat.delta} this term`}
                </Text>
                <View style={s.sparkWrap}>
                  <Sparkline id={`spark${i}`} data={stat.spark} color={c[stat.colorKey]} />
                </View>
              </View>
            );
          })}
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
            <WeekBars values={data.weekLoad} labels={DAYS} />
          </View>
        </View>

        {/* USAGE */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{data.usageTitle}</Text>
          <View style={{ marginTop: 14 }}>
            {data.usage.map((u, i) => (
              <UsageBar key={u.name} id={`usage${i}`} name={u.name} percent={u.percent} colorKey={u.colorKey} />
            ))}
          </View>
        </View>

        {/* AVAILABILITY HEATMAP */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Availability heatmap</Text>
          <Text style={s.cardSub}>Weekly slots at a glance</Text>

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
              {DAYS.map((d, col) => (
                <View key={d} style={[s.heatBlock, { backgroundColor: c[LEVELS[AVAIL[r][col]].key] }]} />
              ))}
            </View>
          ))}

          <View style={s.legendRow}>
            {LEVELS.map((lvl) => (
              <View key={lvl.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: c[lvl.key] }]} />
                <Text style={s.legendText}>{lvl.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CONFLICTS / CLASSES */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>{data.listTitle}</Text>
            <Text style={s.cardSub}>{data.list.length} items</Text>
          </View>

          <View style={s.splitBar}>
            {['high', 'low', 'info']
              .filter((k) => counts[k])
              .map((k) => (
                <View key={k} style={{ flex: counts[k] / total, backgroundColor: tagColor(k) }} />
              ))}
          </View>

          <View style={{ marginTop: 14 }}>
            {data.list.map((item) => (
              <View key={item.id} style={s.listItem}>
                <View style={[s.listBar, { backgroundColor: tagColor(item.tag) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitleText}>{item.title}</Text>
                  <Text style={s.listDetail}>{item.detail}</Text>
                </View>
                <View style={[s.tagPill, { backgroundColor: tagSoft(item.tag) }]}>
                  <Text style={[s.tagText, { color: tagColor(item.tag) }]}>{TAG_LABEL[item.tag]}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI COPILOT */}
        <View style={s.aiPanel}>
          <View style={s.aiHeader}>
            <View style={s.aiBadge}>
              <Text style={s.aiBadgeText}>AI</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.aiTitle}>Copilot suggestions</Text>
              <Text style={s.aiSub}>Ranked by confidence</Text>
            </View>
          </View>

          {suggestions.length === 0 ? <Text style={s.aiEmpty}>All suggestions reviewed. ✓</Text> : null}

          {suggestions.map((item) => (
            <View key={item.id} style={s.aiItem}>
              <View style={s.aiItemTop}>
                <View style={s.confBadge}>
                  <Text style={s.confValue}>{item.confidence}%</Text>
                </View>
                <Text style={s.aiText}>{item.text}</Text>
              </View>
              <View style={s.aiButtons}>
                <Pressable style={s.aiAccept} onPress={() => handleSuggestion(item.id, true)}>
                  <Text style={s.aiAcceptText}>Accept</Text>
                </Pressable>
                <Pressable style={s.aiReject} onPress={() => handleSuggestion(item.id, false)}>
                  <Text style={s.aiRejectText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Text style={s.aiNote}>Nothing changes without your approval.</Text>
        </View>

        {/* ACTIVITY */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent activity</Text>
          <View style={{ marginTop: 14 }}>
            {data.activity.map((item, i) => (
              <View key={i} style={s.activityRow}>
                <View style={s.activityLine}>
                  <View style={s.activityDot} />
                  {i < data.activity.length - 1 ? <View style={s.activityStem} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 14 }}>
                  <Text style={s.activityText}>{item.text}</Text>
                  <Text style={s.activityTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <QuickActions role={role} navigation={navigation} routeParams={route?.params} />

        <Text style={s.demoNote}>Sample data · live numbers appear once the database is connected</Text>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingTop: 18, paddingBottom: 40 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },

    // GREETING ROW
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 18,
    },
    greetWrap: { flex: 1, marginRight: 10 },
    greeting: { fontSize: 13, color: c.muted, fontWeight: '700' },
    name: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 2 },
    greetingSub: { fontSize: 12, color: c.muted, marginTop: 3 },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      ...shadow,
    },
    iconGlyph: { fontSize: 18, color: c.primary, fontWeight: '800' },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    avatarText: { color: c.white, fontSize: 17, fontWeight: '800' },

    // HERO (open layout, no containing box)
    hero: { marginHorizontal: 20, paddingTop: 4, paddingBottom: 6 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primarySoft,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.primary, marginRight: 6 },
    rolePillText: { fontSize: 10, fontWeight: '800', color: c.primary, letterSpacing: 1 },
    heroTerm: { fontSize: 11, color: c.muted, fontWeight: '700' },
    heroTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginTop: 14, lineHeight: 26 },

    progressHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 18,
    },
    progressLabel: { fontSize: 12, color: c.muted, fontWeight: '700' },
    progressValue: { fontSize: 22, fontWeight: '800', color: c.primary },
    track: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.surfaceAlt,
      marginTop: 10,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 5, backgroundColor: c.primary },

    miniRow: { flexDirection: 'row', marginTop: 16, marginHorizontal: -5 },
    miniTile: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingVertical: 12,
      alignItems: 'center',
      marginHorizontal: 5,
      ...shadow,
    },
    miniValue: { fontSize: 18, fontWeight: '800', color: c.text },
    miniLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3, textAlign: 'center' },

    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: c.muted,
      letterSpacing: 1.2,
      marginHorizontal: 22,
      marginTop: 24,
      marginBottom: 12,
    },

    // STATS
    statsRow: { paddingHorizontal: 20, paddingRight: 8 },
    statCard: {
      width: 156,
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 16,
      marginRight: 12,
      overflow: 'hidden',
      ...shadow,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statIconDot: { width: 12, height: 12, borderRadius: 6 },
    statLabel: { fontSize: 11, color: c.muted, fontWeight: '700' },
    statValue: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: 2 },
    statDelta: { fontSize: 10, fontWeight: '700', marginTop: 2 },
    sparkWrap: { marginTop: 10, marginHorizontal: -4 },

    // CARDS
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 18,
      marginHorizontal: 20,
      marginTop: 14,
      ...shadow,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: c.text },
    cardSub: { fontSize: 11, color: c.muted, marginTop: 3 },
    peakChip: { backgroundColor: c.mintSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
    peakChipText: { fontSize: 10, fontWeight: '800', color: c.mint, letterSpacing: 0.5 },

    // USAGE
    usageRow: { marginBottom: 16 },
    usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    usageLabel: { fontSize: 12, color: c.text, fontWeight: '700' },
    usageValue: { fontSize: 12, fontWeight: '800' },

    // HEATMAP
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

    // CONFLICT LIST
    splitBar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      marginTop: 14,
      backgroundColor: c.surfaceAlt,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 18,
      paddingVertical: 12,
      paddingRight: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    listBar: { width: 5, alignSelf: 'stretch', marginRight: 12 },
    listTitleText: { fontSize: 13, fontWeight: '800', color: c.text },
    listDetail: { fontSize: 11, color: c.muted, marginTop: 3 },
    tagPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
    tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

    // AI
    aiPanel: {
      marginHorizontal: 20,
      marginTop: 14,
      padding: 18,
      borderRadius: 24,
      backgroundColor: c.primary,
      ...shadow,
    },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    aiBadge: { backgroundColor: c.white, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, marginRight: 12 },
    aiBadgeText: { color: c.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    aiTitle: { fontSize: 15, fontWeight: '800', color: c.white },
    aiSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    aiEmpty: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
    aiItem: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 14, marginBottom: 10 },
    aiItemTop: { flexDirection: 'row', alignItems: 'flex-start' },
    confBadge: {
      backgroundColor: c.white,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 5,
      minWidth: 48,
      alignItems: 'center',
    },
    confValue: { fontSize: 11, fontWeight: '800', color: c.primary },
    aiText: { flex: 1, fontSize: 12, lineHeight: 18, color: c.white, marginLeft: 12 },
    aiButtons: { flexDirection: 'row', marginTop: 12, marginLeft: 60 },
    aiAccept: { backgroundColor: c.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
    aiAcceptText: { color: c.primary, fontSize: 12, fontWeight: '800' },
    aiReject: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },
    aiRejectText: { color: c.white, fontSize: 12, fontWeight: '700' },
    aiNote: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

    // ACTIVITY
    activityRow: { flexDirection: 'row', alignItems: 'flex-start' },
    activityLine: { alignItems: 'center', width: 20 },
    activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary, marginTop: 4 },
    activityStem: { width: 2, flex: 1, backgroundColor: c.border, marginVertical: 4, borderRadius: 1 },
    activityText: { fontSize: 12, color: c.text, lineHeight: 18, fontWeight: '600' },
    activityTime: { fontSize: 10, color: c.muted, marginTop: 2 },

    // QUICK ACTIONS
    qaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    qaTile: {
      width: '48%',
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 16,
      marginBottom: 12,
      ...shadow,
    },
    qaIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    qaGlyph: { fontSize: 18, fontWeight: '800', color: c.white },
    qaLabel: { fontSize: 14, fontWeight: '800', color: c.text },
    qaSub: { fontSize: 11, color: c.muted, marginTop: 4, lineHeight: 15 },
    qaOpen: { fontSize: 11, fontWeight: '800', marginTop: 12 },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 18, paddingHorizontal: 30 },
  });