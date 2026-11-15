import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Pressable,
} from 'react-native';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const STATUS = {
  confirmed: { label: 'Confirmed', color: '#16A774', bg: '#E3F7EE' },
  pending: { label: 'Pending', color: '#E08A1E', bg: '#FFF3E0' },
  clash: { label: 'Clash', color: '#E5405F', bg: '#FFE8EE' },
};

const ROLE_SUBTITLE = {
  registrar: 'All departments',
  hod: 'Your department',
  faculty: 'Your classes',
};

// SAMPLE DATA: replace with database values once the backend is connected
const CLASSES = {
  Mon: [
    { id: 'm1', time: '09:00 – 10:00', course: 'Data Structures', section: 'CS-2B', room: 'A-101', teacher: 'Ms. Sara', status: 'confirmed' },
    { id: 'm2', time: '10:00 – 11:00', course: 'Database Systems', section: 'CS-3A', room: 'B-204', teacher: 'Dr. Ahmed', status: 'clash' },
    { id: 'm3', time: '13:00 – 14:30', course: 'Software Engineering', section: 'CS-4A', room: 'C-110', teacher: 'Mr. Usman', status: 'confirmed' },
  ],
  Tue: [
    { id: 't1', time: '08:00 – 09:30', course: 'Operating Systems', section: 'CS-3A', room: 'Lab 2', teacher: 'Dr. Ahmed', status: 'confirmed' },
    { id: 't2', time: '11:00 – 12:00', course: 'Computer Networks', section: 'CS-4A', room: 'A-102', teacher: 'Ms. Sara', status: 'pending' },
  ],
  Wed: [
    { id: 'w1', time: '09:00 – 10:00', course: 'Data Structures', section: 'CS-2B', room: 'A-101', teacher: 'Ms. Sara', status: 'confirmed' },
    { id: 'w2', time: '14:00 – 15:00', course: 'Discrete Math', section: 'CS-2B', room: 'B-201', teacher: 'Mr. Usman', status: 'clash' },
  ],
  Thu: [
    { id: 'th1', time: '10:00 – 12:00', course: 'Lab: Operating Systems', section: 'CS-3A', room: 'Lab 2', teacher: 'Dr. Ahmed', status: 'confirmed' },
  ],
  Fri: [],
};

const TimetableScreen = ({ navigation, route }) => {
  const role = route?.params?.role || 'hod';
  const [selectedDay, setSelectedDay] = useState('Mon');

  const classes = CLASSES[selectedDay] || [];
  const clashCount = classes.filter((c) => c.status === 'clash').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6FF" />

      <View style={styles.circleTop} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.navigate('dashboard', route?.params)}
          >
            <Text style={styles.backText}>← Dashboard</Text>
          </Pressable>
          <Text style={styles.title}>Timetable</Text>
          <Text style={styles.subtitle}>{ROLE_SUBTITLE[role] || ROLE_SUBTITLE.hod}</Text>
        </View>

        {/* DAY TABS */}
        <View style={styles.dayRow}>
          {DAYS.map((day) => {
            const active = day === selectedDay;
            return (
              <Pressable
                key={day}
                style={[styles.dayTab, active && styles.dayTabActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{classes.length}</Text>
            <Text style={styles.summaryLabel}>Classes</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, clashCount > 0 && { color: STATUS.clash.color }]}>
              {clashCount}
            </Text>
            <Text style={styles.summaryLabel}>Clashes</Text>
          </View>
        </View>

        {/* CLASS LIST */}
        {classes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No classes on {selectedDay}</Text>
            <Text style={styles.emptyText}>Enjoy the free day.</Text>
          </View>
        ) : (
          classes.map((item) => {
            const st = STATUS[item.status];
            return (
              <View key={item.id} style={styles.card}>
                <View style={[styles.cardBar, { backgroundColor: st.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.time}>{item.time}</Text>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.course}>{item.course}</Text>
                  <Text style={styles.meta}>
                    {item.section}  ·  Room {item.room}  ·  {item.teacher}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.demoNote}>Sample data · connect the database to show live timetables</Text>
      </ScrollView>
    </View>
  );
};

export default TimetableScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FF',
    overflow: 'hidden',
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

  scroll: {
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },

  backText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BFF',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#24104F',
  },

  subtitle: {
    fontSize: 13,
    color: '#77718A',
    marginTop: 4,
  },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  dayTab: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0EF',
    alignItems: 'center',
  },

  dayTabActive: {
    backgroundColor: '#6C3BFF',
    borderColor: '#6C3BFF',
  },

  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#77718A',
  },

  dayTextActive: {
    color: '#FFFFFF',
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E0EF',
    paddingVertical: 14,
    marginBottom: 18,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E0EF',
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#24104F',
  },

  summaryLabel: {
    fontSize: 11,
    color: '#77718A',
    marginTop: 2,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E0EF',
    overflow: 'hidden',
    marginBottom: 12,
  },

  cardBar: {
    width: 5,
  },

  cardBody: {
    flex: 1,
    padding: 14,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  time: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C3BFF',
  },

  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  course: {
    fontSize: 15,
    fontWeight: '800',
    color: '#24104F',
    marginTop: 6,
  },

  meta: {
    fontSize: 12,
    color: '#77718A',
    marginTop: 4,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#24104F',
  },

  emptyText: {
    fontSize: 12,
    color: '#77718A',
    marginTop: 4,
  },

  demoNote: {
    fontSize: 10,
    color: '#A09AAE',
    textAlign: 'center',
    marginTop: 16,
  },
});