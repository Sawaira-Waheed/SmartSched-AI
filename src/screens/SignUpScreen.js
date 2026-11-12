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

const SignUpScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    let newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!selectedRole) {
      newErrors.role = 'Please select a role';
    }

    return newErrors;
  };

  const handleCreateAccount = () => {
    setSubmitted(true);
    setSuccessMessage('');

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Success
      setSuccessMessage(
        'Account request submitted. Your request has been sent to the Registrar for approval.'
      );
      console.log('Sign Up:', {
        fullName,
        email,
        password,
        role: selectedRole,
      });
      // TODO: Connect to backend
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
          <Text style={styles.title}>Create your account</Text>

          <Text style={styles.subtitle}>
            Join SmartSched AI and simplify your academic scheduling.
          </Text>

          {/* Error Hint */}
          {submitted &&
            (
              !fullName.trim() ||
              !email.trim() ||
              !password ||
              !confirmPassword ||
              !selectedRole
            ) &&
            !successMessage && (
              <Card
                icon="•"
                title="Complete Required Fields"
                message="Please fill in all fields to continue"
                type="warning"
              />
            )}

          {/* Full Name */}
          <InputField
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setSubmitted(false);
            }}
            error={errors.fullName}
            icon="Aa"
          />

          {/* Email */}
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

          {/* Password */}
          <InputField
            label="Password"
            placeholder="Create a password"
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

          {/* Confirm Password */}
          <InputField
            label="Confirm Password"
            placeholder="Confirm your password"
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

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Request Role</Text>

            <Text style={styles.roleHint}>
              Your selected role must be approved by the Registrar.
            </Text>

            <View style={styles.roleContainer}>
              {/* HOD */}
              <Pressable
                style={[
                  styles.roleCard,
                  selectedRole === 'HOD' && styles.roleCardSelected,
                  submitted && !selectedRole && styles.roleCardError,
                ]}
                onPress={() => {
                  setSelectedRole('HOD');
                  setSubmitted(false);
                }}
              >
                <View style={styles.roleTopRow}>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === 'HOD' &&
                        styles.roleTitleSelected,
                    ]}
                  >
                    HOD
                  </Text>
                  {selectedRole === 'HOD' && (
                    <Text style={styles.selectedMark}>✓</Text>
                  )}
                </View>
                <Text style={styles.roleDescription}>
                  Department management
                </Text>
              </Pressable>

              {/* Faculty */}
              <Pressable
                style={[
                  styles.roleCard,
                  selectedRole === 'Faculty' &&
                    styles.roleCardSelected,
                  submitted && !selectedRole && styles.roleCardError,
                ]}
                onPress={() => {
                  setSelectedRole('Faculty');
                  setSubmitted(false);
                }}
              >
                <View style={styles.roleTopRow}>
                  <Text
                    style={[
                      styles.roleTitle,
                      selectedRole === 'Faculty' &&
                        styles.roleTitleSelected,
                    ]}
                  >
                    Faculty Member
                  </Text>
                  {selectedRole === 'Faculty' && (
                    <Text style={styles.selectedMark}>✓</Text>
                  )}
                </View>
                <Text style={styles.roleDescription}>
                  Teaching & availability
                </Text>
              </Pressable>
            </View>

            {errors.role && (
              <Text style={styles.errorText}>{errors.role}</Text>
            )}

            <Text style={styles.adminNote}>
              Registrar access is managed by the University Administrator.
            </Text>
          </View>

          {/* Security Notice */}
          <Card
            icon="🔐"
            title="Role verification required"
            message="Account access is granted only after Registrar approval and identity verification."
            type="info"
          />

          {/* Success Message */}
          {successMessage && (
            <Card
              icon="✓"
              title="Request submitted"
              message={successMessage}
              type="success"
            />
          )}

          {/* Create Account Button */}
          <Button
            text="Create Account"
            onPress={handleCreateAccount}
            style={styles.createButton}
          />

          {/* Sign In Link */}
          <View style={styles.alreadyRow}>
            <Text style={styles.alreadyText}>
              Already have an account?
            </Text>
            <Pressable onPress={() => navigation.navigate('login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

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

  roleSection: {
    marginBottom: 18,
  },

  roleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B3151',
    marginBottom: 8,
  },

  roleHint: {
    fontSize: 11,
    color: '#8D879B',
    marginTop: -3,
    marginBottom: 10,
  },

  roleContainer: {
    gap: 10,
    marginBottom: 12,
  },

  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0EF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  roleCardSelected: {
    borderColor: '#6C3BFF',
    backgroundColor: '#F0ECFF',
  },

  roleCardError: {
    borderColor: '#C5B9E8',
  },

  roleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  roleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3B3151',
  },

  roleTitleSelected: {
    color: '#6C3BFF',
  },

  selectedMark: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6C3BFF',
  },

  roleDescription: {
    marginTop: 3,
    fontSize: 11,
    color: '#8D879B',
  },

  adminNote: {
    fontSize: 10,
    color: '#8D879B',
    lineHeight: 15,
    marginTop: 9,
    paddingHorizontal: 2,
  },

  errorText: {
    fontSize: 10,
    color: '#8A78A8',
    marginTop: 6,
    marginLeft: 3,
  },

  createButton: {
    marginBottom: 22,
  },

  alreadyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  alreadyText: {
    fontSize: 13,
    color: '#77718A',
  },

  signInLink: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#6C3BFF',
  },
});