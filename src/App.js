import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import OtpScreen from './screens/OtpScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';

// Screen names lowercase mein map hain, taake 'Login' aur 'login' dono chalein
const SCREENS = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  login: LoginScreen,
  signup: SignUpScreen,
  forgotpassword: ForgotPasswordScreen,
  otpverification: OtpScreen,
  resetpassword: ResetPasswordScreen,
  dashboard: DashboardScreen,
};

export default function App() {
  const [current, setCurrent] = useState({ name: 'splash', params: undefined });

  // navigation object stable rakhne ke liye useMemo
  const navigation = useMemo(() => {
    const go = (name, params) => {
      setCurrent({ name: String(name).toLowerCase(), params });
    };
    return { navigate: go, replace: go };
  }, []);

  const Screen = SCREENS[current.name];

  if (!Screen) {
    return (
      <View style={styles.fallback}>
        <Text>Unknown Screen: {current.name}</Text>
      </View>
    );
  }

  return <Screen navigation={navigation} route={{ params: current.params }} />;
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});