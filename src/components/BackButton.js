import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const BackButton = ({ onPress, text = 'Back to Sign In' }) => {
  return (
    <Pressable
      style={styles.backButton}
      onPress={onPress}
    >
      <Text style={styles.backButtonText}>←</Text>
      <Text style={styles.backText}>
        {text}
      </Text>
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 25,
  },

  backButtonText: {
    fontSize: 20,
    color: '#6C3BFF',
    marginRight: 7,
  },

  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BFF',
  },
});