import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../theme/theme';

const FEATURES = [
  { title: 'AI timetables', detail: 'Generate conflict-free schedules in minutes', glyph: '✦', colorKey: 'primary' },
  { title: 'Clash detection', detail: 'Catch teacher, room and section overlaps early', glyph: '!', colorKey: 'pink' },
  { title: 'Availability tracking', detail: 'Faculty set free slots once, and everyone sees them', glyph: '◷', colorKey: 'mint' },
];

const WelcomeScreen = ({ navigation }) => {
  const { c, mode, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  return (
    <View style={s.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />
      <View style={s.blobTop} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.logo}>
          <Text style={s.logoText}>S</Text>
        </View>

        <Text style={s.brand}>
          SmartSched <Text style={s.brandAi}>AI</Text>
        </Text>

        <Text style={s.title}>Smart scheduling for your university</Text>
        <Text style={s.subtitle}>Timetables, faculty availability and clash detection, all in one place.</Text>

        <View style={s.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={s.featureCard}>
              <View style={[s.featureIcon, { backgroundColor: c[`${f.colorKey}Soft`] }]}>
                <Text style={[s.featureGlyph, { color: c[f.colorKey] }]}>{f.glyph}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDetail}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
          onPress={() => navigation.navigate('signup')}
        >
          <Text style={s.primaryBtnText}>Get started</Text>
        </Pressable>

        <Pressable style={s.signInRow} onPress={() => navigation.navigate('login')}>
          <Text style={s.signInText}>
            I already have an account <Text style={s.signInLink}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, overflow: 'hidden' },
    scroll: { paddingHorizontal: 26, paddingTop: 70, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    blobTop: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: c.primarySoft,
      top: -120,
      right: -90,
    },

    logo: {
      width: 64,
      height: 64,
      borderRadius: 22,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      ...shadow,
    },
    logoText: { color: c.white, fontSize: 30, fontWeight: '800' },

    brand: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'center', marginTop: 12, letterSpacing: 0.3 },
    brandAi: { color: c.primary },

    title: { fontSize: 28, fontWeight: '800', color: c.text, textAlign: 'center', lineHeight: 34, marginTop: 26 },
    subtitle: { fontSize: 14, color: c.muted, textAlign: 'center', lineHeight: 21, marginTop: 10, marginBottom: 26 },

    features: { marginBottom: 26 },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 14,
      marginBottom: 12,
      ...shadow,
    },
    featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    featureGlyph: { fontSize: 18, fontWeight: '800' },
    featureTitle: { fontSize: 14, fontWeight: '800', color: c.text },
    featureDetail: { fontSize: 12, color: c.muted, marginTop: 3, lineHeight: 17 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    signInRow: { alignItems: 'center', marginTop: 18 },
    signInText: { fontSize: 13, color: c.muted },
    signInLink: { fontWeight: '800', color: c.primary },
  });