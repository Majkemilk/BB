import * as Haptics from 'expo-haptics';
import { ChevronUp, GitMerge, Leaf, MoreHorizontal, Pencil, Repeat, Sprout, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PriorityBadge } from './PriorityBadge';

interface SeedlingItemProps {
  template: {
    id: string;
    name: string;
    taskData: any;
  };
  onPlant: (template: any) => void;
  onEdit: (template: any) => void;
  onDelete: (id: string) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const SeedlingItem = ({
  template,
  onPlant,
  onEdit,
  onDelete,
  selectMode = false,
  selected = false,
  onSelect
}: SeedlingItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    // Haptic feedback for destructive action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Seedling Template',
      'Are you sure you want to permanently delete this template? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(template.id),
        },
      ]
    );
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const hasBranches = Array.isArray(template.taskData.branches) && template.taskData.branches.length > 0;

  const getRecurrenceSummary = (rec: any) => {
    if (!rec) return '';
    switch (rec.type) {
      case 'daily':
        return rec.interval > 1 ? `Every ${rec.interval} days` : 'Daily';
      case 'weekly':
        const days = rec.daysOfWeek?.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
        return `Weekly${days ? ' on ' + days : ''}`;
      case 'monthly':
        return rec.interval > 1 ? `Every ${rec.interval} months` : 'Monthly';
      case 'yearly':
        return rec.interval > 1 ? `Every ${rec.interval} years` : 'Yearly';
      default:
        return 'Repeats';
    }
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
              borderColor: selected ? '#4CAF50' : '#CCC',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected ? '#4CAF50' : '#FFF'
            }}>
              {selected && <Leaf size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title}>{template.name}</Text>
          
          {template.name !== template.taskData?.title && template.taskData?.title && (
            <Text style={styles.taskTitle}>Task: "{template.taskData.title}"</Text>
          )}

          <View style={styles.metaRow}>
            {template.taskData?.priority && (
              <PriorityBadge priority={template.taskData.priority} />
            )}
            {template.taskData?.context && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{template.taskData.context}</Text>
              </View>
            )}
            {template.taskData?.plot && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{template.taskData.plot}</Text>
              </View>
            )}
            {template.taskData?.recurrence && (
              <View style={styles.recurrenceBadge}>
                <Repeat size={14} color="#FF9800" style={{ marginRight: 4 }} />
                <Text style={styles.recurrenceText}>
                  {getRecurrenceSummary(template.taskData.recurrence)}
                </Text>
              </View>
            )}
            
            {/* Recurrence None Badge - for all seedlings without active recurrence */}
            {(!template.taskData?.recurrence || template.taskData?.recurrence === null) && (
              <View style={styles.recurrenceBadgeNone}>
                <Repeat size={14} color="#999999" style={{ marginRight: 4 }} />
                <Text style={styles.recurrenceTextNone}>None</Text>
              </View>
            )}
            {hasBranches && (
              <View style={styles.branchesBadge}>
                <GitMerge size={12} color="#4CAF50" style={{ marginRight: 4 }} />
                <Text style={styles.branchesText}>
                  {template.taskData.branches.length} Branch{template.taskData.branches.length > 1 ? 'es' : ''}
                </Text>
              </View>
            )}
          </View>

          {expanded && (
            <>
              {template.taskData?.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {template.taskData.description}
                </Text>
              )}
              
              {hasBranches && (
                <View style={styles.branchesList}>
                  <Text style={styles.branchesListTitle}>Branches:</Text>
                  {template.taskData.branches.slice(0, 5).map((b: any, i: number) => (
                    <Text key={i} style={styles.branchItem}>• {b.text}</Text>
                  ))}
                  {template.taskData.branches.length > 5 && (
                    <Text style={styles.branchItem}>... and {template.taskData.branches.length - 5} more</Text>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.expandButton} onPress={toggleExpanded}>
          {expanded ? <ChevronUp size={18} color="#BDBDBD" /> : <MoreHorizontal size={18} color="#BDBDBD" />}
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.growButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPlant(template);
            }}
            activeOpacity={0.7}
          >
            <Sprout size={16} color="#4CAF50" />
            <Text style={styles.growButtonText}>Cultivate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tendButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(template);
            }}
            activeOpacity={0.7}
          >
            <Pencil size={16} color="#666" />
            <Text style={styles.tendButtonText}>Tend</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 6,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  branchesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  branchesText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recurrenceText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  recurrenceBadgeNone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recurrenceTextNone: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  branchesList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  branchesListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  branchItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
    paddingLeft: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    gap: 8,
  },
  growButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  growButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  tendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tendButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: 8,
  },
});

