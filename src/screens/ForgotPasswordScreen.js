import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError = !submitted
    ? ''
    : !email.trim()
      ? 'Email is required'
      : !email.includes('@')
        ? 'Enter a valid email'
        : '';

  const handleContinue = () => {
    setSubmitted(true);
    if (!email.trim() || !email.includes('@')) return;
    // TODO: send the reset code via the backend
    navigation.navigate('otpverification', { email: email.trim() });
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('login')} style={s.backRow}>
          <Text style={s.backText}>← Back to sign in</Text>
        </Pressable>

        {/* ILLUSTRATION */}
        <View style={s.iconWrap}>
          <View style={s.iconBlob} />
          <View style={s.iconBubble}>
            <Text style={s.iconGlyph}>🔑</Text>
          </View>
        </View>

        <Text style={s.heading}>Forgot your password?</Text>
        <Text style={s.subheading}>
          No worries. Enter your university email and we'll send you a 6-digit code to reset it.
        </Text>

        <View style={s.card}>
          <Text style={s.label}>University email</Text>
          <View style={[s.inputWrap, emailError && s.inputWrapError]}>
            <Text style={s.inputIcon}>@</Text>
            <TextInput
              style={s.input}
              placeholder="name@uni.edu"
              placeholderTextColor={c.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {emailError ? <Text style={s.errorText}>{emailError}</Text> : null}

          <View style={s.noteBox}>
            <Text style={s.noteIcon}>✓</Text>
            <Text style={s.noteText}>The code is sent only to your registered university email.</Text>
          </View>

          <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={handleContinue}>
            <Text style={s.primaryBtnText}>Send code</Text>
          </Pressable>
        </View>

        <View style={s.footerRow}>
          <Text style={s.footerText}>Remember your password?</Text>
          <Pressable onPress={() => navigation.navigate('login')}>
            <Text style={s.footerLink}> Sign in</Text>
          </Pressable>
        </View>

        <Text style={s.security}>🔒 Your account information is protected</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    backRow: { marginBottom: 18 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 22, height: 110 },
    iconBlob: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: c.primarySoft,
    },
    iconBubble: {
      width: 80,
      height: 80,
      borderRadius: 26,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    iconGlyph: { fontSize: 34 },

    heading: { fontSize: 26, fontWeight: '800', color: c.text, textAlign: 'center' },
    subheading: { fontSize: 13, color: c.muted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24, paddingHorizontal: 6 },

    card: { backgroundColor: c.surface, borderRadius: 26, padding: 22, ...shadow },
    label: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 14,
      height: 52,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    inputWrapError: { borderColor: c.red },
    inputIcon: { fontSize: 15, fontWeight: '800', color: c.primary, width: 22, textAlign: 'center' },
    input: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 },
    errorText: { fontSize: 11, color: c.red, marginTop: 6, marginLeft: 4, fontWeight: '600' },

    noteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.mintSoft,
      borderRadius: 16,
      padding: 12,
      marginTop: 16,
    },
    noteIcon: { fontSize: 14, fontWeight: '800', color: c.mint, marginRight: 8 },
    noteText: { flex: 1, fontSize: 11, color: c.text, lineHeight: 16 },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },

    security: { fontSize: 11, color: c.muted, textAlign: 'center', marginTop: 24 },
  });