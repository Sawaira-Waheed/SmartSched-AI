import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({
  text,
  onPress,
  style,
  loading = false,
  disabled = false,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.text}>{text}</Text>
          <Text style={styles.arrow}>→</Text>
        </>
      )}
    </Pressable>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: '#6C3BFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  buttonDisabled: {
    backgroundColor: '#A6A0B5',
    opacity: 0.6,
  },

  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },
});