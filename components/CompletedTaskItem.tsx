import { cancelTaskNotifications } from '@/utils/notifications';
import * as Haptics from 'expo-haptics';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';
import { CircleCheck as CheckCircle, ChevronUp, Filter, Flame, LayoutGrid, MoreHorizontal, RotateCcw, Star, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CompletedTaskItemProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    context?: string;
    plot?: string;
    isMIT: boolean;
    completedAt?: Date;
  };
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const CompletedTaskItem = ({ task, onRestore, onDelete, selectMode = false, selected = false, onSelect }: CompletedTaskItemProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleDelete = async () => {
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Task Permanently",
      "Are you sure you want to permanently delete this completed task? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              await cancelTaskNotifications(task.id);
              await onDelete(task.id);
              // Success feedback
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Success', '🌿 Your Plant has been permanently cleared! Your garden is ready for new growth!');
            } catch (error) {
              console.error('Error in handleDelete:', error);
              Alert.alert('Error', 'Failed to delete your task. Please try again.');
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };
  
  const handleRestore = () => {
    // Haptic feedback for restore action
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRestore(task.id);
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const renderPriorityBadge = () => {
    if (task.isMIT) {
        return (
            <View style={[styles.badge, styles.keyPlantBadge]}>
                <Flame size={12} color="#B71C1C" />
                <Text style={[styles.badgeText, styles.keyPlantText]}>Key Plant</Text>
            </View>
        );
    }
    
    if (task.priority === 'Later') return null;

    let icon, color;
    switch (task.priority) {
      case 'Must-do':
        icon = <Star size={12} color="#D32F2F" />;
        color = '#D32F2F';
        break;
      case 'Could-do':
        icon = <Star size={12} color="#F57C00" />;
        color = '#F57C00';
        break;
      default:
        return null;
    }
    return (
        <View style={styles.badge}>
            {icon}
            <Text style={[styles.badgeText, { color }]}>{task.priority}</Text>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        {selectMode && (
          <TouchableOpacity onPress={onSelect} style={{ marginRight: 12 }}>
            <View style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: selected ? '#4CAF50' : '#CCC', alignItems: 'center', justifyContent: 'center',
              backgroundColor: selected ? '#4CAF50' : '#FFF'
            }}>
              {selected && <CheckCircle size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.iconContainer}>
          <CheckCircle size={22} color="#A5D6A7" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{task.title}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.completedDate}>
              Completed: {formatDate(task.completedAt)}
            </Text>
          </View>

          {expanded && (
            <View style={styles.metaRow}>
              {renderPriorityBadge()}
              {task.context && (
                <View style={styles.badge}>
                  <Filter size={12} color="#757575" />
                  <Text style={styles.badgeText}>{task.context}</Text>
                </View>
              )}
              {task.plot && (
                <View style={styles.badge}>
                  <LayoutGrid size={12} color="#757575" />
                  <Text style={styles.badgeText}>{task.plot}</Text>
                </View>
              )}
            </View>
          )}
          
          {expanded && task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
          {expanded ? <ChevronUp size={18} color="#BDBDBD" /> : <MoreHorizontal size={18} color="#BDBDBD" />}
        </TouchableOpacity>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.restoreButton]} 
            onPress={handleRestore}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#4CAF50" />
            <Text style={styles.actionText}>Restore</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#FF5252" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    // backgroundColor: 'yellow', // DEBUG
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    // textDecorationLine: 'line-through', // <-- USUNIĘTA WŁAŚCIWOŚĆ
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  completedDate: {
    fontSize: 12,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginTop: 4,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  keyPlantBadge: {
    backgroundColor: '#FFEBEE',
  },
  keyPlantText: {
    color: '#B71C1C',
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  expandButton: {
    paddingLeft: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingVertical: 4,
    paddingHorizontal: 16,
    paddingRight: 24,
    justifyContent: 'flex-end',
    flex: 1,
    // backgroundColor: 'blue', // DEBUG
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  restoreButton: {
    borderColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    padding: 6,
    marginLeft: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});