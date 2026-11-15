import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { MENU } from '../navigation/menu';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(300, SCREEN_W * 0.8);

const ROLE_LABEL = {
  registrar: 'REGISTRAR',
  hod: 'HOD',
  faculty: 'FACULTY',
};

// Simple drawer with no animation. It is only rendered while open.
const DrawerMenu = ({ session, activeKey, onSelect, onClose, onLogout }) => {
  const items = MENU.filter((item) => item.roles.includes(session.role));
  const initial = session.name.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      {/* Dark area behind the drawer. Tapping it closes the drawer. */}
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.panel}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{session.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>
              {ROLE_LABEL[session.role] || session.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <Pressable
                key={item.key}
                onPress={() => onSelect(item)}
                style={[styles.item, active && styles.itemActive]}
              >
                {active && <View style={styles.activeBar} />}
                <Text style={[styles.glyph, active && styles.glyphActive]}>
                  {item.glyph}
                </Text>
                <Text style={[styles.label, active && styles.labelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable onPress={onLogout} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default DrawerMenu;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_W,
    backgroundColor: '#0E1626',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 18,
    borderRightWidth: 1,
    borderColor: '#1C2A47',
  },

  profile: {
    marginBottom: 22,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7C6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#060A14',
    fontSize: 20,
    fontWeight: '800',
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(79,124,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(143,168,255,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A9B6FF',
    letterSpacing: 1,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
  },

  itemActive: {
    backgroundColor: 'rgba(79,124,255,0.18)',
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#4F7CFF',
  },

  glyph: {
    width: 26,
    textAlign: 'center',
    fontSize: 16,
    color: '#7D8AA6',
    marginRight: 10,
  },

  glyphActive: {
    color: '#8FA8FF',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9D2EA',
  },

  labelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  logout: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.4)',
    alignItems: 'center',
  },

  logoutText: {
    color: '#FF5C7A',
    fontSize: 14,
    fontWeight: '800',
  },
});