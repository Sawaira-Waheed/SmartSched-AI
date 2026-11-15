import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// Placeholder for modules that aren't built yet.
const ComingSoonScreen = ({ title, navigation, route }) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>NEXT UP</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>
        This module is next in the build order. It will be added in a later step.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('dashboard', route?.params)}
      >
        <Text style={styles.buttonText}>Back to dashboard</Text>
      </Pressable>
    </View>
  </View>
);

export default ComingSoonScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A14',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    backgroundColor: '#0E1626',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1C2A47',
    padding: 24,
    alignItems: 'center',
  },

  badge: {
    backgroundColor: 'rgba(79,124,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA8FF',
    letterSpacing: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
  },

  text: {
    fontSize: 13,
    color: '#7D8AA6',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#4F7CFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});