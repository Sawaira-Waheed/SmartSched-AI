import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Top bar shown on every screen after login.
const AppShell = ({ title, onMenu, children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={onMenu}
          style={styles.menuButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <View style={styles.bar} />
          <View style={[styles.bar, styles.barShort]} />
          <View style={styles.bar} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  );
};

export default AppShell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0B1222',
    borderBottomWidth: 1,
    borderBottomColor: '#1C2A47',
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0E1626',
    borderWidth: 1,
    borderColor: '#1C2A47',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#A9B6FF',
    marginVertical: 2.5,
  },

  barShort: {
    width: 12,
  },

  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 10,
  },

  spacer: {
    width: 40,
  },

  body: {
    flex: 1,
  },
});