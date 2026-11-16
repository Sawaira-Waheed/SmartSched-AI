import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/theme';

const INITIAL_SESSIONS = [
  { id: 'this', device: 'Windows PC · Chrome', place: 'Gujar Khan, PK', current: true },
  { id: 's2', device: 'Android · SmartSched app', place: 'Gujar Khan, PK', current: false },
];

const LOGIN_HISTORY = [
  { id: 'h1', time: 'Today · 9:02 AM', device: 'Windows PC', ok: true },
  { id: 'h2', time: 'Yesterday · 4:40 PM', device: 'Android', ok: true },
  { id: 'h3', time: 'Yesterday · 4:38 PM', device: 'Unknown device', ok: false },
  { id: 'h4', time: '2 days ago · 8:15 AM', device: 'Windows PC', ok: true },
];

const SettingsScreen = ({ navigation, themeMode, onToggleTheme }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [notify, setNotify] = useState({ clash: true, ai: true, updates: true, summary: false });
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdErr, setPwdErr] = useState({});

  const isDark = themeMode === 'dark';

  const toggleNotify = (key) => setNotify((prev) => ({ ...prev, [key]: !prev[key] }));

  const changePassword = () => {
    const e = {};
    if (!pwd.current) e.current = 'Enter your current password';
    if (pwd.next.length < 6) e.next = 'Use at least 6 characters';
    if (pwd.confirm !== pwd.next) e.confirm = "Passwords don't match";
    setPwdErr(e);
    if (Object.keys(e).length) return;

    // TODO: send the change to the backend
    setPwd({ current: '', next: '', confirm: '' });
    setShowPwd(false);
    Alert.alert('Password updated', 'Use your new password the next time you sign in.');
  };

  const signOutSession = (id) => {
    setSessions((prev) => prev.filter((x) => x.id !== id));
  };

  const signOutEverywhere = () => {
    Alert.alert('Sign out everywhere', 'This signs you out on all other devices. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out others', style: 'destructive', onPress: () => setSessions((prev) => prev.filter((x) => x.current)) },
    ]);
  };

  const logout = () => navigation.logout();

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Settings</Text>
      <Text style={s.subtitle}>Appearance, alerts and account security</Text>

      {/* APPEARANCE */}
      <Text style={s.section}>APPEARANCE</Text>
      <View style={s.card}>
        <SettingRow
          s={s}
          c={c}
          glyph={isDark ? '☀' : '☾'}
          tone="primary"
          title="Dark mode"
          sub={isDark ? 'Dark teal theme' : 'Light teal theme'}
          right={<Toggle on={isDark} onPress={onToggleTheme} c={c} s={s} />}
        />
      </View>

      {/* NOTIFICATIONS */}
      <Text style={s.section}>NOTIFICATIONS</Text>
      <View style={s.card}>
        <SettingRow
          s={s}
          c={c}
          glyph="!"
          tone="red"
          title="Clash alerts"
          sub="When a teacher, section or room is double-booked"
          right={<Toggle on={notify.clash} onPress={() => toggleNotify('clash')} c={c} s={s} />}
        />
        <SettingRow
          s={s}
          c={c}
          glyph="✦"
          tone="primary"
          title="AI suggestions"
          sub="When better slots are found"
          right={<Toggle on={notify.ai} onPress={() => toggleNotify('ai')} c={c} s={s} />}
        />
        <SettingRow
          s={s}
          c={c}
          glyph="✓"
          tone="mint"
          title="Timetable updates"
          sub="When your timetable changes"
          right={<Toggle on={notify.updates} onPress={() => toggleNotify('updates')} c={c} s={s} />}
        />
        <SettingRow
          s={s}
          c={c}
          glyph="≡"
          tone="sky"
          title="Daily summary"
          sub="One digest each morning"
          right={<Toggle on={notify.summary} onPress={() => toggleNotify('summary')} c={c} s={s} />}
          last
        />
      </View>

      {/* SECURITY */}
      <Text style={s.section}>SECURITY</Text>
      <View style={s.card}>
        <Pressable style={s.linkRow} onPress={() => setShowPwd((v) => !v)}>
          <View style={[s.iconBox, { backgroundColor: c.primarySoft }]}>
            <Text style={[s.iconGlyph, { color: c.primary }]}>●</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Change password</Text>
            <Text style={s.rowSub}>Use a strong password you don't reuse</Text>
          </View>
          <Text style={s.chev}>{showPwd ? '˄' : '›'}</Text>
        </Pressable>

        {showPwd ? (
          <View style={s.pwdBox}>
            <PwdField s={s} c={c} label="Current password" value={pwd.current} error={pwdErr.current} onChange={(v) => setPwd({ ...pwd, current: v })} />
            <PwdField s={s} c={c} label="New password" value={pwd.next} error={pwdErr.next} onChange={(v) => setPwd({ ...pwd, next: v })} />
            <PwdField s={s} c={c} label="Confirm new password" value={pwd.confirm} error={pwdErr.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} />
            <Pressable style={({ pressed }) => [s.saveBtn, pressed && s.pressed]} onPress={changePassword}>
              <Text style={s.saveBtnText}>Update password</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={s.section}>ACTIVE SESSIONS</Text>
      <View style={s.card}>
        {sessions.map((x, i) => (
          <View key={x.id} style={[s.sessionRow, i === sessions.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.iconBox, { backgroundColor: x.current ? c.mintSoft : c.surfaceAlt }]}>
              <Text style={[s.iconGlyph, { color: x.current ? c.mint : c.muted }]}>▣</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle} numberOfLines={1}>
                {x.device}
              </Text>
              <Text style={s.rowSub} numberOfLines={1}>
                {x.place} · {x.current ? 'This device' : 'Active'}
              </Text>
            </View>
            {!x.current ? (
              <Pressable onPress={() => signOutSession(x.id)} hitSlop={8}>
                <Text style={s.signOutOne}>Sign out</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {sessions.length > 1 ? (
          <Pressable style={s.outlineBtn} onPress={signOutEverywhere}>
            <Text style={s.outlineText}>Sign out other devices</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={s.section}>LOGIN HISTORY</Text>
      <View style={s.card}>
        {LOGIN_HISTORY.map((h, i) => (
          <View key={h.id} style={[s.historyRow, i === LOGIN_HISTORY.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.dot, { backgroundColor: h.ok ? c.mint : c.red }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{h.ok ? 'Signed in' : 'Failed sign-in'}</Text>
              <Text style={s.rowSub}>
                {h.device} · {h.time}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable style={({ pressed }) => [s.logoutBtn, pressed && s.pressed]} onPress={logout}>
        <Text style={s.logoutText}>Log out of this device</Text>
      </Pressable>

      <Text style={s.demoNote}>Sample data · sessions and history update once the backend is connected</Text>
    </ScrollView>
  );
};

const SettingRow = ({ s, c, glyph, tone, title, sub, right, last }) => (
  <View style={[s.row, last && { borderBottomWidth: 0 }]}>
    <View style={[s.iconBox, { backgroundColor: c[`${tone}Soft`] }]}>
      <Text style={[s.iconGlyph, { color: c[tone] }]}>{glyph}</Text>
    </View>
    <View style={{ flex: 1, marginRight: 10 }}>
      <Text style={s.rowTitle}>{title}</Text>
      <Text style={s.rowSub}>{sub}</Text>
    </View>
    {right}
  </View>
);

const Toggle = ({ on, onPress, c, s }) => (
  <Pressable onPress={onPress} hitSlop={8} style={[s.track, { backgroundColor: on ? c.primary : c.border }]}>
    <View style={[s.knob, on && s.knobOn]} />
  </Pressable>
);

const PwdField = ({ s, c, label, value, error, onChange }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={[s.input, error && s.inputError]}
      value={value}
      onChangeText={onChange}
      secureTextEntry
      autoCapitalize="none"
      placeholderTextColor={c.muted}
    />
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

export default SettingsScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    title: { fontSize: 26, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 3 },
    section: { fontSize: 11, fontWeight: '800', color: c.muted, letterSpacing: 1.2, marginTop: 22, marginBottom: 10 },

    card: { backgroundColor: c.surface, borderRadius: 22, paddingHorizontal: 16, ...shadow },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    iconBox: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    iconGlyph: { fontSize: 16, fontWeight: '800' },
    rowTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    rowSub: { fontSize: 11, color: c.muted, marginTop: 2 },

    track: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
    knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.white, alignSelf: 'flex-start' },
    knobOn: { alignSelf: 'flex-end' },

    linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    chev: { fontSize: 22, color: c.primary, marginLeft: 8 },
    pwdBox: { paddingBottom: 16, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 48,
      color: c.text,
      fontSize: 14,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    inputError: { borderColor: c.red },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, fontWeight: '600' },
    saveBtn: { backgroundColor: c.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    saveBtnText: { color: c.white, fontSize: 14, fontWeight: '800' },

    sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    signOutOne: { fontSize: 12, fontWeight: '800', color: c.red },
    outlineBtn: { borderWidth: 1.5, borderColor: c.red, borderRadius: 16, paddingVertical: 13, alignItems: 'center', marginVertical: 14 },
    outlineText: { fontSize: 13, fontWeight: '800', color: c.red },

    historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },

    logoutBtn: { backgroundColor: c.redSoft, borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
    logoutText: { fontSize: 14, fontWeight: '800', color: c.red },

    demoNote: { fontSize: 10, color: c.muted, textAlign: 'center', marginTop: 16 },
  });