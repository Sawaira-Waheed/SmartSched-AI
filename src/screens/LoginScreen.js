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
import AppLogo from '../components/AppLogo';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleLogin = () => {
  setSubmitted(true);
  let newErrors = {};

  if (!email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!email.includes('@')) {
    newErrors.email = 'Please enter valid email';
  }

  if (!password) {
    newErrors.password = 'Password is required';
  } else if (password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);

  if (Object.keys(newErrors).length === 0) {
    navigation.replace('dashboard', {
      role: 'hod',
      name: email.split('@')[0],
    });
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F6FF"
      />

      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          <View style={styles.logoContainer}>
            <AppLogo size="small" />
          </View>

          <Text style={styles.welcomeText}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue to SmartSched AI
          </Text>

          {submitted && Object.keys(errors).length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorMessage}>
                Please fix the errors below
              </Text>
            </View>
          )}

          <InputField
            label="University Email"
            placeholder="Enter your university email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setSubmitted(false);
            }}
            error={errors.email}
            icon="@"
            keyboardType="email-address"
          />

          <View style={styles.passwordContainer}>
            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setSubmitted(false);
              }}
              error={errors.password}
              icon="●"
              secureTextEntry={!showPassword}
              showToggle={true}
              onTogglePassword={setShowPassword}
            />
          </View>

          <Pressable
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>
              Forgot password?
            </Text>
          </Pressable>

          <Button
            text="Sign In"
            onPress={handleLogin}
            style={styles.loginButton}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.SignUpLink}>
                Sign Up
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>

      <Text style={styles.securityText}>
        🔒 Secure access to your scheduling system
      </Text>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    overflow: 'hidden',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
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
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  welcomeText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#24104F',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#77718A',
    textAlign: 'center',
    marginBottom: 24,
  },

  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    alignItems: 'center',
  },

  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  errorMessage: {
    flex: 1,
    fontSize: 11,
    color: '#C62828',
    lineHeight: 16,
  },

  passwordContainer: {
    marginBottom: 12,
  },

  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 23,
  },

  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BFF',
  },

  loginButton: {
    marginBottom: 27,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 27,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3DEEB',
  },

  orText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: '#A09AAE',
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  signupText: {
    fontSize: 13,
    color: '#77718A',
  },

  SignUpLink: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#6C3BFF',
  },

  securityText: {
    position: 'absolute',
    bottom: 17,
    alignSelf: 'center',
    fontSize: 10,
    color: '#A09AAE',
  },
});