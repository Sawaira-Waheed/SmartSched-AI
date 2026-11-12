import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
} from 'react-native';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import AppLogo from '../components/AppLogo';
import Card from '../components/Card';

const OtpScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Get email from route params (passed from ForgotPasswordScreen)
  const emailFromRoute = route?.params?.email || 'user@university.edu';

  // Timer Effect
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
  }, [otpTimer]);

  const handleVerifyOtp = () => {
    setSubmitted(true);
    let newErrors = {};

    if (!otp) {
      newErrors.otp = 'OTP is required';
    } else if (otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Go to Reset Password Screen
      console.log('OTP Verified:', otp);
      navigation.navigate('ResetPassword');
    }
  };

  const handleResendOtp = () => {
    setOtp('');
    setOtpTimer(60);
    setCanResendOtp(false);
    setSubmitted(false);
    console.log('OTP Resent to:', emailFromRoute);
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
            onPress={() => navigation.navigate('ForgotPassword')}
            text="Back"
          />

          {/* Logo */}
          <View style={styles.logoContainer}>
            <AppLogo size="small" />
          </View>

          {/* Heading */}
          <Text style={styles.title}>Verify your email</Text>

          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>
              {emailFromRoute}
            </Text>
          </Text>

          {/* OTP Input */}
          <View style={styles.otpInputGroup}>
            <Text style={styles.label}>Verification Code</Text>

            <TextInput
              style={[
                styles.otpInputField,
                submitted && (!otp || otp.length !== 6) && styles.otpInputError,
              ]}
              placeholder="000000"
              placeholderTextColor="#A6A0B5"
              value={otp}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, '');
                if (numericText.length <= 6) {
                  setOtp(numericText);
                  setSubmitted(false);
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
            />

            {submitted && !otp && (
              <Text style={styles.errorText}>
                Verification code is required.
              </Text>
            )}

            {submitted && otp && otp.length !== 6 && (
              <Text style={styles.errorText}>
                Code must be 6 digits.
              </Text>
            )}
          </View>

          {/* Timer & Resend */}
          <View style={styles.timerSection}>
            {otpTimer > 0 ? (
              <View style={styles.timerBox}>
                <Text style={styles.timerText}>Resend code in</Text>
                <Text style={styles.timerCount}>
                  {String(otpTimer).padStart(2, '0')}s
                </Text>
              </View>
            ) : (
              <Pressable
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={!canResendOtp}
              >
                <Text style={styles.resendText}>
                  Didn't receive code?{' '}
                  <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </Pressable>
            )}
          </View>

          {/* Info Card */}
          <Card
            icon="ℹ️"
            title="Check spam folder"
            message="If you don't see the email, check your spam or junk folder."
            type="info"
          />

          {/* Verify Button */}
          <Button
            text="Verify Code"
            onPress={handleVerifyOtp}
            style={styles.verifyButton}
          />

          {/* Back to Sign In */}
          <View style={styles.otpBackRow}>
            <Text style={styles.otpBackText}>Back to</Text>
            <Pressable onPress={() => navigation.navigate('login')}>
              <Text style={styles.otpBackLink}>Sign In</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

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

  emailHighlight: {
    fontWeight: '700',
    color: '#6C3BFF',
  },

  otpInputGroup: {
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B3151',
    marginBottom: 8,
  },

  otpInputField: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E0EF',
    borderRadius: 15,
    paddingHorizontal: 15,
    fontSize: 28,
    fontWeight: '600',
    color: '#24104F',
    letterSpacing: 8,
    textAlign: 'center',
  },

  otpInputError: {
    borderColor: '#C5B9E8',
    backgroundColor: '#FCFAFF',
  },

  errorText: {
    fontSize: 10,
    color: '#8A78A8',
    marginTop: 6,
    marginLeft: 3,
  },

  timerSection: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 60,
    justifyContent: 'center',
  },

  timerBox: {
    alignItems: 'center',
  },

  timerText: {
    fontSize: 12,
    color: '#77718A',
    marginBottom: 4,
  },

  timerCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6C3BFF',
  },

  resendButton: {
    paddingVertical: 10,
  },

  resendText: {
    fontSize: 12,
    color: '#77718A',
    textAlign: 'center',
  },

  resendLink: {
    fontWeight: '800',
    color: '#6C3BFF',
  },

  verifyButton: {
    marginBottom: 22,
  },

  otpBackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  otpBackText: {
    fontSize: 13,
    color: '#77718A',
  },

  otpBackLink: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#6C3BFF',
  },
});