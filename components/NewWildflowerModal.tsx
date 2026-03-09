import * as Haptics from 'expo-haptics';
import { Pencil, Sprout, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const NewWildflowerModal = ({ visible, onClose, onAdd, editingWildflower }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Ta logika jest poprawna, zostaje bez zmian
    if (visible) {
      if (editingWildflower) {
        setTitle(editingWildflower.title || '');
        setDescription(editingWildflower.description || '');
      } else {
        setTitle('');
        setDescription('');
      }
    }
  }, [visible, editingWildflower]);
  
  const handleAdd = async () => {
    if (title.trim() === '') {
      Alert.alert('Missing Title', 'Please enter a title for your wildflower.');
      return;
    }
    
    // Haptic feedback for important actions
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        {/* Używamy ScrollView, aby uniknąć problemów z klawiaturą */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={[styles.modalView, { flex: 1 }]}>
              <View style={styles.modalHeader}>
                {editingWildflower ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
                    <Pencil size={24} color="#4CAF50" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalTitle, { color: '#4CAF50' }]}>Tend Wildflower</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
                    <Sprout size={24} color="#4CAF50" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalTitle, { color: '#4CAF50' }]}>Grow a New Wildflower</Text>
                  </View>
                )}
                {editingWildflower ? (
                  <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>update your idea</Text>
                ) : (
                  <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>capture your spontaneous idea</Text>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>What's your idea?</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter your spontaneous idea"
                  autoFocus={!editingWildflower}
                  returnKeyType="next"
                />
                
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add some details if you'd like"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (title.trim() === '' || isSaving) && styles.addButtonDisabled
                  ]}
                  onPress={handleAdd}
                  disabled={title.trim() === '' || isSaving}
                >
                  <Text style={styles.addButtonText}>
                    {isSaving ? 'Saving...' : (editingWildflower ? 'Tend' : 'Grow')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    height: 100,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});