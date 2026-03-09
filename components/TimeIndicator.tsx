import { Droplets, Leaf, LucideIcon, Sprout, Wheat } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type TimeIndicatorType = 'bloom' | 'growth';

export interface TimeStatus {
  label: string;
  icon: LucideIcon;
  color: string;
}

interface TimeIndicatorProps {
  type: TimeIndicatorType;
  createdAt?: Date;
  dueDate?: Date;
  size?: number;
  viewMode?: 'list' | 'grid';
}

export const getBloomStatus = (createdAt: Date): TimeStatus => {
  const now = new Date();
  const hoursElapsed = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  
  if (hoursElapsed <= 24) {
    return { label: 'just planted', icon: Sprout, color: '#4CAF50' };
  } else if (hoursElapsed <= 168) {
    return { label: 'Flourishing', icon: Leaf, color: '#2196F3' };
  } else {
    return { label: 'needs nurturing', icon: Droplets, color: '#FFB300' };
  }
};

// ZAKTUALIZOWANA FUNKCJA OBLICZAJĄCA STATUS DLA ZADAŃ
export const getGrowthStatus = (dueDate: Date): TimeStatus => {
  const now = new Date();
  const due = new Date(dueDate);
  
  // Normalizowanie dat do północy, aby porównywać tylko dni
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue`, icon: Droplets, color: '#F44336' };
  }
  if (diffDays === 0) {
    return { label: 'Today', icon: Droplets, color: '#FF9800' }; // Pomarańczowy
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', icon: Wheat, color: '#FFB300' };
  }
  if (diffDays <= 7) {
    const dayOfWeek = due.toLocaleDateString('en-US', { weekday: 'long' });
    return { label: `on ${dayOfWeek}`, icon: Leaf, color: '#4CAF50' };
  } else {
    const formattedDate = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label: `on ${formattedDate}`, icon: Leaf, color: '#757575' }; // Szary
  }
};

const TimeIndicator: React.FC<TimeIndicatorProps> = ({ 
  type, 
  createdAt, 
  dueDate,
  size = 14,
  viewMode = 'list'
}) => {
  let status: TimeStatus | null = null;
  
  if (type === 'bloom' && createdAt) {
    status = getBloomStatus(createdAt);
  } else if (type === 'growth' && dueDate) {
    status = getGrowthStatus(dueDate);
  }

  if (!status) {
    return null;
  }
  
  const Icon = status.icon;
  
  // Renderowanie specjalnego efektu podwójnej kropli dla stanów "Overdue" i "Today"
  const renderDoubleDroplet = (status.label === 'Overdue' || status.label === 'Today');

  if (viewMode === 'grid') {
    return (
      <View style={[styles.badgeContainer, { backgroundColor: status.color + '1A' }]}>
        <Icon size={14} color={status.color} />
        <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Icon size={size} color={status.color} />
      {renderDoubleDroplet && (
         <View style={styles.doubleDrop}>
            <Droplets size={size} color={status.color} style={styles.secondDrop} />
         </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  doubleDrop: {
    marginLeft: -4,
  },
  secondDrop: {
    opacity: 0.7,
  }
});

export default TimeIndicator;