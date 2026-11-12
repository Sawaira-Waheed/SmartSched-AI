import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

const SplashScreen = ({ navigation }) => {
 useEffect(() => {
  const timer = setTimeout(() => {
    navigation?.navigate('login');
  }, 3000);

  return () => clearTimeout(timer);
}, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F6FF"
      />

      <Text style={styles.logo}>S</Text>
      <Text style={styles.appName}>SmartSched AI</Text>
      <Text style={styles.tagline}>Intelligent AI & Scheduling System</Text>
      
      <ActivityIndicator 
        size="small" 
        color="#6C3BFF"
        style={{ marginTop: 50 }}
      />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logo: {
    fontSize: 60,
    fontWeight: '800',
    color: '#6C3BFF',
    marginBottom: 15,
  },
  
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#24104F',
  },
  
  tagline: {
    fontSize: 13,
    color: '#77718A',
    marginTop: 10,
  },
  
  loadingText: {
    marginTop: 15,
    fontSize: 12,
    color: '#77718A',
  },
});