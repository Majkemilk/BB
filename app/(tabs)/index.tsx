import { FilterModal } from '@/components/FilterModal';
import { NewTaskModal } from '@/components/NewTaskModal';
import { NewWildflowerModal } from '@/components/NewWildflowerModal';
import { WildflowerItem } from '@/components/WildflowerItem';
import { useAuth } from '@/contexts/AuthContext';
import { Task, useTasks, Wildflower } from '@/contexts/TaskContext';
import { useOrientation } from '@/hooks/useOrientation';
import { ResponsiveUtils } from '@/utils/responsive';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronDown, Flower, Plus, Search, SortAsc, Sparkles, Sprout, Star, Wheat } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const sortOptions = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title_asc', label: 'Title (A-Z)' },
  { key: 'title_desc', label: 'Title (Z-A)' },
  { key: 'updated_desc', label: 'Recently Updated' },
];

export default function IdeaMeadowScreen() {
  // Navigation debug: lifecycle and focus events
  useEffect(() => {
    console.log('[IdeaMeadow] mount');
    return () => {
      console.log('[IdeaMeadow] unmount');
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[IdeaMeadow] focus');
      return () => {
        console.log('[IdeaMeadow] blur');
      };
    }, [])
  );

  useEffect(() => {
    const safeTasks = tasks ?? [];
    const safeWildflowers = wildflowers ?? [];
    const safeContexts = contexts ?? [];
    const safePlots = plots ?? [];
    console.log('[IdeaMeadow] state snapshot', {
      tasksCount: safeTasks.length,
      wildflowersCount: safeWildflowers.length,
      contextsCount: safeContexts.length,
      plotsCount: safePlots.length,
      isPremium,
      isProfileLoaded,
    });
  }, [tasks, wildflowers, contexts, plots, isPremium, isProfileLoaded]);

  const { 
    tasks,
    addTask, 
    harvestWildflower, 
    contexts, 
    plots, 
    wildflowers,
    addWildflower,
    updateWildflower,
    deleteWildflower,
    archiveWildflower,
    addContext,
    addPlot
  } = useTasks();
  
  const { userProfile, userProfileLoading } = useAuth();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  const router = useRouter();
  const orientation = useOrientation();
  
  const [isWildflowerModalVisible, setIsWildflowerModalVisible] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [editingWildflower, setEditingWildflower] = useState<Wildflower | null>(null);
  const [selectedWildflower, setSelectedWildflower] = useState<Wildflower | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState(sortOptions[0].key);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const handleAddOrUpdateWildflower = (wildflowerData: Omit<Wildflower, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingWildflower) {
      updateWildflower(editingWildflower.id, wildflowerData);
    } else {
      addWildflower(wildflowerData);
    }
  };
  
  const handleQuickHarvest = async (wildflower: Wildflower) => {
    try {
      await harvestWildflower(wildflower);
      // Success message and haptic feedback handled by handleQuickHarvestAnimated
    } catch (error) {
      console.error('Error in handleQuickHarvest:', error);
      // Only show error if the main operation (creating task) failed
      // The harvestWildflower function now handles deleteWildflower errors internally
      Alert.alert('Error', 'Failed to replant your idea. Please try again.');
    }
  };

  const handleNurture = (wildflower: Wildflower) => {
    setSelectedWildflower(wildflower);
    setIsTaskModalVisible(true);
  };

  const handleTransplantSuccess = () => {
    // Modal removed - no longer showing transplant success message
  };

  const handleTaskAdd = async (taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>): Promise<void> => {
    try {
      // Check task limit for non-premium users BEFORE creating task
      const taskLimit = 30;
      const activeTasks = tasks.filter(task => !task.isCompleted);
      
      if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
        Alert.alert(
          'Upgrade to Premium',
          `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)') }
          ]
        );
        return;
      }
      
      if (selectedWildflower) {
        await addTask(taskData);
        
        // Delete wildflower in background (with fallback for safety)
        try {
          if (selectedWildflower.id && selectedWildflower.id.includes('-')) {
            await deleteWildflower(selectedWildflower.id);
          } else {
            await deleteWildflower('temp-non-uuid', { title: selectedWildflower.title, description: selectedWildflower.description });
          }
        } catch (deleteError) {
          console.error('Error deleting wildflower after cultivate:', deleteError);
          // Don't re-throw - the main operation (creating task) was successful
          // The wildflower has already been removed from local state, so UI is consistent
        }
        
        // Show success message after transplanting wildflower to task
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (hapticError) {
          // Haptic feedback not available
        }
        Alert.alert('Success', '🌱 Your new Plant is growing in the Action Garden! Keep an eye on your task!');
      }
    } catch (error) {
      console.error('Error in handleTaskAdd:', error);
      Alert.alert('Error', 'Failed to cultivate your idea. Please try again.');
      throw error;
    } finally {
      setIsTaskModalVisible(false);
      setSelectedWildflower(null);
    }
  };

  const openWildflowerModal = () => {
    // Check wildflower limit for non-premium users
    const wildflowerLimit = 30;
    
    if (isProfileLoaded && !isPremium && wildflowers.length >= wildflowerLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${wildflowerLimit} wildflowers. Upgrade to Premium for unlimited ideas!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
        ]
      );
      return;
    }
    
    setEditingWildflower(null);
    setIsWildflowerModalVisible(true);
  };

  const closeWildflowerModal = () => {
    setIsWildflowerModalVisible(false);
  };

  const handleOpenEditWildflowerModal = (wildflower: Wildflower) => {
    setEditingWildflower(wildflower);
    setIsWildflowerModalVisible(true);
  };

  const filteredAndSortedWildflowers = useMemo(() => {
    let filtered = (wildflowers || []).filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    switch (activeSort) {
      case 'recent':
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'title_asc':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      case 'updated_desc':
        return filtered.sort((a, b) => 
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
      default:
        return filtered;
    }
  }, [wildflowers, searchQuery, activeSort]);

  const activeSortLabel = sortOptions.find(opt => opt.key === activeSort)?.label || 'Sort';

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconHeader}>
          <Text style={styles.headerSubtitle}>Plant your wildflower: an idea waiting to bloom</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Star size={16} color="#FFD700" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
        <View style={styles.hints}>
          <View style={styles.hintRow}>
            <Sparkles size={16} color="#FFB300" />
            <Text style={styles.hint}>Capture ideas as they bloom</Text>
          </View>
          <View style={styles.hintRow}>
            <Flower size={16} color="#4CAF50" />
            <Text style={styles.hint}>Nurture them into actionable tasks</Text>
          </View>
          <View style={styles.hintRow}>
            <Wheat size={16} color="#4CAF50" />
            <Text style={styles.hint}>Let your creativity grow freely</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ideas by keyword..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      
      <View style={styles.controlsSection}>
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setIsSortModalVisible(true)}
          activeOpacity={0.7}
        >
          <SortAsc size={16} color="#666" style={{ marginRight: 8 }} />
          <Text style={styles.sortButtonText}>Sort: {activeSortLabel}</Text>
          <ChevronDown size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredAndSortedWildflowers}
        numColumns={1}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WildflowerItem
            wildflower={item}
            onCompost={archiveWildflower}
            onEdit={handleOpenEditWildflowerModal}
            onNurture={handleNurture}
            onQuickHarvest={handleQuickHarvest}
            viewMode="list"
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Sprout size={60} color="#4CAF50" style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No ideas found</Text>
            <Text style={styles.emptySubtext}>{searchQuery ? 'Try a different search term' : 'Tap the button below to plant one'}</Text>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={openWildflowerModal}
        accessibilityLabel="Create new wildflower idea"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <NewWildflowerModal
        visible={isWildflowerModalVisible}
        onClose={closeWildflowerModal}
        onAdd={handleAddOrUpdateWildflower}
        editingWildflower={editingWildflower}
      />
      <NewTaskModal
        visible={isTaskModalVisible}
        onClose={() => {
          setIsTaskModalVisible(false);
          setSelectedWildflower(null);
        }}
        onAdd={handleTaskAdd}
        initialData={selectedWildflower ? {
          title: selectedWildflower.title,
          description: selectedWildflower.description ?? '',
        } : undefined}
        contexts={contexts}
        plots={plots}
        addContext={addContext}
        addPlot={addPlot}
        onTransplantSuccess={handleTransplantSuccess}
      />
      <FilterModal
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        title="Sort by"
        options={sortOptions.map(opt => opt.label)}
        activeOption={activeSortLabel}
        onSelect={(selectedLabel) => {
            const selectedOption = sortOptions.find(opt => opt.label === selectedLabel);
            if (selectedOption) {
                setActiveSort(selectedOption.key);
            }
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().md, paddingTop: ResponsiveUtils.getResponsiveSpacing().md, paddingBottom: ResponsiveUtils.getResponsiveSpacing().sm, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  iconHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: ResponsiveUtils.getResponsiveSpacing().sm, },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFE0',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: '#DAA520',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerSubtitle: { fontSize: ResponsiveUtils.getResponsiveFontSizes().sm, color: '#666666', marginLeft: ResponsiveUtils.getResponsiveSpacing().sm, flex: 1, },
  hints: { marginTop: ResponsiveUtils.getResponsiveSpacing().sm, paddingTop: ResponsiveUtils.getResponsiveSpacing().sm, borderTopWidth: 1, borderTopColor: '#E8F5E9', },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: ResponsiveUtils.getResponsiveSpacing().sm, },
  hint: { fontSize: ResponsiveUtils.getResponsiveFontSizes().sm, color: '#666666', marginLeft: ResponsiveUtils.getResponsiveSpacing().sm, fontStyle: 'italic', },
  searchSection: { backgroundColor: '#FFFFFF', paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().md, paddingVertical: ResponsiveUtils.getResponsiveSpacing().sm, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F1F1', borderRadius: ResponsiveUtils.getResponsiveValue(10, 12, 14), paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().sm, },
  searchInput: { flex: 1, height: ResponsiveUtils.getSearchBarDimensions().height, fontSize: ResponsiveUtils.getSearchBarDimensions().fontSize, color: '#1A1A1A', marginLeft: ResponsiveUtils.getResponsiveSpacing().sm, },
  controlsSection: { backgroundColor: '#FFFFFF', paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().md, paddingVertical: ResponsiveUtils.getResponsiveSpacing().sm, borderBottomWidth: 1, borderBottomColor: '#E8F5E9', flexDirection: 'row', gap: ResponsiveUtils.getResponsiveSpacing().sm },
  sortButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: ResponsiveUtils.getResponsiveSpacing().sm, backgroundColor: '#F8F9FA', borderRadius: ResponsiveUtils.getResponsiveValue(8, 10, 12), flex: 1 },
  sortButtonText: { fontSize: ResponsiveUtils.getResponsiveFontSizes().sm, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  listContent: { padding: ResponsiveUtils.getResponsiveSpacing().md, paddingTop: ResponsiveUtils.getResponsiveSpacing().sm, paddingBottom: ResponsiveUtils.getResponsiveValue(100, 120, 140), },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: ResponsiveUtils.getEmptyStateDimensions().padding, },
  emptyText: { marginTop: ResponsiveUtils.getResponsiveSpacing().md, fontSize: ResponsiveUtils.getEmptyStateDimensions().titleSize, fontWeight: '600', color: '#1A1A1A', textAlign: 'center', },
  emptySubtext: { marginTop: ResponsiveUtils.getResponsiveSpacing().sm, fontSize: ResponsiveUtils.getEmptyStateDimensions().subtitleSize, color: '#666666', textAlign: 'center', },
  fabButton: { 
    position: 'absolute', 
    bottom: ResponsiveUtils.getResponsiveSpacing().lg, 
    right: ResponsiveUtils.getResponsiveSpacing().lg, 
    width: ResponsiveUtils.getFABDimensions().size, 
    height: ResponsiveUtils.getFABDimensions().size, 
    borderRadius: ResponsiveUtils.getFABDimensions().borderRadius, 
    backgroundColor: '#4CAF50', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 6, 
    elevation: 8, 
  },
});