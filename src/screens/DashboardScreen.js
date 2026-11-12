import React, { createContext, useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_INNER_W = SCREEN_W - 40 - 36;

// ---------- GRADIENTS ----------

const GRAD = {
  blue: ['#4F7CFF', '#8FA8FF'],
  lavender: ['#7C6BFF', '#C3B8FF'],
  green: ['#22C58C', '#7CF5C4'],
  amber: ['#FF9F2E', '#FFD27A'],
  red: ['#FF4D6D', '#FF9BB0'],
  pink: ['#FF6FB5', '#FFB3DA'],
};

// ---------- THEMES ----------

const THEMES = {
  dark: {
    mode: 'dark',
    statusBar: 'light-content',
    bg: '#060A14',
    surface: '#0E1626',
    surfaceHi: '#15203A',
    border: '#1C2A47',
    track: '#1A2640',
    heading: '#FFFFFF',
    text: '#E9EEFA',
    muted: '#7D8AA6',
    accent: '#A9B6FF',
    blue: '#4F7CFF',
    green: '#2BD39A',
    amber: '#FFB547',
    red: '#FF5C7A',
    pillBg: 'rgba(79,124,255,0.18)',
    pillBorder: 'rgba(143,168,255,0.45)',
    heroGrad: ['#1A2D6B', '#0B1222'],
    avatarGrad: GRAD.lavender,
    avatarText: '#060A14',
    aiGrad: ['#1E2F72', '#0E1626'],
    aiText: '#E9EEFA',
    aiMuted: '#A9B6FF',
    aiItemBg: 'rgba(7,11,20,0.45)',
    aiItemBorder: 'rgba(169,182,255,0.15)',
    aiTrack: '#1A2640',
    aiBadgeBg: '#4F7CFF',
    aiBadgeText: '#FFFFFF',
    aiAcceptBg: '#4F7CFF',
    aiAcceptText: '#FFFFFF',
    aiRejectBorder: '#1C2A47',
    aiRejectText: '#A9B6FF',
    qaShadow: 'rgba(0,0,0,0.4)',
  },
  light: {
    mode: 'light',
    statusBar: 'dark-content',
    bg: '#F3F5FB',
    surface: '#FFFFFF',
    surfaceHi: '#F4F6FC',
    border: '#E1E6F2',
    track: '#E6EBF6',
    heading: '#0B1220',
    text: '#1E2740',
    muted: '#6B7692',
    accent: '#4F5FD6',
    blue: '#3D6BFF',
    green: '#16A774',
    amber: '#E08A1E',
    red: '#E5405F',
    pillBg: 'rgba(79,124,255,0.12)',
    pillBorder: 'rgba(79,124,255,0.35)',
    heroGrad: ['#E3EAFF', '#FFFFFF'],
    avatarGrad: GRAD.blue,
    avatarText: '#FFFFFF',
    aiGrad: ['#4F7CFF', '#3D62E8'],
    aiText: '#FFFFFF',
    aiMuted: '#DDE6FF',
    aiItemBg: 'rgba(255,255,255,0.16)',
    aiItemBorder: 'rgba(255,255,255,0.25)',
    aiTrack: 'rgba(255,255,255,0.3)',
    aiBadgeBg: '#FFFFFF',
    aiBadgeText: '#3D62E8',
    aiAcceptBg: '#FFFFFF',
    aiAcceptText: '#3D62E8',
    aiRejectBorder: 'rgba(255,255,255,0.6)',
    aiRejectText: '#FFFFFF',
    qaShadow: 'rgba(79,124,255,0.15)',
  },
};

const ThemeContext = createContext(THEMES.dark);
const useTheme = () => useContext(ThemeContext);

// ---------- STYLES ----------

const buildStyles = (t) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { paddingBottom: 40 },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // TOP BAR
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingTop: 56,
      paddingBottom: 18,
    },
    greeting: { fontSize: 13, color: t.muted, fontWeight: '600' },
    name: { fontSize: 22, fontWeight: '800', color: t.heading, marginTop: 2 },
    topRight: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    iconGlyph: { fontSize: 18, color: t.accent, fontWeight: '700' },
    bellDot: {
      position: 'absolute',
      top: 10,
      right: 11,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: t.red,
      borderWidth: 1.5,
      borderColor: t.surface,
    },
    avatarWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: t.avatarText, fontSize: 17, fontWeight: '800' },

    // PANELS
    panelWrap: {
      borderRadius: 26,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.border,
    },

    // HERO
    hero: { marginHorizontal: 20, padding: 20 },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroLeft: { flex: 1, paddingRight: 12 },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: t.pillBg,
      borderWidth: 1,
      borderColor: t.pillBorder,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    roleDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: t.green,
      marginRight: 6,
    },
    rolePillText: {
      fontSize: 10,
      fontWeight: '800',
      color: t.accent,
      letterSpacing: 1,
    },
    heroTitle: { fontSize: 17, fontWeight: '800', color: t.heading, marginTop: 12 },
    heroSubtitle: { fontSize: 12, color: t.muted, marginTop: 4 },
    miniRow: { flexDirection: 'row', marginTop: 18 },
    miniItem: { marginRight: 18 },
    miniValue: { fontSize: 18, fontWeight: '800', color: t.heading },
    miniLabel: { fontSize: 10, color: t.muted, fontWeight: '600', marginTop: 2 },
    donutCenter: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutValue: { fontSize: 24, fontWeight: '800', color: t.heading },
    donutCaption: {
      fontSize: 9,
      color: t.muted,
      fontWeight: '700',
      marginTop: 2,
      textAlign: 'center',
      width: 70,
    },

    // SECTIONS
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: t.muted,
      letterSpacing: 1.2,
      marginHorizontal: 22,
      marginTop: 26,
      marginBottom: 12,
    },

    // KPI CARDS
    statsRow: { paddingHorizontal: 20, paddingRight: 8 },
    statCard: {
      width: 150,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 20,
      padding: 16,
      marginRight: 12,
      overflow: 'hidden',
    },
    statLabel: { fontSize: 11, color: t.muted, fontWeight: '700' },
    statValue: { fontSize: 28, fontWeight: '800', color: t.heading, marginTop: 4 },
    statDelta: { fontSize: 10, fontWeight: '700', marginTop: 2 },
    sparkWrap: { marginTop: 12, marginHorizontal: -4 },

    // CARDS
    card: {
      backgroundColor: t.surface,
      borderRadius: 22,
      padding: 18,
      marginHorizontal: 20,
      marginTop: 14,
      borderWidth: 1,
      borderColor: t.border,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: t.heading },
    cardSub: { fontSize: 11, color: t.muted, marginTop: 3 },
    peakChip: {
      backgroundColor: 'rgba(43,211,154,0.15)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    peakChipText: { fontSize: 10, fontWeight: '800', color: t.green, letterSpacing: 0.5 },

    // USAGE
    usageRow: { marginBottom: 16 },
    usageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    usageLabel: { fontSize: 12, color: t.text, fontWeight: '600' },
    usageValue: { fontSize: 12, fontWeight: '800' },

    // HEATMAP
    heatHeadRow: { flexDirection: 'row', marginTop: 16, marginBottom: 6 },
    heatCorner: { width: 44 },
    heatHead: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '800',
      color: t.muted,
      letterSpacing: 0.5,
    },
    heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    heatSlot: { width: 44, fontSize: 10, fontWeight: '700', color: t.muted },
    heatBlock: { flex: 1, height: 26, borderRadius: 8, marginHorizontal: 3 },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
      marginTop: 4,
    },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendText: { fontSize: 10, color: t.muted, fontWeight: '600' },

    // CONFLICT LIST
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.surfaceHi,
      borderRadius: 14,
      paddingVertical: 12,
      paddingRight: 14,
      marginBottom: 10,
      overflow: 'hidden',
    },
    listBar: { width: 4, alignSelf: 'stretch', marginRight: 12 },
    listText: { flex: 1 },
    listTitleText: { fontSize: 13, fontWeight: '700', color: t.text },
    listDetail: { fontSize: 11, color: t.muted, marginTop: 3 },
    tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 8 },

    // AI
    aiPanel: { marginHorizontal: 20, marginTop: 14, padding: 18 },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    aiBadge: {
      backgroundColor: t.aiBadgeBg,
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 5,
      marginRight: 12,
    },
    aiBadgeText: { color: t.aiBadgeText, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    aiTitle: { fontSize: 15, fontWeight: '800', color: t.aiText },
    aiSub: { fontSize: 11, color: t.aiMuted, marginTop: 2 },
    aiEmpty: { fontSize: 12, color: t.aiMuted },
    aiItem: {
      backgroundColor: t.aiItemBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: t.aiItemBorder,
    },
    aiItemTop: { flexDirection: 'row', alignItems: 'center' },
    confValue: { fontSize: 11, fontWeight: '800', color: t.aiText },
    aiText: { flex: 1, fontSize: 12, lineHeight: 18, color: t.aiText, marginLeft: 12 },
    aiButtons: { flexDirection: 'row', marginTop: 12, marginLeft: 58 },
    aiAccept: {
      backgroundColor: t.aiAcceptBg,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      marginRight: 8,
    },
    aiAcceptText: { color: t.aiAcceptText, fontSize: 12, fontWeight: '800' },
    aiReject: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.aiRejectBorder,
    },
    aiRejectText: { color: t.aiRejectText, fontSize: 12, fontWeight: '700' },
    aiNote: { fontSize: 10, color: t.aiMuted, marginTop: 4 },

    // ACTIVITY
    activityRow: { flexDirection: 'row', alignItems: 'flex-start' },
    activityLine: { alignItems: 'center', width: 18 },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.blue,
      marginTop: 5,
    },
    activityStem: {
      width: 1,
      flex: 1,
      backgroundColor: t.border,
      marginVertical: 3,
    },
    activityText: {
      flex: 1,
      fontSize: 12,
      color: t.text,
      lineHeight: 18,
      paddingBottom: 14,
    },

    // QUICK ACTIONS
    qaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    qaTile: {
      width: '48%',
      backgroundColor: t.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: t.border,
      padding: 16,
      paddingTop: 18,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: t.qaShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    qaTilePressed: {
      transform: [{ scale: 0.96 }],
      opacity: 0.92,
    },
    qaAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    qaIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    qaGlyph: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    qaLabel: { fontSize: 14, fontWeight: '800', color: t.heading },
    qaSub: { fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 15 },
    qaFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    qaFooterDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    qaFooterText: { fontSize: 11, fontWeight: '800' },

    demoNote: {
      fontSize: 10,
      color: t.muted,
      textAlign: 'center',
      marginTop: 16,
      paddingHorizontal: 30,
    },
  });

