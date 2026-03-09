import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { useRouter } from 'expo-router';
import { Flower, GitMerge, Leaf, Sprout, Star, X } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PriorityBadge } from './PriorityBadge';

interface TemplateChooserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (templateData: any | null) => void;
}

export default function TemplateChooserModal({ visible, onClose, onSelect }: TemplateChooserModalProps) {
  const { templates } = useTasks();
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  const [showTemplateList, setShowTemplateList] = React.useState(false);

  const handleSelect = (templateData: any | null) => {
    onSelect(templateData);
    setShowTemplateList(false);
    onClose();
  };

  const handleClose = () => {
    setShowTemplateList(false);
    onClose();
  };

  const handleGoPremium = () => {
    handleClose();
    setTimeout(() => {
      router.push('/(tabs)/(settings)/premium' as any);
    }, 150);
  };

  const handleTemplateButtonPress = () => {
    if (isProfileLoaded && isPremium) {
      setShowTemplateList(!showTemplateList);
    }
    // If not premium or profile not loaded, do nothing (button is disabled)
  };

  const renderTemplateCard = ({ item }: { item: any }) => {
    const { name, taskData } = item;
    const hasBranches = Array.isArray(taskData.branches) && taskData.branches.length > 0;
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelect(taskData)}>
        <View style={styles.cardContentCol}>
          <Text style={styles.cardTitle}>{name}</Text>
          <View style={styles.cardPreviewRow}>
            {taskData.priority && (
              <PriorityBadge priority={taskData.priority} />
            )}
            {taskData.context && (
              <View style={styles.cardMetaBadge}>
                <Text style={styles.cardMetaText}>{taskData.context}</Text>
              </View>
            )}
            {taskData.plot && (
              <View style={styles.cardMetaBadge}>
                <Text style={styles.cardMetaText}>{taskData.plot}</Text>
              </View>
            )}
            {hasBranches && (
              <View style={styles.cardBranchesBadge}>
                <GitMerge size={14} color="#4CAF50" style={{ marginRight: 3 }} />
                <Text style={styles.cardBranchesText}>{taskData.branches.length} Branch{taskData.branches.length > 1 ? 'es' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { flex: 1 }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleContainer}>
              {showTemplateList ? (
                <Leaf size={24} color="#4CAF50" style={{ marginRight: 8 }} />
              ) : (
                <Sprout size={24} color="#4CAF50" style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.title, { color: '#4CAF50' }]}>Grow a New Plant</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              {showTemplateList ? 'choose a seedling to use' : 'choose how to start growing'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityLabel="Close">
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Show buttons ONLY when list is NOT expanded */}
          {!showTemplateList && (
            <>
              {/* Primary Action: New Plant */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleSelect(null)}
                accessibilityLabel="Create new plant"
              >
                <Flower size={22} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>New Plant</Text>
              </TouchableOpacity>
              
              {/* Secondary Action: From Seedling */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            (!isProfileLoaded || !isPremium) && styles.secondaryButtonDisabled
          ]}
          onPress={handleTemplateButtonPress}
          disabled={!isProfileLoaded || !isPremium}
          accessibilityLabel="Choose from Seedling template"
        >
          <Leaf size={22} color={(isProfileLoaded && isPremium) ? "#4CAF50" : "#999999"} />
          <Text style={[
            styles.secondaryButtonText,
            (!isProfileLoaded || !isPremium) && styles.secondaryButtonTextDisabled
          ]}>
            From Seedling (template)
          </Text>
        </TouchableOpacity>
              
        {/* Premium Prompt - shown when not premium and profile is loaded */}
        {isProfileLoaded && !isPremium && (
          <View style={styles.premiumPrompt}>
            <Star size={24} color="#FFD700" style={{ marginRight: 8 }} />
            <Text style={styles.premiumText}>Seedlings are a Premium feature</Text>
            <TouchableOpacity 
              style={styles.goPremiumButton}
              onPress={handleGoPremium}
            >
              <Text style={styles.goPremiumButtonText}>Go Premium</Text>
            </TouchableOpacity>
          </View>
        )}
            </>
          )}
          
        {/* Templates List - shown when premium and list expanded */}
        {isProfileLoaded && isPremium && showTemplateList && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
              </View>
              <FlatList
                data={templates}
                keyExtractor={item => item.id}
                renderItem={renderTemplateCard}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No Seedlings saved yet.</Text>
                }
                style={{ flexGrow: 0, maxHeight: 300 }}
                contentContainerStyle={templates.length === 0 ? undefined : { paddingBottom: 12 }}
              />
            </>
          )}
          
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose} accessibilityLabel="Cancel">
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    minHeight: 320,
    maxHeight: '80%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 40,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContentCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  cardPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardMetaBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 2,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '500',
  },
  cardBranchesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 2,
  },
  cardBranchesText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  blankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'flex-start',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  blankButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  secondaryButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  secondaryButtonTextDisabled: {
    color: '#999999',
  },
  dividerRow: {
    marginVertical: 8,
    marginHorizontal: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  premiumPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFE0', // Bardzo jasnożółte tło
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700', // Czysty złoty border
    shadowColor: '#FFD700', // Złoty cień
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumText: {
    fontSize: 14,
    color: '#B8860B', // Ciemnożółty opis
    flex: 1,
    marginRight: 8,
  },
  goPremiumButton: {
    backgroundColor: '#FFD700', // Czysty złoty przycisk
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  goPremiumButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
}); 