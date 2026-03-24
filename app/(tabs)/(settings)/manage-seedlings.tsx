import NewTaskModal from '../../../components/NewTaskModal';
import { SeedlingItem } from '../../../components/SeedlingItem';
import { useAuth } from '../../../contexts/AuthContext';
import { Template, useTasks } from '../../../contexts/TaskContext';
import { useRouter } from 'expo-router';
import { Leaf, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ModalMode = 'plant' | 'edit' | 'create' | null;

export default function ManageSeedlingsScreen() {
  const { templates, deleteTemplate, addTemplate, addTask, contexts, plots, addContext, addPlot } = useTasks();
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const insets = useSafeAreaInsets();

  const handlePlant = (template: Template) => {
    setSelectedTemplate(template);
    setModalMode('plant');
    setIsModalVisible(true);
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleCreateNew = () => {
    // 🔒 CRITICAL SECURITY: Check template limit for non-premium users
    const templateLimit = 5;
    
    if (isProfileLoaded && !isPremium && templates.length >= templateLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${templateLimit} Seedling templates. Upgrade to Premium for unlimited templates!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
        ]
      );
      return;
    }
    
    setSelectedTemplate(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setSelectedTemplate(null);
    setModalMode(null);
    setIsModalVisible(false);
  };

  const handleModalSave = async (taskData: any) => {
    if (modalMode === 'plant') {
      await addTask(taskData);
    } else if (modalMode === 'edit' && selectedTemplate) {
      await deleteTemplate(selectedTemplate.id);
      await addTemplate({ 
        name: taskData.title || selectedTemplate.name, 
        taskData 
      });
    } else if (modalMode === 'create') {
      await addTemplate({
        name: taskData.title,
        taskData
      });
    }
    handleModalClose();
  };

  const handleDelete = async (templateId: string) => {
    await deleteTemplate(templateId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.iconHeader}>
          <Leaf size={28} color="#4CAF50" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Seedlings </Text>
            <Text style={styles.headerSubtext}>(reusable task templates)</Text>
          </View>
        </View>
      </View>
      {templates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Leaf size={60} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Seedlings Yet</Text>
          <Text style={styles.emptyText}>
            Create templates for tasks you do regularly
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates as Template[]}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SeedlingItem
              template={item}
              onPlant={handlePlant}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        />
      )}
      <NewTaskModal
        visible={isModalVisible}
        onClose={handleModalClose}
        onAdd={handleModalSave}
        initialData={modalMode === 'plant' ? selectedTemplate?.taskData : undefined}
        addTemplate={addTemplate}
        contexts={contexts}
        plots={plots}
        addContext={addContext}
        addPlot={addPlot}
        modalMode={modalMode}
        task={modalMode === 'edit' && selectedTemplate ? { 
          id: `seedling-${selectedTemplate.id}`,
          title: selectedTemplate.taskData?.title || '',
          description: selectedTemplate.taskData?.description || '',
          priority: selectedTemplate.taskData?.priority || 'Could-do',
          isMIT: selectedTemplate.taskData?.isMIT || false,
          isCompleted: false,
          createdAt: new Date(),
          context: selectedTemplate.taskData?.context,
          plot: selectedTemplate.taskData?.plot,
          startDate: selectedTemplate.taskData?.startDate,
          dueDate: selectedTemplate.taskData?.dueDate,
          branches: selectedTemplate.taskData?.branches || [],
          recurrence: selectedTemplate.taskData?.recurrence,
        } as any : undefined}
      />
      
      {/* FAB - Create New Seedling */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleCreateNew}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  headerSubtext: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});


