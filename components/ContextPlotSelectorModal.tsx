import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Check, Plus, Search, X } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ContextPlotSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onAddNew?: (newValue: string) => void;
  placeholder?: string;
}

export default function ContextPlotSelectorModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  onAddNew,
  placeholder = 'Search...'
}: ContextPlotSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [tempSelectedValue, setTempSelectedValue] = useState('');
  const successOpacity = useRef(new Animated.Value(0)).current;
  
  // Premium feature gating
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;

  // Initialize temp selected value when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempSelectedValue(selectedValue);
    }
  }, [visible, selectedValue]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (value: string) => {
    setTempSelectedValue(value);
  };

  const handleAddNew = () => {
    if (onAddNew && newItemText.trim() && !options.includes(newItemText.trim())) {
      // Check limit for non-premium users
      const limit = 5;
      const isContext = title.toLowerCase().includes('context');
      const isPlot = title.toLowerCase().includes('plot');
      
      if (isProfileLoaded && !isPremium && (isContext || isPlot) && options.length >= limit) {
        Alert.alert(
          'Upgrade to Premium',
          `You've reached the limit of ${limit} ${title.toLowerCase()}s. Upgrade to Premium for unlimited categories!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              handleClose();
              setTimeout(() => {
                router.push('/(tabs)/(settings)');
              }, 100);
            }}
          ]
        );
        return;
      }
      
      onAddNew(newItemText.trim());
      setTempSelectedValue(newItemText.trim());
      setNewItemText('');
      setShowAddForm(false);
    }
  };

  const handleSave = () => {
    onSelect(tempSelectedValue);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setShowAddForm(false);
    setNewItemText('');
    setTempSelectedValue('');
    onClose();
  };

  const handleToggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setNewItemText('');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.title}>{showAddForm ? `Add New ${title}` : title}</Text>
            <View style={styles.headerRight}>
              {onAddNew && !showAddForm && (
                <TouchableOpacity 
                  onPress={handleToggleAddForm} 
                  style={styles.newButton}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color="#4CAF50" style={{ marginRight: 4 }} />
                  <Text style={styles.newButtonText}>New</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add New Form - Collapsible */}
          {showAddForm && onAddNew && (
            <View style={styles.addFormContainer}>
              <TextInput
                style={styles.addInput}
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder={`Enter new ${title.toLowerCase()}...`}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddNew}
              />
              <TouchableOpacity
                style={[styles.addButton, !newItemText.trim() && styles.addButtonDisabled]}
                onPress={handleAddNew}
                disabled={!newItemText.trim()}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search - Hidden when adding new */}
          {!showAddForm && (
            <View style={styles.searchContainer}>
              <Search size={20} color="#9E9E9E" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor="#9E9E9E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}
          
          {/* Options List - Hidden when adding new */}
          {!showAddForm && (
            <>
              {filteredOptions.length === 0 ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => {
                const isSelected = tempSelectedValue === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      isSelected && styles.activeOptionButton
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.activeOptionText
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="#4CAF50" strokeWidth={3} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No results found' : `No ${title.toLowerCase()}s yet`}
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
              )}
            </>
          )}
          
          {/* Footer with Save/Cancel buttons - Only in select mode */}
          {!showAddForm && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Set {title}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  addFormContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeOptionButton: {
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  activeOptionText: {
    color: '#388E3C',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  successBadge: {
    alignItems: 'center',
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});

