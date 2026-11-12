import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
} from 'react-native';
import Button from '../components/Button';
import AppLogo from '../components/AppLogo';

const FEATURES = [
  {
    title: 'AI timetables',
    detail: 'Generate conflict-free schedules in minutes',
    color: '#6C3BFF',
  },
  {
    title: 'Clash detection',
    detail: 'Catch teacher, room and section overlaps early',
    color: '#FF5C7A',
  },
  {
    title: 'Availability tracking',
    detail: 'Faculty set their free slots once, and everyone sees them',
    color: '#2BD39A',
  },
];

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6FF" />

      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <AppLogo size="large" />
          </View>

          <Text style={styles.brand}>
            SmartSched <Text style={styles.brandAi}>AI</Text>
          </Text>

          <Text style={styles.title}>Smart scheduling for your university</Text>

          <Text style={styles.subtitle}>
            Timetables, faculty availability and clash detection, all in one place.
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={[styles.featureDot, { backgroundColor: feature.color }]} />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDetail}>{feature.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            text="Get Started"
            onPress={() => navigation.navigate('signup')}
            style={styles.primaryButton}
          />

          <Pressable
            style={styles.secondaryWrap}
            onPress={() => navigation.navigate('login')}
          >
            <Text style={styles.secondaryText}>
              I already have an account{' '}
              <Text style={styles.secondaryLink}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;

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
  },

  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: '#24104F',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  brandAi: {
    color: '#6C3BFF',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#24104F',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 14,
  },

  subtitle: {
    fontSize: 14,
    color: '#77718A',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 26,
  },

  featureList: {
    marginBottom: 26,
  },

  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0EF',
    padding: 14,
    marginBottom: 10,
  },

  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#24104F',
  },

  featureDetail: {
    fontSize: 12,
    color: '#77718A',
    marginTop: 2,
    lineHeight: 17,
  },

  primaryButton: {
    marginBottom: 18,
  },

  secondaryWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },

  secondaryText: {
    fontSize: 13,
    color: '#77718A',
  },

  secondaryLink: {
    fontWeight: '800',
    color: '#6C3BFF',
  },
});