const styleCache = {};
const getStyles = (theme) => {
  const t = theme || THEMES.dark;
  if (!styleCache[t.mode]) styleCache[t.mode] = buildStyles(t);
  return styleCache[t.mode];
};
// ---------- SAMPLE DATA ----------
// Replace with database values once the backend is connected.

const DASHBOARD_DATA = {
  registrar: {
    roleLabel: 'REGISTRAR',
    subtitle: 'Institution-wide scheduling',
    heroValue: 72,
    heroCaption: 'Timetable completion',
    heroSub: 'On track for this term',
    mini: [
      { label: 'Published', value: '38' },
      { label: 'In draft', value: '29' },
      { label: 'Pending', value: '11' },
    ],
    stats: [
      { label: 'Faculty', value: 124, delta: '+3', spark: [110, 112, 115, 118, 119, 122, 124], colors: GRAD.blue },
      { label: 'Courses', value: 86, delta: '+5', spark: [70, 74, 77, 80, 82, 84, 86], colors: GRAD.lavender },
      { label: 'Sections', value: 42, delta: '0', spark: [40, 41, 42, 41, 42, 42, 42], colors: GRAD.green },
      { label: 'Classrooms', value: 38, delta: '-1', spark: [39, 39, 40, 38, 39, 38, 38], colors: GRAD.amber },
    ],
    weekLoad: [48, 52, 45, 50, 31],
    usageTitle: 'Room utilization',
    usage: [
      { name: 'Lecture halls', percent: 84, colors: GRAD.blue },
      { name: 'Computer labs', percent: 92, colors: GRAD.red },
      { name: 'Seminar rooms', percent: 58, colors: GRAD.green },
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
      'Timetable draft generated for Computer Science',
      'Room B-204 availability updated',
      'Faculty leave added: Dr. Sana (Thu)',
    ],
  },

  hod: {
    roleLabel: 'HOD',
    subtitle: 'Department scheduling',
    heroValue: 64,
    heroCaption: 'Timetable completion',
    heroSub: 'Needs attention before deadline',
    mini: [
      { label: 'Sections', value: '8' },
      { label: 'Clashes', value: '2' },
      { label: 'Suggestions', value: '1' },
    ],
    stats: [
      { label: 'Dept. Faculty', value: 18, delta: '+1', spark: [15, 16, 16, 17, 17, 18, 18], colors: GRAD.blue },
      { label: 'Courses', value: 12, delta: '+2', spark: [8, 9, 9, 10, 11, 11, 12], colors: GRAD.lavender },
      { label: 'Sections', value: 8, delta: '0', spark: [8, 8, 8, 8, 8, 8, 8], colors: GRAD.green },
      { label: 'Classrooms', value: 6, delta: '-1', spark: [7, 7, 6, 6, 7, 6, 6], colors: GRAD.amber },
    ],
    weekLoad: [14, 16, 12, 15, 9],
    usageTitle: 'Room utilization',
    usage: [
      { name: 'Lecture rooms', percent: 71, colors: GRAD.blue },
      { name: 'Labs', percent: 88, colors: GRAD.red },
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
      'Teacher availability updated: Mr. Usman',
      'Section BSCS-2A timetable edited',
    ],
  },

  faculty: {
    roleLabel: 'FACULTY',
    subtitle: 'Your teaching schedule',
    heroValue: 75,
    heroCaption: 'Weekly load',
    heroSub: 'Within your 20-hour limit',
    mini: [
      { label: 'Classes', value: '12' },
      { label: 'Free slots', value: '9' },
      { label: 'Labs', value: '2' },
    ],
    stats: [
      { label: 'My Courses', value: 4, delta: '0', spark: [4, 4, 4, 4, 4, 4, 4], colors: GRAD.blue },
      { label: 'Weekly Classes', value: 12, delta: '+1', spark: [10, 10, 11, 11, 11, 12, 12], colors: GRAD.lavender },
      { label: 'Free Slots', value: 9, delta: '+2', spark: [5, 6, 6, 7, 8, 8, 9], colors: GRAD.green },
      { label: 'Rooms Used', value: 3, delta: '0', spark: [3, 3, 3, 3, 3, 3, 3], colors: GRAD.amber },
    ],
    weekLoad: [3, 2, 3, 2, 2],
    usageTitle: 'Hours this week',
    usage: [
      { name: 'Teaching', percent: 68, colors: GRAD.blue },
      { name: 'Office hours', percent: 40, colors: GRAD.green },
      { name: 'Free time', percent: 32, colors: GRAD.lavender },
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
      'Schedule updated: Thursday class moved',
      'Availability saved for next week',
    ],
  },
};

