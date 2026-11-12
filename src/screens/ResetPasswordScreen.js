import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import AppLogo from '../components/AppLogo';
import Card from '../components/Card';

const ResetPasswordScreen = ({ navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    let newErrors = {};

    if (!newPassword) {
      newErrors.password = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    return newErrors;
  };

  const handleResetPassword = () => {
    setSubmitted(true);
    setSuccessMessage('');

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Success
      setSuccessMessage('Your password has been reset successfully!');
      console.log('Password Reset:', { newPassword });
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        navigation.replace('login');
      }, 2000);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6FF" />

      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          {/* Back Button */}
          <BackButton
            onPress={() => navigation.navigate('OtpVerification')}
            text="Back"
          />

          {/* Logo */}
          <View style={styles.logoContainer}>
            <AppLogo size="small" />
          </View>

          {/* Heading */}
          <Text style={styles.title}>Create new password</Text>

          <Text style={styles.subtitle}>
            Your new password must be different from{'\n'}
            your previous password.
          </Text>

          {/* Error Hint */}
          {submitted &&
            (
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword
            ) &&
            !successMessage && (
              <Card
                icon="⚠️"
                title="Complete Password Reset"
                message="Please fill in all fields correctly"
                type="warning"
              />
            )}

          {/* New Password */}
          <InputField
            label="New Password"
            placeholder="Create a new password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setSubmitted(false);
            }}
            error={errors.password}
            icon="●"
            secureTextEntry={!showPassword}
            showToggle={true}
            onTogglePassword={setShowPassword}
          />

          {/* Confirm Password */}
          <InputField
            label="Confirm Password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setSubmitted(false);
            }}
            error={errors.confirmPassword}
            icon="●"
            secureTextEntry={!showConfirmPassword}
            showToggle={true}
            onTogglePassword={setShowConfirmPassword}
          />

          {/* Password Requirements */}
          <Card
            icon="✓"
            title="Password Requirements"
            message="At least 6 characters for security"
            type="info"
          />

          {/* Success Message */}
          {successMessage && (
            <Card
              icon="✓"
              title="Password Reset Successful"
              message={successMessage}
              type="success"
            />
          )}

          {/* Reset Button */}
          <Button
            text="Reset Password"
            onPress={handleResetPassword}
            style={styles.resetButton}
          />

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInText}>
              Remember your password?
            </Text>
            <Pressable onPress={() => navigation.navigate('login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>

          {/* Security Footer */}
          <View style={styles.securityRow}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your password is securely encrypted
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    overflow: 'hidden',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 28,
  },

  circleTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EEE9FF',
    top: -120,
    right: -80,
  },

  circleBottom: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#F0ECFF',
    bottom: -100,
    left: -80,
  },

  content: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingBottom: 35,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#24104F',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: '#77718A',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
    paddingHorizontal: 5,
  },

  resetButton: {
    marginBottom: 22,
  },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  signInText: {
    fontSize: 13,
    color: '#77718A',
  },

  signInLink: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#6C3BFF',
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E0EF',
  },

  securityIcon: {
    fontSize: 14,
    marginRight: 8,
  },

  securityText: {
    fontSize: 12,
    color: '#77718A',
  },
});