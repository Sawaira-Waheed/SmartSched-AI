import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../theme/theme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

const OtpScreen = ({ navigation, route }) => {
  const { c, shadow } = useTheme();
  const s = useMemo(() => makeStyles(c, shadow), [c, shadow]);

  const email = route?.params?.email || 'your university email';
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  // Countdown for "resend code"
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const error = !submitted
    ? ''
    : !code
      ? 'Enter the 6-digit code'
      : code.length !== CODE_LENGTH
        ? 'The code must be 6 digits'
        : '';

  const handleVerify = () => {
    setSubmitted(true);
    if (code.length !== CODE_LENGTH) return;
    // TODO: verify the code with the backend
    navigation.navigate('resetpassword', { email });
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setCode('');
    setSubmitted(false);
    setSecondsLeft(RESEND_SECONDS);
    // TODO: request a new code from the backend
  };

  const onChange = (text) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
    setSubmitted(false);
  };

  // Show the code as six boxes, filled left to right
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] || '');
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('forgotpassword')} style={s.backRow}>
          <Text style={s.backText}>← Change email</Text>
        </Pressable>

        <View style={s.iconWrap}>
          <View style={s.iconBlob} />
          <View style={s.iconBubble}>
            <Text style={s.iconGlyph}>✉</Text>
          </View>
        </View>

        <Text style={s.heading}>Check your email</Text>
        <Text style={s.subheading}>
          We sent a 6-digit code to{'\n'}
          <Text style={s.emailHighlight}>{email}</Text>
        </Text>

        <View style={s.card}>
          <Text style={s.label}>Verification code</Text>

          {/* Tapping the boxes focuses the hidden input */}
          <Pressable style={s.boxRow} onPress={() => inputRef.current?.focus()}>
            {digits.map((d, i) => {
              const filled = i < code.length;
              const focused = i === activeIndex && code.length < CODE_LENGTH;
              return (
                <View
                  key={i}
                  style={[
                    s.box,
                    filled && s.boxFilled,
                    focused && s.boxFocused,
                    error && s.boxError,
                  ]}
                >
                  <Text style={[s.boxText, filled && s.boxTextFilled]}>{d}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            style={s.hiddenInput}
            autoFocus
          />

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={handleVerify}>
            <Text style={s.primaryBtnText}>Verify code</Text>
          </Pressable>

          <View style={s.resendRow}>
            {secondsLeft > 0 ? (
              <Text style={s.resendText}>
                Resend code in <Text style={s.resendTimer}>{String(secondsLeft).padStart(2, '0')}s</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={8}>
                <Text style={s.resendText}>
                  Didn't get it? <Text style={s.resendLink}>Resend code</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={s.tipBox}>
          <Text style={s.tipText}>Check your spam or junk folder if the email doesn't arrive.</Text>
        </View>

        <View style={s.footerRow}>
          <Text style={s.footerText}>Back to</Text>
          <Pressable onPress={() => navigation.navigate('login')}>
            <Text style={s.footerLink}> Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const makeStyles = (c, shadow) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scroll: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 40 },
    pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

    backRow: { marginBottom: 18 },
    backText: { fontSize: 13, fontWeight: '800', color: c.primary },

    iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 22, height: 110 },
    iconBlob: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: c.skySoft },
    iconBubble: {
      width: 80,
      height: 80,
      borderRadius: 26,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    iconGlyph: { fontSize: 34, color: c.sky, fontWeight: '800' },

    heading: { fontSize: 26, fontWeight: '800', color: c.text, textAlign: 'center' },
    subheading: { fontSize: 13, color: c.muted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 24 },
    emailHighlight: { fontWeight: '800', color: c.primary },

    card: { backgroundColor: c.surface, borderRadius: 26, padding: 22, ...shadow },
    label: { fontSize: 12, fontWeight: '800', color: c.primary, marginBottom: 14, textAlign: 'center' },

    boxRow: { flexDirection: 'row', justifyContent: 'space-between' },
    box: {
      width: 46,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1.5,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxFilled: { backgroundColor: c.primarySoft, borderColor: c.primary },
    boxFocused: { borderColor: c.primary },
    boxError: { borderColor: c.red },
    boxText: { fontSize: 22, fontWeight: '800', color: c.muted },
    boxTextFilled: { color: c.primary },

    hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
    errorText: { fontSize: 11, color: c.red, marginTop: 10, textAlign: 'center', fontWeight: '600' },

    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 22,
      ...shadow,
    },
    primaryBtnText: { color: c.white, fontSize: 15, fontWeight: '800' },

    resendRow: { alignItems: 'center', marginTop: 16 },
    resendText: { fontSize: 12, color: c.muted },
    resendTimer: { fontWeight: '800', color: c.primary },
    resendLink: { fontWeight: '800', color: c.primary },

    tipBox: { backgroundColor: c.amberSoft, borderRadius: 16, padding: 14, marginTop: 16 },
    tipText: { fontSize: 11, color: c.text, lineHeight: 17, textAlign: 'center' },

    footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
    footerText: { fontSize: 13, color: c.muted },
    footerLink: { fontSize: 13, fontWeight: '800', color: c.primary },
  });