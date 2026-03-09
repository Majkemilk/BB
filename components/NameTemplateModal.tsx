import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface NameTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  suggestedName?: string;
  existingNames?: string[];
  previewData?: {
    hasPriority: boolean;
    hasContext: boolean;
    hasPlot: boolean;
    branchCount: number;
    hasRecurrence: boolean;
    hasDescription: boolean;
  };
}

export default function NameTemplateModal({ visible, onClose, onSave, suggestedName, existingNames = [], previewData }: NameTemplateModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Premium feature gating
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;

  React.useEffect(() => {
    if (visible) {
      if (suggestedName) {
        setName(suggestedName);
      } else {
        setName('');
      }
      setError('');
    }
  }, [visible, suggestedName]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (existingNames.includes(text.trim())) {
      setError('A seedling with this name already exists');
    } else {
      setError('');
    }
  };

  const handleSave = async () => {
    // Check if user has premium access
    if (isProfileLoaded && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'Task templates (Seedlings) are a Premium feature. Upgrade to create reusable task templates!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            handleClose();
            setTimeout(() => {
              router.push('/(tabs)/(settings)/premium');
            }, 100);
          }}
        ]
      );
      return;
    }
    
    if (name.trim() && !error) {
      // Haptic feedback for important actions
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);
      
      try {
        await onSave(name.trim());
        setName('');
        setError('');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Save as Seedling</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>
            create a reusable template from this task. dates will not be saved.
          </Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Seedling name"
            value={name}
            onChangeText={handleNameChange}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          {/* Preview what will be saved */}
          {previewData && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Template will include:</Text>
              <View style={styles.previewItems}>
                <Text style={styles.previewItem}>✓ Title & Description</Text>
                {previewData.hasPriority && (
                  <Text style={styles.previewItem}>✓ Priority</Text>
                )}
                {previewData.hasContext && (
                  <Text style={styles.previewItem}>✓ Context</Text>
                )}
                {previewData.hasPlot && (
                  <Text style={styles.previewItem}>✓ Plot</Text>
                )}
                {previewData.branchCount > 0 && (
                  <Text style={styles.previewItem}>✓ {previewData.branchCount} Branch{previewData.branchCount > 1 ? 'es' : ''}</Text>
                )}
                {previewData.hasRecurrence && (
                  <Text style={styles.previewItem}>✓ Recurrence pattern</Text>
                )}
              </View>
              <Text style={styles.previewNote}>⚠️ Dates will NOT be saved</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (!name.trim() || !!error || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!name.trim() || !!error || isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '85%',
    maxWidth: 360,
    alignItems: 'stretch',
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#388E3C',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: '#FF5252',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginBottom: 12,
    marginLeft: 4,
  },
  previewBox: {
    backgroundColor: '#F8FFFE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  previewItems: {
    marginBottom: 8,
  },
  previewItem: {
    fontSize: 13,
    color: '#388E3C',
    marginBottom: 4,
    lineHeight: 18,
  },
  previewNote: {
    fontSize: 12,
    color: '#F57C00',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 