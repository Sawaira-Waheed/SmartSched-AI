import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';

// Placeholder for modules that aren't built yet.
const ComingSoonScreen = ({ title, navigation, route }) => {
  const { c, shadow } = useTheme();
  const styles = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.bubble}>
          <Text style={styles.sparkle}>✦</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>
          This module is on the roadmap and will be added in a later step.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('dashboard', route?.params)}
        >
          <Text style={styles.buttonText}>Back to dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ComingSoonScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: 'center',
      padding: 24,
    },

    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 26,
      alignItems: 'center',
      ...shadow,
    },

    bubble: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },

    sparkle: {
      fontSize: 30,
      color: c.primary,
    },

    badge: {
      backgroundColor: c.pinkSoft,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },

    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.pink,
      letterSpacing: 1,
    },

    title: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      marginTop: 14,
    },

    text: {
      fontSize: 13,
      color: c.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 8,
      marginBottom: 22,
    },

    button: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 22,
    },

    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },

    buttonText: {
      color: c.white,
      fontSize: 14,
      fontWeight: '800',
    },
  });