const ACTIONS_BY_ROLE = {
  registrar: [
    { label: 'Generate', sub: 'Build a new timetable', glyph: '✦', colors: GRAD.blue },
    { label: 'Timetable', sub: 'View all departments', glyph: '▦', colors: GRAD.lavender },
    { label: 'Faculty', sub: 'Manage staff and load', glyph: '◉', colors: GRAD.green },
    { label: 'Conflicts', sub: 'Scan for clashes', glyph: '!', colors: GRAD.red },
  ],
  hod: [
    { label: 'Generate', sub: 'Build department timetable', glyph: '✦', colors: GRAD.blue },
    { label: 'Timetable', sub: 'View your sections', glyph: '▦', colors: GRAD.lavender },
    { label: 'Availability', sub: 'Teacher time slots', glyph: '◷', colors: GRAD.green },
    { label: 'Conflicts', sub: 'Scan for clashes', glyph: '!', colors: GRAD.red },
  ],
  faculty: [
    { label: 'My Timetable', sub: 'Your weekly classes', glyph: '▦', colors: GRAD.blue },
    { label: 'Availability', sub: 'Update free slots', glyph: '◷', colors: GRAD.green },
    { label: 'Calendar', sub: 'Dates and events', glyph: '◫', colors: GRAD.lavender },
    { label: 'Profile', sub: 'Account and settings', glyph: '◉', colors: GRAD.amber },
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
  { color: 'rgba(255,77,109,0.55)', label: 'Booked' },
  { color: 'rgba(255,181,71,0.5)', label: 'Limited' },
  { color: 'rgba(79,124,255,0.65)', label: 'Open' },
  { color: '#2BD39A', label: 'Free' },
];

const TAG_STYLES = {
  high: { color: '#FF5C7A', label: 'HIGH' },
  low: { color: '#FFB547', label: 'LOW' },
  info: { color: '#4F7CFF', label: 'INFO' },
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// ---------- CHART COMPONENTS ----------

const GradientDef = ({ id, colors, vertical = false }) => (
  <Defs>
    <LinearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2="1">
      <Stop offset="0" stopColor={colors[0]} />
      <Stop offset="1" stopColor={colors[1]} />
    </LinearGradient>
  </Defs>
);

const Donut = ({ id, value, size = 120, stroke = 12, colors = GRAD.blue, track, children }) => {
  const t = useTheme();
  const center = size / 2;
  const r = center - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <GradientDef id={id} colors={colors} />
        <Circle cx={center} cy={center} r={r} stroke={track || t.track} strokeWidth={stroke} fill="none" />
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
      <View style={getStyles(t).donutCenter}>{children}</View>
    </View>
  );
};

const Sparkline = ({ id, data, width = 110, height = 36, color = '#4F7CFF' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i * width) / (data.length - 1),
    y: height - ((v - min) / range) * (height - 6) - 3,
  }));
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.4" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${id})`} />
      <Path
        d={line}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const WeekBars = ({ values, labels }) => {
  const t = useTheme();
  const H = 110;
  const gap = 12;
  const n = values.length;
  const barW = (CARD_INNER_W - gap * (n - 1)) / n;
  const max = Math.max(...values);
  const peakIndex = values.indexOf(max);

  return (
    <Svg width={CARD_INNER_W} height={H + 30}>
      <GradientDef id="weekBlue" colors={GRAD.blue} vertical />
      <GradientDef id="weekPeak" colors={GRAD.green} vertical />
      {values.map((v, i) => {
        const h = Math.max(10, (v / max) * H);
        const x = i * (barW + gap);
        const isPeak = i === peakIndex;
        return (
          <React.Fragment key={labels[i]}>
            <Rect
              x={x}
              y={H - h}
              width={barW}
              height={h}
              rx={10}
              fill={isPeak ? 'url(#weekPeak)' : 'url(#weekBlue)'}
            />
            <SvgText
              x={x + barW / 2}
              y={H - h - 7}
              fontSize="11"
              fontWeight="700"
              fill={isPeak ? t.green : t.muted}
              textAnchor="middle"
            >
              {v}
            </SvgText>
            <SvgText
              x={x + barW / 2}
              y={H + 20}
              fontSize="11"
              fontWeight="700"
              fill={t.muted}
              textAnchor="middle"
            >
              {labels[i]}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

const UsageBar = ({ id, name, percent, colors }) => {
  const t = useTheme();
  const s = getStyles(t);
  return (
    <View style={s.usageRow}>
      <View style={s.usageHeader}>
        <Text style={s.usageLabel}>{name}</Text>
        <Text style={[s.usageValue, { color: colors[0] }]}>{percent}%</Text>
      </View>
      <Svg width={CARD_INNER_W} height={10}>
        <Rect x={0} y={0} width={CARD_INNER_W} height={10} rx={5} fill={t.track} />
        <GradientDef id={id} colors={colors} />
        <Rect
          x={0}
          y={0}
          width={(CARD_INNER_W * percent) / 100}
          height={10}
          rx={5}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
};

const GradientPanel = ({ id, colors, style, children }) => {
  const s = getStyles(useTheme());
  return (
    <View style={[s.panelWrap, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <GradientDef id={id} colors={colors} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
};

// ---------- QUICK ACTIONS ----------

const QuickActions = ({ role, s }) => {
  const actions = ACTIONS_BY_ROLE[role] || ACTIONS_BY_ROLE.hod;

  const handlePress = (label) => {
    Alert.alert('Coming soon', `${label} will be available in the next update.`);
  };

  return (
    <>
      <Text style={s.sectionTitle}>QUICK ACTIONS</Text>
      <View style={s.qaGrid}>
        {actions.map((action, i) => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [s.qaTile, pressed && s.qaTilePressed]}
            onPress={() => handlePress(action.label)}
          >
            <View style={[s.qaAccent, { backgroundColor: action.colors[0] }]} />

            <View style={s.qaIconWrap}>
              <Svg style={StyleSheet.absoluteFill} width={46} height={46}>
                <GradientDef id={`qa${i}`} colors={action.colors} />
                <Circle cx={23} cy={23} r={23} fill={`url(#qa${i})`} />
              </Svg>
              <Text style={s.qaGlyph}>{action.glyph}</Text>
            </View>

            <Text style={s.qaLabel}>{action.label}</Text>
            <Text style={s.qaSub}>{action.sub}</Text>

            <View style={s.qaFooter}>
              <View style={[s.qaFooterDot, { backgroundColor: action.colors[0] }]} />
              <Text style={[s.qaFooterText, { color: action.colors[0] }]}>Open →</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
};

// ---------- SCREEN ----------

const DashboardScreen = ({ route }) => {
  const role = route?.params?.role || 'hod';
  const userName = route?.params?.name || 'User';
  const data = DASHBOARD_DATA[role] || DASHBOARD_DATA.hod;

  const [mode, setMode] = useState('dark');
  const t = THEMES[mode] || THEMES.dark;
  const s = getStyles(t);

  const [suggestions, setSuggestions] = useState(data.suggestions);

  const handleSuggestion = (id, accepted) => {
    setSuggestions((prev) => prev.filter((item) => item.id !== id));
    if (accepted) {
      Alert.alert(
        'Suggestion accepted',
        'Saved to the draft timetable. Nothing is published until it is approved.',
      );
    }
  };

  // Conflict breakdown
  const counts = data.list.reduce((acc, item) => {
    acc[item.tag] = (acc[item.tag] || 0) + 1;
    return acc;
  }, {});
  const total = data.list.length || 1;
  let runningX = 0;
  const segments = ['high', 'low', 'info']
    .filter((key) => counts[key])
    .map((key) => {
      const w = (CARD_INNER_W * counts[key]) / total;
      const seg = { key, x: runningX, w: w - 4, color: TAG_STYLES[key].color };
      runningX += w;
      return seg;
    });

  const initial = userName.charAt(0).toUpperCase();
  const peakDay = DAYS[data.weekLoad.indexOf(Math.max(...data.weekLoad))];

  return (
    <ThemeContext.Provider value={t}>
      <View style={s.container}>
        <StatusBar barStyle={t.statusBar} backgroundColor={t.bg} />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* TOP BAR */}
          <View style={s.topBar}>
            <View>
              <Text style={s.greeting}>{getGreeting()}</Text>
              <Text style={s.name}>{userName}</Text>
            </View>
            <View style={s.topRight}>
              <Pressable
                style={s.iconBtn}
                onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              >
                <Text style={s.iconGlyph}>{mode === 'dark' ? '☀' : '☾'}</Text>
              </Pressable>
              <View style={s.iconBtn}>
                <Text style={s.iconGlyph}>◔</Text>
                <View style={s.bellDot} />
              </View>
              <View style={s.avatarWrap}>
                <Svg style={StyleSheet.absoluteFill} width={44} height={44}>
                  <GradientDef id="avatarGrad" colors={t.avatarGrad} />
                  <Circle cx={22} cy={22} r={22} fill="url(#avatarGrad)" />
                </Svg>
                <Text style={s.avatarText}>{initial}</Text>
              </View>
            </View>
          </View>

          {/* HERO */}
          <GradientPanel id="heroBg" colors={t.heroGrad} style={s.hero}>
            <View style={s.heroRow}>
              <View style={s.heroLeft}>
                <View style={s.rolePill}>
                  <View style={s.roleDot} />
                  <Text style={s.rolePillText}>{data.roleLabel}</Text>
                </View>
                <Text style={s.heroTitle}>{data.heroSub}</Text>
                <Text style={s.heroSubtitle}>{data.subtitle}</Text>

                <View style={s.miniRow}>
                  {data.mini.map((m) => (
                    <View key={m.label} style={s.miniItem}>
                      <Text style={s.miniValue}>{m.value}</Text>
                      <Text style={s.miniLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Donut id="heroDonut" value={data.heroValue} size={112} stroke={11} colors={GRAD.blue}>
                <Text style={s.donutValue}>{data.heroValue}%</Text>
                <Text style={s.donutCaption}>{data.heroCaption}</Text>
              </Donut>
            </View>
          </GradientPanel>

          {/* OVERVIEW */}
          <Text style={s.sectionTitle}>OVERVIEW</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.statsRow}
          >
            {data.stats.map((stat, i) => {
              const isNeg = stat.delta.startsWith('-');
              const isNeutral = stat.delta === '0';
              const deltaColor = isNeg ? t.red : isNeutral ? t.muted : t.green;
              return (
                <View key={stat.label} style={s.statCard}>
                  <Text style={s.statLabel}>{stat.label}</Text>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={[s.statDelta, { color: deltaColor }]}>
                    {isNeutral ? 'No change' : `${stat.delta} this term`}
                  </Text>
                  <View style={s.sparkWrap}>
                    <Sparkline id={`spark${i}`} data={stat.spark} color={stat.colors[0]} />
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
                <UsageBar
                  key={u.name}
                  id={`usage${i}`}
                  name={u.name}
                  percent={u.percent}
                  colors={u.colors}
                />
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
                {DAYS.map((d, c) => (
                  <View
                    key={d}
                    style={[s.heatBlock, { backgroundColor: LEVELS[AVAIL[r][c]].color }]}
                  />
                ))}
              </View>
            ))}

            <View style={s.legendRow}>
              {LEVELS.map((lvl) => (
                <View key={lvl.label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: lvl.color }]} />
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

            <Svg width={CARD_INNER_W} height={10} style={{ marginTop: 14 }}>
              <Rect x={0} y={0} width={CARD_INNER_W} height={10} rx={5} fill={t.track} />
              {segments.map((seg) => (
                <Rect key={seg.key} x={seg.x} y={0} width={seg.w} height={10} rx={5} fill={seg.color} />
              ))}
            </Svg>
            <View style={s.legendRow}>
              {segments.map((seg) => (
                <View key={seg.key} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: seg.color }]} />
                  <Text style={s.legendText}>
                    {counts[seg.key]} {TAG_STYLES[seg.key].label.toLowerCase()}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 14 }}>
              {data.list.map((item) => {
                const tag = TAG_STYLES[item.tag];
                return (
                  <View key={item.id} style={s.listItem}>
                    <View style={[s.listBar, { backgroundColor: tag.color }]} />
                    <View style={s.listText}>
                      <Text style={s.listTitleText}>{item.title}</Text>
                      <Text style={s.listDetail}>{item.detail}</Text>
                    </View>
                    <Text style={[s.tagText, { color: tag.color }]}>{tag.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI COPILOT */}
          <GradientPanel id="aiBg" colors={t.aiGrad} style={s.aiPanel}>
            <View style={s.aiHeader}>
              <View style={s.aiBadge}>
                <Text style={s.aiBadgeText}>AI</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.aiTitle}>Copilot suggestions</Text>
                <Text style={s.aiSub}>Ranked by confidence</Text>
              </View>
            </View>

            {suggestions.length === 0 && (
              <Text style={s.aiEmpty}>All suggestions reviewed.</Text>
            )}

            {suggestions.map((item, i) => (
              <View key={item.id} style={s.aiItem}>
                <View style={s.aiItemTop}>
                  <Donut
                    id={`conf${i}`}
                    value={item.confidence}
                    size={46}
                    stroke={5}
                    colors={GRAD.green}
                    track={t.aiTrack}
                  >
                    <Text style={s.confValue}>{item.confidence}</Text>
                  </Donut>
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
          </GradientPanel>

          {/* ACTIVITY */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Recent activity</Text>
            <View style={{ marginTop: 14 }}>
              {data.activity.map((item, i) => (
                <View key={i} style={s.activityRow}>
                  <View style={s.activityLine}>
                    <View style={s.activityDot} />
                    {i < data.activity.length - 1 && <View style={s.activityStem} />}
                  </View>
                  <Text style={s.activityText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <QuickActions role={role} s={s} />

          <Text style={s.demoNote}>
            Sample data · live numbers appear once the database is connected
          </Text>
        </ScrollView>
      </View>
    </ThemeContext.Provider>
  );
};

export default DashboardScreen;