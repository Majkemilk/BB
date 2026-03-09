import { Check, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
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

interface MultiSelectFilterModalProps {
  visible: boolean;
  onClose: () => void;
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
  onClear: () => void;
  title: string;
}

export const MultiSelectFilterModal: React.FC<MultiSelectFilterModalProps> = ({
  visible,
  onClose,
  options,
  selectedOptions,
  onToggle,
  onClear,
  title
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleToggle = (option: string) => {
    onToggle(option);
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
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
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerRight}>
              {selectedOptions.length > 0 && (
                <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedOptions.length > 0 && (
            <View style={styles.selectedBadgeContainer}>
              <Text style={styles.selectedBadgeText}>
                {selectedOptions.length} selected
              </Text>
            </View>
          )}

          <View style={styles.searchContainer}>
            <Search size={20} color="#9E9E9E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selectedOptions.includes(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    isSelected && styles.activeOptionButton
                  ]}
                  onPress={() => handleToggle(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.activeOptionText
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkIconContainer}>
                        <Check size={20} color="#4CAF50" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.doneButton} 
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  selectedBadgeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  selectedBadgeText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  activeOptionButton: {
    backgroundColor: '#F1F8F4',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  activeOptionText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  checkIconContainer: {
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

