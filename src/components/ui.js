import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';

// Small pieces shared by the module screens.

const makeUi = (c, shadow) =>
  StyleSheet.create({
    chip: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
      ...shadow,
    },
    chipActive: { backgroundColor: c.primary },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.white },
    chipSub: { fontSize: 10, color: c.muted, marginTop: 2 },
    chipSubActive: { color: 'rgba(255,255,255,0.85)' },

    statsRow: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 16 },
    statTile: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 5,
      ...shadow,
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 10, color: c.muted, fontWeight: '700', marginTop: 3 },

    scope: {
      backgroundColor: c.primarySoft,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 14,
    },
    scopeTitle: { fontSize: 13, fontWeight: '800', color: c.primary },
    scopeText: { fontSize: 11, color: c.text, marginTop: 3, lineHeight: 16 },

    empty: {
      backgroundColor: c.surface,
      borderRadius: 22,
      padding: 24,
      alignItems: 'center',
      marginBottom: 12,
      ...shadow,
    },
    emptyText: { fontSize: 13, color: c.muted, textAlign: 'center' },
  });

const useUi = () => {
  const { c, shadow } = useTheme();
  return useMemo(() => makeUi(c, shadow), [c, shadow]);
};

export const Chip = ({ label, sub, active, onPress }) => {
  const s = useUi();
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
      {sub ? <Text style={[s.chipSub, active && s.chipSubActive]}>{sub}</Text> : null}
    </Pressable>
  );
};

export const StatsRow = ({ children }) => {
  const s = useUi();
  return <View style={s.statsRow}>{children}</View>;
};

export const StatTile = ({ value, label, color }) => {
  const s = useUi();
  return (
    <View style={s.statTile}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

export const ScopeBanner = ({ title, text }) => {
  const s = useUi();
  if (!title) return null;
  return (
    <View style={s.scope}>
      <Text style={s.scopeTitle}>{title}</Text>
      <Text style={s.scopeText}>{text}</Text>
    </View>
  );
};

export const EmptyCard = ({ text }) => {
  const s = useUi();
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
};