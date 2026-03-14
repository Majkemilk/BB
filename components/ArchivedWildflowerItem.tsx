import * as Haptics from 'expo-haptics';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';
import { Archive, ChevronUp, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ArchivedWildflowerItemProps {
  wildflower: {
    id: string;
    title: string;
    description?: string;
    archivedAt?: Date;
  };
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const ArchivedWildflowerItem = ({ 
  wildflower, 
  onRestore, 
  onDelete, 
  selectMode = false, 
  selected = false, 
  onSelect 
}: ArchivedWildflowerItemProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleDelete = async () => {
    // Haptic feedback for destructive action
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Idea Permanently',
      'Are you sure you want to permanently delete this idea? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Forever', 
          onPress: async () => {
            try {
              await onDelete(wildflower.id);
              // Success feedback
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Success', '🌿 Your Wildflower has been permanently cleared. Your garden now has more space for fresh ideas!');
            } catch (error) {
              console.error('Error in handleDelete:', error);
              Alert.alert('Error', 'Failed to delete your idea. Please try again.');
            }
          }, 
          style: 'destructive' 
        }
      ]
    );
  };
  
  const handleRestore = async () => {
    try {
      // Haptic feedback for restore action
      if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await onRestore(wildflower.id);
    } catch (error) {
      console.error('Error in handleRestore:', error);
      Alert.alert('Error', 'Failed to restore your idea. Please try again.');
    }
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
              {selected && <Archive size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
        )}
        
        <View style={styles.iconContainer}>
          <Archive size={22} color="#BDBDBD" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{wildflower.title}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.archivedDate}>
              Composted: {formatDate(wildflower.archivedAt)}
            </Text>
          </View>
          
          {expanded && wildflower.description && (
            <Text style={styles.description}>{wildflower.description}</Text>
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
            <RefreshCw size={16} color="#4CAF50" />
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
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  archivedDate: {
    fontSize: 12,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
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

