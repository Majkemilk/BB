import { useTasks } from '@/contexts/TaskContext';
import { cancelTaskNotifications } from '@/utils/notifications';
import * as Haptics from 'expo-haptics';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';
import { Check, ChevronUp, Clock, Coffee, Flame, GitMerge, MoreHorizontal, Pencil, Repeat, Star, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { getGrowthStatus } from './TimeIndicator'; // Importujemy nową funkcję

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const TaskItem = ({ task, onToggleComplete, onToggleMIT, onDelete, onEdit, onPriorityChange, updateTask }: any) => {
  const { handleCompletionReward, toggleBranchComplete, deleteRecurringTask } = useTasks();
  const [expanded, setExpanded] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleDelete = async () => {
    // Haptic feedback for destructive action
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const isRecurring = !!task.recurrence || !!task.parentTaskId || !!task.isRecurringTemplate;
    if (isRecurring) {
      Alert.alert(
        'Delete Recurring Task',
        'Do you want to delete only this plant, or this and all future plants in the series?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete only this plant',
            onPress: async () => {
              await deleteRecurringTask(task.id, 'single');
            },
            style: 'destructive',
          },
          {
            text: 'Delete this and all future plants',
            onPress: async () => {
              await deleteRecurringTask(task.id, 'all');
            },
            style: 'destructive',
          },
        ]
      );
    } else {
      if (Platform.OS === 'web') {
        if (window.confirm('Are you sure you want to delete this task?')) {
          try {
            await cancelTaskNotifications(task.id);
          } catch (error) {
            console.error('Failed to cancel notifications:', error);
          }
          onDelete(task.id);
        }
      } else {
        Alert.alert(
          'Delete Task Permanently',
          'Are you sure you want to permanently delete this task? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              onPress: async () => {
                try {
                  await cancelTaskNotifications(task.id);
                } catch (error) {
                  console.error('Failed to cancel notifications:', error);
                }
                onDelete(task.id);
              },
              style: 'destructive',
            },
          ]
        );
      }
    }
  };

  const handleCompletePress = async () => {
    if (task.isCompleted) return;
    setJustCompleted(true);
    setTimeout(async () => {
      // Cancel notifications for this task
      try {
        await cancelTaskNotifications(task.id);
      } catch (error) {
        console.error('Failed to cancel notifications:', error);
      }
      
    onToggleComplete(task.id);
      setJustCompleted(false);
      
      // Check for seed reward
      const reward = await handleCompletionReward(task);
      if (reward) {
        console.log('Reward:', reward);
        // TODO: Show reward modal here
      }
    }, 400);
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const isOverdue = !task.isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

  const handlePriorityClick = () => {
    const priorities = ['Must-do', 'Could-do', 'Later'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onPriorityChange(task.id, priorities[nextIndex]);
  };

  // Pobieramy aktualny status wzrostu (zawiera etykietę, ikonę i kolor)
  const growthStatus = task.dueDate ? getGrowthStatus(new Date(task.dueDate)) : null;
  const StatusIcon = growthStatus?.icon;

  return (
    <View style={[styles.container, isOverdue && styles.overdueContainer]}>
      <TouchableOpacity
        style={styles.contentContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleCompletePress}
        >
          <View style={[ styles.checkbox, (task.isCompleted || justCompleted) && styles.checkboxChecked ]}>
            {(task.isCompleted || justCompleted) && <Check size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[ styles.title, task.isCompleted && styles.titleCompleted ]}>
              {task.title}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {task.isMIT && (
              <View style={[styles.keyPlantBadge]}>
                <Flame size={12} color="#FF5252" />
                <Text style={styles.keyPlantText}>Key Plant</Text>
              </View>
            )}

            {task.priority && !task.isMIT && (
              <TouchableOpacity
                onPress={handlePriorityClick}
                style={[styles.priorityBadge, 
                  task.priority === 'Must-do' && styles.priorityHigh,
                  task.priority === 'Could-do' && styles.priorityMedium,
                  task.priority === 'Later' && styles.priorityLow
                ]}>
                {task.priority === 'Must-do' && <Star size={14} color="#FF5252" />}
                {task.priority === 'Could-do' && <Clock size={14} color="#FFD740" />}
                {task.priority === 'Later' && <Coffee size={14} color="#448AFF" />}
                <Text style={[
                  styles.priorityText,
                  task.priority === 'Must-do' && styles.priorityTextHigh,
                  task.priority === 'Could-do' && styles.priorityTextMedium,
                  task.priority === 'Later' && styles.priorityTextLow
                ]}>
                  {task.priority}
                </Text>
              </TouchableOpacity>
            )}

            {task.context && (
              <View style={styles.contextBadge}>
                <Text style={styles.contextText}>{task.context}</Text>
              </View>
            )}

            {task.plot && (
              <View style={styles.plotBadge}>
                <Text style={styles.plotText}>{task.plot}</Text>
              </View>
            )}

            {/* Recurrence Icon and Label */}
            {task.recurrence?.type && (
              <View style={styles.recurrenceBadge}>
                <Repeat size={14} color="#FF9800" style={{ marginRight: 2 }} />
                <Text style={styles.recurrenceText}>
                  {(() => {
                    switch (task.recurrence.type) {
                      case 'daily': return 'daily';
                      case 'weekly': return 'weekly';
                      case 'monthly': return 'monthly';
                      case 'yearly': return 'yearly';
                      default: return '';
                    }
                  })()}
                </Text>
              </View>
            )}
            
            {/* Recurrence None Badge - for all tasks without active recurrence */}
            {(!task.recurrence || task.recurrence === null) && (
              <View style={styles.recurrenceBadgeNone}>
                <Repeat size={14} color="#999999" style={{ marginRight: 2 }} />
                <Text style={styles.recurrenceTextNone}>None</Text>
              </View>
            )}

            {task.branches && task.branches.length > 0 && (
              <View style={styles.branchesProgress}>
                <GitMerge size={14} color="#4CAF50" style={{ marginRight: 4 }} />
                <Text style={styles.branchesProgressText}>
                  {task.branches.filter((b: any) => b.isCompleted).length}/{task.branches.length}
                </Text>
              </View>
            )}
          </View>

          {/* Daty zawsze w osobnej linii pod etykietami */}
          {(task.dueDate || task.startDate) && (
            <View style={styles.datesContainer}>
            {task.dueDate && growthStatus && (
              <View style={styles.dueDateContainer}>
                {StatusIcon && <StatusIcon size={14} color={growthStatus.color} />}
                  <Text style={[styles.dueDate, { color: growthStatus.color, marginLeft: 6 }]}>Due: {growthStatus.label}</Text>
                </View>
              )}
              {task.startDate && (
                <View style={styles.startDateContainer}>
                  <Text style={[styles.startDate, { color: '#4CAF50', marginLeft: 6 }]}>🌱 Start: {formatDate(new Date(task.startDate))}</Text>
              </View>
            )}
          </View>
          )}

          {expanded && task.description && (
            <Text style={styles.description}>{task.description}</Text>
          )}

          {expanded && task.branches && task.branches.length > 0 && (
            <View style={styles.branchesList}>
              {task.branches.map((branch: any) => (
                <View key={branch.id} style={styles.branchRow}>
                  <TouchableOpacity
                    style={styles.branchCheckbox}
                    onPress={() => toggleBranchComplete && toggleBranchComplete(task.id, branch.id)}
                  >
                    <View style={[styles.branchCircle, branch.isCompleted && styles.branchCircleCompleted]}>
                      {branch.isCompleted && <Check size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                  <Text
                    style={[styles.branchText, branch.isCompleted && styles.branchTextCompleted]}
                    numberOfLines={2}
                  >
                    {branch.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpanded}
        >
          {expanded ? <ChevronUp size={18} color="#9E9E9E" /> : <MoreHorizontal size={18} color="#9E9E9E" />}
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.actions}>
            <TouchableOpacity style={styles.replantButton} onPress={() => {
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(task);
            }} activeOpacity={0.7}>
              <Pencil size={16} color="#666" />
              <Text style={styles.replantText}>Tend</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.keyPlantButton,
                task.isMIT && styles.keyPlantButtonActive
              ]} 
              onPress={() => {
                if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleMIT(task.id);
              }}
              activeOpacity={0.7}
            >
              <Flame size={16} color="#FF5252" />
              <Text style={[
                styles.keyPlantButtonText, 
                task.isMIT && styles.keyPlantButtonTextActive
              ]}>
                {task.isMIT ? 'Key Plant' : 'Mark as Key Plant'}
              </Text>
              {task.isMIT && <Check size={16} color="#FF5252" />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
              <Trash2 size={18} color="#FF5252" />
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  overdueContainer: { borderLeftWidth: 4, borderLeftColor: '#F44336' },
  contentContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 },
  checkboxContainer: { marginRight: 16, padding: 4, },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CCCCCC', justifyContent: 'center', alignItems: 'center', },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', },
  textContainer: { flex: 1, },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', flex: 1, },
  titleCompleted: { textDecorationLine: 'line-through', color: '#9E9E9E', },
  keyPlantBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 82, 82, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FF5252', },
  keyPlantText: { fontSize: 12, fontWeight: '600', color: '#FF5252', marginLeft: 6, },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: '#F1F1F1', borderColor: '#EEEEEE', },
  priorityHigh: { backgroundColor: 'rgba(255, 82, 82, 0.12)', borderColor: '#FF5252', },
  priorityMedium: { backgroundColor: 'rgba(255, 215, 64, 0.12)', borderColor: '#FFD740', },
  priorityLow: { backgroundColor: 'rgba(68, 138, 255, 0.12)', borderColor: '#448AFF', },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#666666', },
  priorityTextHigh: { color: '#FF5252', },
  priorityTextMedium: { color: '#FFD740', },
  priorityTextLow: { color: '#448AFF', },
  contextBadge: { backgroundColor: '#F1F1F1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, },
  contextText: { fontSize: 12, color: '#666666', },
  plotBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, },
  plotText: { fontSize: 12, color: '#4CAF50', },
  dueDateContainer: { flexDirection: 'row', alignItems: 'center', },
  dueDate: { fontSize: 12, fontWeight: '500' }, // Usunięcie domyślnego koloru
  overdueDueDate: { color: '#F44336', fontWeight: '500', },
  description: { marginTop: 8, fontSize: 14, color: '#666666', lineHeight: 20, },
  expandButton: { paddingLeft: 12, },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F1F1', paddingVertical: 8, paddingHorizontal: 16, justifyContent: 'flex-end', },
  replantButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  replantText: { 
    marginLeft: 6, 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#666666', 
  },
  keyPlantButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 6, 
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 6,
    marginRight: 8,
    gap: 6,
  },
  keyPlantButtonActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: '#FF5252',
  },
  keyPlantButtonText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#666666', 
  },
  keyPlantButtonTextActive: { 
    color: '#FF5252', 
  },
  deleteButton: { 
    marginLeft: 'auto', 
    padding: 6, 
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPlantBadgeInline: { marginRight: 8, },
  startDateContainer: { flexDirection: 'row', alignItems: 'center' },
  startDate: { fontSize: 12, fontWeight: '500' },
  datesContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  branchesProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  branchesProgressText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '600',
  },
  branchesList: {
    marginTop: 12,
    marginBottom: 8,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  branchCheckbox: {
    padding: 6,
  },
  branchCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  branchText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  branchTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9E9E9E',
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 2,
    textTransform: 'capitalize',
  },
  recurrenceBadgeNone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  recurrenceTextNone: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    marginLeft: 2,
  },
});