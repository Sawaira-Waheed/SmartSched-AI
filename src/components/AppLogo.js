import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Logo = ({ size = 'small', showAppName = false }) => {
  if (size === 'large') {
    return (
      <View style={styles.largeLogoOuter}>
        <View style={styles.largeLogoInner}>
          <Text style={styles.largeLogoS}>S</Text>
          <View style={styles.largeAiDot} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.smallLogo}>
        <Text style={styles.smallLogoText}>S</Text>
        <View style={styles.smallDot} />
      </View>

      {showAppName && (
        <Text style={styles.appName}>
          SmartSched
          <Text style={styles.aiText}> AI</Text>
        </Text>
      )}
    </>
  );
};

export default Logo;

const styles = StyleSheet.create({
  // Large Logo (for Splash)
  largeLogoOuter: {
    width: 108,
    height: 108,
    borderRadius: 32,
    backgroundColor: '#E5DEFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C3BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 25,
  },

  largeLogoInner: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: '#6C3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  largeLogoS: {
    fontSize: 55,
    fontWeight: '800',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },

  largeAiDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#BFAEFF',
    top: 15,
    right: 15,
  },

  // Small Logo (for other screens)
  smallLogo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#6C3BFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
    elevation: 6,
  },

  smallLogoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    fontStyle: 'italic',
  },

  smallDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BFAEFF',
    top: 9,
    right: 9,
  },

  // App Name
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#24104F',
    letterSpacing: -1,
    textAlign: 'center',
  },

  aiText: {
    color: '#6C3BFF',
  },
});