import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Card = ({
  icon = 'ℹ️',
  title,
  message,
  type = 'info',
  containerStyle,
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
        return '#FFEBEE';
      case 'warning':
        return '#FFF3E0';
      default:
        return '#F0ECFF';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return '#2E7D32';
      case 'error':
        return '#C62828';
      case 'warning':
        return '#E65100';
      default:
        return '#4A3282';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return '#558B2F';
      case 'error':
        return '#EF5350';
      case 'warning':
        return '#FF6F00';
      default:
        return '#766B91';
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
        containerStyle,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>

      <View style={styles.content}>
        <Text style={[styles.title, { color: getTitleColor() }]}>
          {title}
        </Text>

        {message && (
          <Text style={[styles.message, { color: getTextColor() }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },

  icon: {
    fontSize: 18,
    marginRight: 10,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },

  message: {
    fontSize: 10,
    lineHeight: 16,
  },
});