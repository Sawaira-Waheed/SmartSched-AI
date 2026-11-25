import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useTheme } from '../theme/theme';
import { supabase } from '../lib/supabase';
import { loadProfile } from '../lib/auth';

const SplashScreen = ({ navigation }) => {
  const { c, mode, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  useEffect(() => {
    let active = true;

    const minDelay = new Promise((resolve) => setTimeout(resolve, 2800));

    // Returns the profile if a session was saved on this phone, otherwise null
    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return null;
        return await loadProfile(data.session.user.id);
      } catch (e) {
        return null;
      }
    };

    Promise.all([minDelay, restoreSession()]).then(([, profile]) => {
      if (!active) return;
      if (profile) {
        navigation?.replace('dashboard', {
          role: profile.role,
          name: profile.full_name,
          departmentId: profile.department_id,
        });
      } else {
        navigation?.replace('welcome');
      }
    });

    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <View style={s.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />

      <View style={s.blobTop} />
      <View style={s.blobBottom} />

      <View style={s.logo}>
        <Text style={s.logoText}>S</Text>
        <View style={s.logoDot} />
      </View>

      <Text style={s.brand}>
        SmartSched <Text style={s.brandAi}>AI</Text>
      </Text>
      <Text style={s.tagline}>Intelligent scheduling for universities</Text>

      <View style={s.loader}>
        <ActivityIndicator size="small" color={c.primary} />
        <Text style={s.loadingText}>Preparing your workspace…</Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },

    blobTop: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: c.primarySoft,
      top: -110,
      right: -90,
    },
    blobBottom: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: c.skySoft,
      bottom: -100,
      left: -80,
    },

    logo: {
      width: 110,
      height: 110,
      borderRadius: 34,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    logoText: { color: c.white, fontSize: 56, fontWeight: '800' },
    logoDot: {
      position: 'absolute',
      top: 18,
      right: 18,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.pink,
    },

    brand: { fontSize: 28, fontWeight: '800', color: c.text, marginTop: 26, letterSpacing: 0.3 },
    brandAi: { color: c.primary },
    tagline: { fontSize: 13, color: c.muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 30 },

    loader: { position: 'absolute', bottom: 70, alignItems: 'center' },
    loadingText: { fontSize: 12, color: c.muted, marginTop: 12, fontWeight: '600' },
  });