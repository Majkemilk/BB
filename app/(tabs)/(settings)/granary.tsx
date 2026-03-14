import { CompletedTaskItem } from '@/components/CompletedTaskItem';
import { FilterModal } from '@/components/FilterModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/contexts/TaskContext';
import { cancelTaskNotifications } from '@/utils/notifications';
import * as Haptics from 'expo-haptics';
import { IS_OFFLINE_MODE } from '../../../utils/featureFlags';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle2, LucideIcon, MapPinned, RotateCcw, Search, SortAsc, Tag, Trash2, Wheat } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const sortOptions = [
    { key: 'completed_desc', label: 'Completed: Newest' },
    { key: 'completed_asc', label: 'Completed: Oldest' },
    { key: 'priority', label: 'Priority' },
    { key: 'title_asc', label: 'Title (A-Z)' },
];

export default function GranaryScreen() {
  const { tasks, updateTask, deleteTask, restoreTask, contexts, plots } = useTasks();
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  
  const [activeFilters, setActiveFilters] = useState({
    time: 'All',
    priority: 'All priorities',
    context: 'All contexts',
    plot: 'All plots',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState(sortOptions[0].key);
  const [filterModal, setFilterModal] = useState({ visible: false, title: '', options: [] as string[], activeOption: '', onSelect: (option: string) => {} });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const timeFilters = ['All', 'This Week', 'This Month', 'Older'];
  const priorityFilters = ['All priorities', 'Key Plant', 'Must-do', 'Could-do', 'Later'];
  
  const confirmClearAll = () => {
    Alert.alert(
      "Clear Granary",
      "Are you sure you want to permanently delete all completed tasks? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: clearAllCompleted }
      ]
    );
  };
  
  const clearAllCompleted = async () => {
    const completedTasks = tasks.filter(task => task.isCompleted);
    
    // Cancel notifications for all completed tasks
    for (const task of completedTasks) {
      try {
        await cancelTaskNotifications(task.id);
      } catch (error) {
        console.error(`Failed to cancel notifications for task ${task.id}:`, error);
      }
    }
    
    // Delete all completed tasks
    completedTasks.forEach(task => {
      deleteTask(task.id);
    });
  };
  
  
  const openFilterModal = (type: 'time' | 'priority' | 'context' | 'plot' | 'sort') => {
    switch (type) {
        case 'sort':
            setFilterModal({
                visible: true, title: 'Sort By', options: sortOptions.map(o => o.label),
                activeOption: sortOptions.find(o => o.key === activeSort)?.label || '',
                onSelect: (label) => { const key = sortOptions.find(o => o.label === label)?.key; if(key) setActiveSort(key); }
            });
            break;
        case 'time':
            setFilterModal({
                visible: true, title: 'Filter by Time', options: timeFilters,
                activeOption: activeFilters.time,
                onSelect: (option) => setActiveFilters(prev => ({ ...prev, time: option })),
            });
            break;
        case 'priority':
            setFilterModal({
                visible: true, title: 'Filter by Priority', options: priorityFilters,
                activeOption: activeFilters.priority,
                onSelect: (option) => setActiveFilters(prev => ({ ...prev, priority: option })),
            });
            break;
        case 'context':
            setFilterModal({
                visible: true, title: 'Filter by Context', options: ['All contexts', ...contexts],
                activeOption: activeFilters.context,
                onSelect: (option) => setActiveFilters(prev => ({ ...prev, context: option })),
            });
            break;
        case 'plot':
            setFilterModal({
                visible: true, title: 'Filter by Plot', options: ['All plots', ...plots],
                activeOption: activeFilters.plot,
                onSelect: (option) => setActiveFilters(prev => ({ ...prev, plot: option })),
            });
            break;
    }
  };
  
  const filteredAndSortedTasks = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    let filtered = tasks.filter(task => {
      if (!task.isCompleted || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);

      const matchesTime = activeFilters.time === 'All' ||
        (activeFilters.time === 'This Week' && completedDate >= oneWeekAgo) ||
        (activeFilters.time === 'This Month' && completedDate >= oneMonthAgo && completedDate < oneWeekAgo) ||
        (activeFilters.time === 'Older' && completedDate < oneMonthAgo);

      const matchesPriority = activeFilters.priority === 'All priorities' || (activeFilters.priority === 'Key Plant' && task.isMIT) || (!task.isMIT && task.priority === activeFilters.priority);
      const matchesContext = activeFilters.context === 'All contexts' || task.context === activeFilters.context;
      const matchesPlot = activeFilters.plot === 'All plots' || task.plot === activeFilters.plot;
      const matchesSearch = searchQuery.trim() === '' || task.title.toLowerCase().includes(searchQuery.toLowerCase()) || (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTime && matchesPriority && matchesContext && matchesPlot && matchesSearch;
    });

    const priorityOrder: { [key: string]: number } = { 'Key Plant': 0, 'Must-do': 1, 'Could-do': 2, 'Later': 3 };
    switch(activeSort) {
        case 'completed_desc':
            return filtered.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        case 'completed_asc':
            return filtered.sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
        case 'priority':
            return filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'title_asc':
            return filtered.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return filtered.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    }

  }, [tasks, activeFilters, searchQuery, activeSort]);

  const FilterHeader = ({ title, icon: Icon, onPress, activeFilter }: {title: string, icon: LucideIcon, onPress: () => void, activeFilter: string}) => (
    <TouchableOpacity style={styles.filterHeader} onPress={onPress}>
        <View style={styles.filterHeaderLeft}>
            <Icon size={18} color="#666" />
            <Text style={styles.filterHeaderTitle}>{title}</Text>
        </View>
        <Text style={styles.activeFilterText}>{activeFilter.replace('All priorities', 'All').replace('All contexts', 'All').replace('All plots', 'All')}</Text>
    </TouchableOpacity>
  );
  
  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedTaskIds([]);
  };
  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };
  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Tasks Permanently",
      `Are you sure you want to permanently delete ${selectedTaskIds.length} tasks? This action cannot be undone.\n\n💡 Note: Completed tasks can be restored from the Granary.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              let successCount = 0;
              let errorCount = 0;
              const errors: string[] = [];

              // Process each selected item with individual error handling
              for (const id of selectedTaskIds) {
                try {
                  await deleteTask(id, true); // silent = true
                  successCount++;
                } catch (error) {
                  console.error(`Error deleting task ${id}:`, error);
                  errorCount++;
                  errors.push(`Failed to delete task ${id}`);
                }
              }

              // Reset state regardless of success/failure
              setSelectedTaskIds([]);
              setSelectMode(false);

              // Show appropriate success/error message
              if (successCount > 0 && errorCount === 0) {
                // All successful
                if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Success', `🌿 ${successCount} task${successCount === 1 ? ' has' : 's have'} been permanently cleared! Your garden is ready for new growth!`);
              } else if (successCount > 0 && errorCount > 0) {
                // Partial success
                if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Partial Success', `🌿 ${successCount} task${successCount === 1 ? ' has' : 's have'} been permanently cleared! ${errorCount} failed to delete.`);
              } else {
                // All failed
                Alert.alert('Error', `Failed to delete ${errorCount} task${errorCount === 1 ? '' : 's'}. Please try again.`);
              }
            } catch (error) {
              console.error('Error in handleDeleteSelected:', error);
              Alert.alert('Error', 'Failed to delete selected tasks. Please try again.');
              
              // Reset state on error
              setSelectedTaskIds([]);
              setSelectMode(false);
            }
          },
        },
      ]
    );
  };
  
  const handleRestoreSelected = () => {
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    const wouldExceedLimit = activeTasks.length + selectedTaskIds.length > taskLimit;
    
    if (isProfileLoaded && !isPremium && wouldExceedLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `Restoring ${selectedTaskIds.length} tasks would exceed the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
        ]
      );
      return;
    }
    
    Alert.alert(
      "🌱 Restore from Granary?",
      `These ${selectedTaskIds.length} task${selectedTaskIds.length === 1 ? '' : 's'} will be restored to your active garden.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: () => {
            selectedTaskIds.forEach((id) => restoreTask(id, () => router.push('/(tabs)/(settings)/premium'), true)); // silent = true
            setSelectedTaskIds([]);
            setSelectMode(false);
            
            // Success message for bulk restore
            if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Success', `🌱 ${selectedTaskIds.length} task(s) have been restored! They're growing again in the Action Garden!`);
          },
        },
      ]
    );
  };
  
  const allVisibleSelected = filteredAndSortedTasks.length > 0 &&
    filteredAndSortedTasks.every(task => selectedTaskIds.includes(task.id));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      // Odznacz wszystkie widoczne
      setSelectedTaskIds(prev => prev.filter(id => !filteredAndSortedTasks.some(task => task.id === id)));
    } else {
      // Zaznacz wszystkie widoczne
      setSelectedTaskIds(prev => [
        ...prev,
        ...filteredAndSortedTasks
          .map(task => task.id)
          .filter(id => !prev.includes(id))
      ]);
    }
  };
  
  // ListHeaderComponent for FlatList
  const ListHeaderComponent = () => (
    <>
      <View style={styles.filtersGrid}>
        <View style={styles.filterRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <FilterHeader title="Sort By" icon={SortAsc} onPress={() => openFilterModal('sort')} activeFilter={sortOptions.find(o => o.key === activeSort)?.label || ''} />
            <TouchableOpacity style={styles.selectButton} onPress={toggleSelectMode}>
              <Text style={{ color: selectMode ? '#D32F2F' : '#4CAF50', fontWeight: 'bold', fontSize: 15 }}>
                {selectMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.filterRow}>
            <FilterHeader title="Context" icon={MapPinned} onPress={() => openFilterModal('context')} activeFilter={activeFilters.context} />
            <FilterHeader title="Plot" icon={Tag} onPress={() => openFilterModal('plot')} activeFilter={activeFilters.plot} />
        </View>
      </View>
      {selectMode && (
        <View style={styles.unifiedActionBar}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
            disabled={filteredAndSortedTasks.length === 0}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 6, borderWidth: 2,
              borderColor: allVisibleSelected ? '#4CAF50' : '#CCC',
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: allVisibleSelected ? '#4CAF50' : '#FFF',
              marginRight: 8
            }}>
              {allVisibleSelected && <CheckCircle2 size={16} color="#FFF" />}
            </View>
            <Text style={{ color: '#1A1A1A', fontWeight: '500', fontSize: 15 }}>
              {allVisibleSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.restoreButton, selectedTaskIds.length === 0 && styles.actionButtonDisabled]}
              onPress={handleRestoreSelected}
              disabled={selectedTaskIds.length === 0}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={selectedTaskIds.length === 0 ? '#CCC' : '#4CAF50'} />
              <Text style={[styles.actionText, { color: selectedTaskIds.length === 0 ? '#CCC' : '#4CAF50' }]}>
                Restore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, selectedTaskIds.length === 0 && styles.actionButtonDisabled]}
              onPress={handleDeleteSelected}
              disabled={selectedTaskIds.length === 0}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={selectedTaskIds.length === 0 ? '#CCC' : '#FF5252'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconHeader}><Wheat size={28} color="#4CAF50" /><Text style={styles.headerSubtitle}>Your Completed Achievements</Text></View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9E9E9E" />
          <TextInput style={styles.searchInput} placeholder="Search in Granary..." value={searchQuery} onChangeText={setSearchQuery} clearButtonMode="while-editing" />
        </View>
      </View>
      
      <FlatList
        data={filteredAndSortedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const handleDelete = async (id: string) => {
            try {
              await deleteTask(id);
            } catch (error) {
              console.error('Error in renderItem handleDelete:', error);
              Alert.alert('Error', 'Failed to delete your task. Please try again.');
            }
          };

          const handleRestore = async (id: string) => {
            try {
              await restoreTask(id, () => router.push('/(tabs)/(settings)/premium'));
            } catch (error) {
              console.error('Error in renderItem handleRestore:', error);
              Alert.alert('Error', 'Failed to restore your task. Please try again.');
            }
          };

          return (
            <CompletedTaskItem
              task={item}
              onRestore={handleRestore}
              onDelete={handleDelete}
              selectMode={selectMode}
              selected={selectedTaskIds.includes(item.id)}
              onSelect={() => toggleSelectTask(item.id)}
            />
          );
        }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={60} color="#BDBDBD" />
            <Text style={styles.emptyText}>Granary is Empty</Text>
            <Text style={styles.emptySubtext}>{searchQuery || Object.values(activeFilters).some(f => !f.startsWith('All')) ? 'No tasks match your filters' : 'Completed tasks will appear here'}</Text>
          </View>
        )}
      />

      <FilterModal
        visible={filterModal.visible}
        onClose={() => setFilterModal(prev => ({ ...prev, visible: false }))}
        title={filterModal.title}
        options={filterModal.options}
        activeOption={filterModal.activeOption}
        onSelect={filterModal.onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666666',
        marginLeft: 12,
        flex: 1,
        paddingRight: 8,
        flexShrink: 1,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F1F1',
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#1A1A1A',
        marginLeft: 8,
    },
    filtersGrid: {
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    filterHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#EFEFEF'
    },
    filterHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterHeaderTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
        marginLeft: 6,
    },
    activeFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        flexShrink: 1,
        textAlign: 'right',
    },
    listContent: {
        // padding: 16,
        // paddingTop: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        opacity: 0.8,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#BDBDBD',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
    },
    selectButton: {
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginLeft: 12,
    },
    unifiedActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1A1A1A',
        marginLeft: 8,
    },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
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