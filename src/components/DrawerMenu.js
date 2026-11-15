import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MENU } from '../navigation/menu';
import { useTheme } from '../theme/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(304, SCREEN_W * 0.82);

const ROLE_LABEL = {
  registrar: 'REGISTRAR',
  hod: 'HOD',
  faculty: 'FACULTY',
};

// Each menu item gets one of these accent colors, in order.
const ACCENTS = ['primary', 'pink', 'mint', 'sky', 'amber'];

// Rendered only while open. The parent unmounts it when closed.
const DrawerMenu = ({ session, activeKey, onSelect, onClose, onLogout }) => {
  const { c } = useTheme();
  const styles = makeStyles(c);

  const items = MENU.filter((item) => item.roles.includes(session.role));
  const initial = session.name.charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
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
          {items.map((item, index) => {
            const active = item.key === activeKey;
            const accent = ACCENTS[index % ACCENTS.length];
            const bubbleColor = active ? 'rgba(255,255,255,0.25)' : c[`${accent}Soft`];
            const glyphColor = active ? c.white : c[accent];

            return (
              <Pressable
                key={item.key}
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.item,
                  active && styles.itemActive,
                  pressed && styles.itemPressed,
                ]}
              >
                <View style={[styles.iconBubble, { backgroundColor: bubbleColor }]}>
                  <Text style={[styles.glyph, { color: glyphColor }]}>{item.glyph}</Text>
                </View>
                <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
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

const makeStyles = (c) =>
  StyleSheet.create({
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
      backgroundColor: c.overlay,
    },

    panel: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: PANEL_W,
      backgroundColor: c.surface,
      paddingTop: 56,
      paddingBottom: 28,
      paddingHorizontal: 16,
      borderTopRightRadius: 28,
      borderBottomRightRadius: 28,
    },

    profile: {
      backgroundColor: c.primary,
      borderRadius: 22,
      padding: 16,
      marginBottom: 18,
    },

    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: c.white,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: c.primary,
      fontSize: 22,
      fontWeight: '800',
    },

    userName: {
      color: c.white,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 12,
    },

    rolePill: {
      alignSelf: 'flex-start',
      marginTop: 8,
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    roleText: {
      fontSize: 10,
      fontWeight: '800',
      color: c.white,
      letterSpacing: 1,
    },

    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: 16,
      marginBottom: 6,
    },

    itemActive: {
      backgroundColor: c.primary,
    },

    itemPressed: {
      opacity: 0.85,
    },

    iconBubble: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    glyph: {
      fontSize: 16,
      fontWeight: '800',
    },

    label: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },

    labelActive: {
      color: c.white,
      fontWeight: '800',
    },

    logout: {
      marginTop: 10,
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: c.redSoft,
      alignItems: 'center',
    },

    logoutText: {
      color: c.red,
      fontSize: 14,
      fontWeight: '800',
    },
  });