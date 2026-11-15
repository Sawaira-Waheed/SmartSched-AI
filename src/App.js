import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import OtpScreen from './screens/OtpScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import TimetableScreen from './screens/TimetableScreen';
import FacultyScreen from './screens/FacultyScreen';
import ComingSoonScreen from './screens/ComingSoonScreen';
import AppShell from './components/AppShell';
import DrawerMenu from './components/DrawerMenu';
import { MENU } from './navigation/menu';
import { ThemeProvider, useTheme } from './theme/theme';

// Screens shown before login. No top bar or drawer.
const AUTH_SCREENS = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  login: LoginScreen,
  signup: SignUpScreen,
  forgotpassword: ForgotPasswordScreen,
  otpverification: OtpScreen,
  resetpassword: ResetPasswordScreen,
};

// Creates a placeholder screen with its own title.
const comingSoon = (title) => {
  const Screen = (props) => <ComingSoonScreen {...props} title={title} />;
  return Screen;
};

// Screens shown after login. Each key matches a key in navigation/menu.js.
const APP_SCREENS = {
  dashboard: DashboardScreen,
  timetable: TimetableScreen,
  faculty: FacultyScreen,
  availability: comingSoon('Availability'),
  courses: comingSoon('Courses'),
  sections: comingSoon('Sections'),
  rooms: comingSoon('Rooms'),
  aischeduling: comingSoon('AI Scheduling'),
  conflicts: comingSoon('Conflicts'),
  notifications: comingSoon('Notifications'),
  reports: comingSoon('Reports'),
  audit: comingSoon('Audit Logs'),
  profile: comingSoon('Profile'),
  settings: comingSoon('Settings'),
};

// Reads the theme, so it must render inside ThemeProvider.
function Root({ current, activeSession, drawerOpen, navigation, onToggleMode }) {
  const { c } = useTheme();

  const AuthScreen = AUTH_SCREENS[current.name];
  if (AuthScreen) {
    return <AuthScreen navigation={navigation} route={{ params: current.params }} />;
  }

  const AppScreen = APP_SCREENS[current.name];
  if (!AppScreen) {
    return (
      <View style={[styles.fallback, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.text }}>Unknown Screen: {current.name}</Text>
      </View>
    );
  }

  const menuItem = MENU.find((item) => item.key === current.name);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <AppShell
        title={menuItem?.label || 'SmartSched AI'}
        onMenu={navigation.openDrawer}
        onHome={() => navigation.navigate('dashboard', activeSession)}
        showHome={current.name !== 'dashboard'}
        onToggleMode={onToggleMode}
      >
        <AppScreen navigation={navigation} route={{ params: current.params }} />
      </AppShell>

      {drawerOpen && (
        <DrawerMenu
          session={activeSession}
          activeKey={current.name}
          onSelect={(item) => navigation.navigate(item.key, activeSession)}
          onClose={navigation.closeDrawer}
          onLogout={navigation.logout}
        />
      )}
    </View>
  );
}

export default function App() {
  const [current, setCurrent] = useState({ name: 'splash', params: undefined });
  const [session, setSession] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState('light');

  const navigation = useMemo(() => {
    const go = (name, params) => {
      if (params?.role) {
        setSession({ role: params.role, name: params.name || 'User' });
      }
      setDrawerOpen(false);
      setCurrent({ name: String(name).toLowerCase(), params });
    };

    return {
      navigate: go,
      replace: go,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      logout: () => {
        setSession(null);
        setDrawerOpen(false);
        setCurrent({ name: 'login', params: undefined });
      },
    };
  }, []);

  const activeSession = session || { role: 'hod', name: 'User' };
  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <SafeAreaProvider>
      <ThemeProvider mode={mode}>
        <Root
          current={current}
          activeSession={activeSession}
          drawerOpen={drawerOpen}
          navigation={navigation}
          onToggleMode={toggleMode}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});