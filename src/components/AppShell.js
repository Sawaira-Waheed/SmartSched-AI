import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

// Top bar shown on every screen after login.
const AppShell = ({ title, onMenu, onHome, showHome = false, onToggleMode, children }) => {
  const insets = useSafeAreaInsets();
  const { c, shadow, mode } = useTheme();
  const styles = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={onMenu}
          style={styles.iconButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <View style={styles.bar} />
          <View style={[styles.bar, styles.barShort]} />
          <View style={styles.bar} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.underline} />
        </View>

        <View style={styles.rightGroup}>
          {showHome ? (
            <Pressable
              onPress={onHome}
              style={[styles.iconButton, styles.rightButton]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go to dashboard"
            >
              <Text style={styles.homeGlyph}>⌂</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onToggleMode}
            style={[styles.iconButton, styles.rightButton]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Switch theme"
          >
            <Text style={styles.themeGlyph}>{mode === 'light' ? '☾' : '☀'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  );
};

export default AppShell;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: c.surface,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      ...shadow,
    },

    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    bar: {
      width: 18,
      height: 2.5,
      borderRadius: 2,
      backgroundColor: c.primary,
      marginVertical: 2.5,
    },

    barShort: {
      width: 12,
    },

    titleWrap: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 10,
    },

    title: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
    },

    underline: {
      width: 26,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.pink,
      marginTop: 4,
    },

    rightGroup: {
      width: 92,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },

    rightButton: {
      marginLeft: 8,
    },

    homeGlyph: {
      fontSize: 20,
      color: c.primary,
      fontWeight: '700',
    },

    themeGlyph: {
      fontSize: 17,
      color: c.pink,
      fontWeight: '700',
    },

    body: {
      flex: 1,
    },
  });