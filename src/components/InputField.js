import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon = '@',
  secureTextEntry = false,
  keyboardType = 'default',
  showToggle = false,
  onTogglePassword,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
    if (onTogglePassword) {
      onTogglePassword(!isPasswordVisible);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          error && styles.inputWrapperError,
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#AAA4B8"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
        />

        {showToggle && (
          <Pressable
            onPress={togglePasswordVisibility}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 19,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B3151',
    marginBottom: 8,
  },

  inputWrapper: {
    height: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0EF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  inputWrapperError: {
    borderColor: '#C5B9E8',
    backgroundColor: '#FCFAFF',
  },

  icon: {
    width: 27,
    fontSize: 13,
    fontWeight: '700',
    color: '#8A78C9',
    textAlign: 'center',
    marginRight: 7,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#24104F',
    height: '100%',
  },

  toggleButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BFF',
  },

  errorText: {
    fontSize: 10,
    color: '#8A78A8',
    marginTop: 6,
    marginLeft: 3,
  },
});