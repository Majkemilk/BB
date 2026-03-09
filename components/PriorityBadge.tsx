import { Clock, Coffee, Flame, Star } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PriorityBadgeProps {
  priority: 'Key Plant' | 'Must-do' | 'Could-do' | 'Later';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getPriorityDetails = () => {
    switch (priority) {
      case 'Key Plant':
        return {
          label: 'Key Plant',
          icon: <Flame size={12} color="#FF5252" />,
          style: styles.keyPlantBadge,
          textStyle: styles.keyPlantText,
        };
      case 'Must-do':
        return {
          label: 'Must-do',
          icon: <Star size={12} color="#FF5252" />,
          style: styles.priorityHigh,
          textStyle: styles.priorityTextHigh,
        };
      case 'Could-do':
        return {
          label: 'Could-do',
          icon: <Clock size={12} color="#FFD740" />,
          style: styles.priorityMedium,
          textStyle: styles.priorityTextMedium,
        };
      case 'Later':
        return {
          label: 'Later',
          icon: <Coffee size={12} color="#448AFF" />,
          style: styles.priorityLow,
          textStyle: styles.priorityTextLow,
        };
      default:
        return null;
    }
  };

  const details = getPriorityDetails();

  if (!details) {
    return null;
  }

  return (
    <View style={[styles.badge, details.style]}>
      {details.icon}
      <Text style={[styles.badgeText, details.textStyle]}>{details.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  keyPlantBadge: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: '#FF5252',
  },
  keyPlantText: {
    color: '#FF5252',
  },
  priorityHigh: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: '#FF5252',
  },
  priorityTextHigh: {
    color: '#FF5252',
  },
  priorityMedium: {
    backgroundColor: 'rgba(255, 215, 64, 0.12)',
    borderColor: '#FFD740',
  },
  priorityTextMedium: {
    color: '#FFD740',
  },
  priorityLow: {
    backgroundColor: 'rgba(68, 138, 255, 0.12)',
    borderColor: '#448AFF',
  },
  priorityTextLow: {
    color: '#448AFF',
  },
});