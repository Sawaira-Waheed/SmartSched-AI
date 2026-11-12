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

const ForgotPasswordScreen = ({ navigation }) => {
  const [forgotEmail, setForgotEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleContinue = () => {
    setSubmitted(true);
    let newErrors = {};

    if (!forgotEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!forgotEmail.includes('@')) {
      newErrors.email = 'Please enter valid email';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Go to OTP Screen
      console.log('Continue with email:', forgotEmail);
      navigation.navigate('OtpVerification', { email: forgotEmail });
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
            onPress={() => navigation.navigate('login')}
            text="Back to Sign In"
          />

          {/* Logo */}
          <View style={styles.logoContainer}>
            <AppLogo size="small" />
          </View>

          {/* Heading */}
          <Text style={styles.title}>Forgot your password?</Text>

          <Text style={styles.subtitle}>
            No worries. Enter your university email and we'll help{'\n'}
            you reset your password.
          </Text>

          {/* Email Input */}
          <InputField
            label="University Email"
            placeholder="Enter your university email"
            value={forgotEmail}
            onChangeText={(text) => {
              setForgotEmail(text);
              setSubmitted(false);
            }}
            error={errors.email}
            icon="@"
            keyboardType="email-address"
          />

          {/* Security Notice */}
          <Card
            icon="✓"
            title="Secure password recovery"
            message="A verification code will be sent to your registered university email."
            type="info"
          />

          {/* Continue Button */}
          <Button
            text="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />

          {/* Remember Password */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              Remember your password?
            </Text>

            <Pressable onPress={() => navigation.navigate('login')}>
              <Text style={styles.switchLink}>Sign In</Text>
            </Pressable>
          </View>

          {/* Security Footer */}
          <View style={styles.securityRow}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your account information is protected
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

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

  continueButton: {
    marginBottom: 22,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  switchText: {
    fontSize: 13,
    color: '#77718A',
  },

  switchLink: {
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