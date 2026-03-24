import { FilterModal } from '../../components/FilterModal';
import { MultiSelectFilterModal } from '../../components/MultiSelectFilterModal';
import NewTaskModal from '../../components/NewTaskModal';
import { TaskItem } from '../../components/TaskItem';
import TemplateChooserModal from '../../components/TemplateChooserModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { IS_OFFLINE_MODE } from '../../utils/featureFlags';
import { ArrowUpRight, Calendar, ChevronDown, MapPinned, Plus, Search, SortAsc, Star, Tag } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ActionGardenScreen() {
  // Navigation debug: lifecycle and focus events
  useEffect(() => {
    console.log('[ActionGarden] mount');
    return () => {
      console.log('[ActionGarden] unmount');
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[ActionGarden] focus');
      return () => {
        console.log('[ActionGarden] blur');
      };
    }, [])
  );

  useEffect(() => {
    console.log('[ActionGarden] state snapshot', {
      tasksCount: tasks?.length,
      mitCount: tasks?.filter(t => t.isMIT)?.length,
      isPremium,
      isProfileLoaded,
    });
  }, [tasks, isPremium, isProfileLoaded]);

  const { 
    tasks, 
    toggleTaskComplete, 
    toggleMIT, 
    deleteTask,
    updateTask,
    addTask,
    contexts,
    plots,
    addContext,
    addPlot
  } = useTasks();
  
  const { userProfile, userProfileLoading } = useAuth();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  const router = useRouter();

  const [isNewTaskModalVisible, setIsNewTaskModalVisible] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(undefined);
  
  const [activeFilters, setActiveFilters] = useState({
    priority: [] as string[],
    dueDate: [] as string[],
    context: [] as string[],
    plot: [] as string[],
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const [filterModal, setFilterModal] = useState({
    visible: false,
    title: '',
    options: [] as string[],
    activeOptions: [] as string[],
    filterType: '' as 'priority' | 'dueDate' | 'context' | 'plot' | '',
  });

  const [showTransplantInfo, setShowTransplantInfo] = useState(false);

  const [isTemplateChooserVisible, setIsTemplateChooserVisible] = useState(false);
  const [templateInitialData, setTemplateInitialData] = useState<any>(null);

  const priorityOptions = ['Key Plant', 'Must-do', 'Could-do', 'Later'];
  const dueDateOptions = ['Due Today', 'Tomorrow', 'This Week', 'Later', 'Overdue', 'Start Today'];
  
  const toggleFilter = (type: 'priority' | 'dueDate' | 'context' | 'plot', option: string) => {
    setActiveFilters(prev => {
      const currentFilters = prev[type];
      const isSelected = currentFilters.includes(option);
      
      const newFilters = {
        ...prev,
        [type]: isSelected
          ? currentFilters.filter(item => item !== option)
          : [...currentFilters, option]
      };
      
      setFilterModal(modal => ({
        ...modal,
        activeOptions: newFilters[type]
      }));
      
      return newFilters;
    });
  };

  const clearFilters = (type: 'priority' | 'dueDate' | 'context' | 'plot') => {
    setActiveFilters(prev => ({ ...prev, [type]: [] }));
    
    setFilterModal(modal => ({
      ...modal,
      activeOptions: []
    }));
  };
  
  const openFilterModal = (type: 'priority' | 'dueDate' | 'context' | 'plot') => {
    let options: string[] = [];
    
    switch (type) {
      case 'priority':
        options = priorityOptions;
        break;
      case 'dueDate':
        options = dueDateOptions;
        break;
      case 'context':
        options = contexts;
        break;
      case 'plot':
        options = plots;
        break;
    }
    
    setFilterModal({
      visible: true,
      title: `Select ${type === 'dueDate' ? 'Due Date' : type.charAt(0).toUpperCase() + type.slice(1)}`,
      options,
      activeOptions: activeFilters[type],
      filterType: type,
    });
  };

  const toggleNewTaskModal = () => {
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    
    if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
        ]
      );
      return;
    }
    
    if (!isNewTaskModalVisible) {
      setTaskToEdit(undefined);
    }
    setIsNewTaskModalVisible(!isNewTaskModalVisible);
  };

  const handlePriorityChange = (taskId: string, newPriority: 'Must-do' | 'Could-do' | 'Later' | 'Key Plant') => {
    updateTask(taskId, { priority: newPriority });
  };

  const editTask = (task: any) => {
    setTaskToEdit(task);
    setIsNewTaskModalVisible(true);
  };

  const handleAddTask = async (taskData: any) => {
    try {
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
      
      if (taskToEdit) {
        await updateTask(taskToEdit.id, taskData);
      } else {
        await addTask(taskData);
        
        try {
          if (!IS_OFFLINE_MODE) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (hapticError) {
          // Haptic feedback not available
        }

        Alert.alert('Success', '🌱 Your new Plant is growing in the Action Garden! Keep an eye on your task!');
      }
    } catch (error) {
      console.error('Error in handleAddTask:', error);
      Alert.alert('Error', 'Failed to create your task. Please try again.');
      throw error;
    } finally {
      setTaskToEdit(undefined);
      setIsNewTaskModalVisible(false);
    }
  };

  const handleTransplantSuccess = () => {
    setShowTransplantInfo(true);
  };

  const isTaskDueToday = (dueDate: any) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  };

  const isTaskDueTomorrow = (dueDate: any) => {
    if (!dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === tomorrow.getTime();
  };

  const isTaskDueThisWeek = (dueDate: any) => {
    if (!dueDate) return false;
    const today = new Date();
    const taskDate = new Date(dueDate);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return taskDate > today && taskDate <= nextWeek;
  };

  const isTaskOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (task.isCompleted) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    const priorityFilters = activeFilters.priority;
    if (priorityFilters.length > 0) {
      const taskPriority = task.isMIT ? 'Key Plant' : task.priority;
      if (!priorityFilters.includes(taskPriority)) return false;
    }

    const contextFilters = activeFilters.context;
    if (contextFilters.length > 0) {
      if (!task.context || !contextFilters.includes(task.context)) return false;
    }

    const plotFilters = activeFilters.plot;
    if (plotFilters.length > 0) {
      if (!task.plot || !plotFilters.includes(task.plot)) return false;
    }

    const dueDateFilters = activeFilters.dueDate;
    if (dueDateFilters.length > 0) {
      let matchesDueDate = false;

      for (const filter of dueDateFilters) {
        switch (filter) {
          case 'Due Today':
            if (isTaskDueToday(task.dueDate)) matchesDueDate = true;
            break;
          case 'Tomorrow':
            if (isTaskDueTomorrow(task.dueDate)) matchesDueDate = true;
            break;
          case 'This Week':
            if (isTaskDueThisWeek(task.dueDate)) matchesDueDate = true;
            break;
          case 'Later':
            if (
              task.dueDate &&
              !isTaskDueToday(task.dueDate) &&
              !isTaskDueTomorrow(task.dueDate) &&
              !isTaskDueThisWeek(task.dueDate) &&
              !isTaskOverdue(task.dueDate)
            ) {
              matchesDueDate = true;
            }
            break;
          case 'Overdue':
            if (isTaskOverdue(task.dueDate)) matchesDueDate = true;
            break;
          case 'Start Today': {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (task.startDate) {
              const startDate = new Date(task.startDate);
              startDate.setHours(0, 0, 0, 0);
              if (startDate <= today) matchesDueDate = true;
            }
            break;
          }
        }

        if (matchesDueDate) break;
      }

      if (!matchesDueDate) return false;
    }

    return true;
  }), [tasks, activeFilters, searchQuery]);

  const sortOptions = [
    { key: 'created_desc', label: 'Planted Date: Newest' },
    { key: 'created_asc', label: 'Planted Date: Oldest' },
    { key: 'priority', label: 'Priority' },
    { key: 'title_asc', label: 'Title (A-Z)' },
    { key: 'due_asc', label: 'Due Date: Soonest' },
    { key: 'due_desc', label: 'Due Date: Latest' },
  ];
  const [activeSort, setActiveSort] = useState('created_desc');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const handleSetActiveSort = (key: string) => {
    setActiveSort(key);
  };

  const sortedTasks = useMemo(() => {
    const priorityOrder: { [key: string]: number } = { 'Key Plant': 0, 'Must-do': 1, 'Could-do': 2, 'Later': 3 };
    const tasksToSort = [...filteredTasks];
    switch (activeSort) {
      case 'due_desc':
        return tasksToSort.sort((a, b) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());
      case 'priority':
        return tasksToSort.sort((a, b) => (priorityOrder[(a.isMIT ? 'Key Plant' : String(a.priority))] ?? 99) - (priorityOrder[(b.isMIT ? 'Key Plant' : String(b.priority))] ?? 99));
      case 'title_asc':
        return tasksToSort.sort((a, b) => a.title.localeCompare(b.title));
      case 'created_desc':
        return tasksToSort.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'created_asc':
        return tasksToSort.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case 'due_asc':
      default:
        return tasksToSort.sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    }
  }, [filteredTasks, activeSort]);

  const FilterHeader = ({ title, icon: Icon, onPress, activeFilters }: {title: string, icon: React.FC<any>, onPress: () => void, activeFilters: string[]}) => (
    <TouchableOpacity style={styles.filterHeader} onPress={onPress}>
      <View style={styles.filterHeaderLeft}>
        <Icon size={20} color="#4CAF50" />
        <Text style={styles.filterHeaderTitle}>{title}</Text>
        {activeFilters.length > 0 && (
          <View style={styles.activeFilterBadge}>
            <Text style={styles.activeFilterText}>{activeFilters.length}</Text>
          </View>
        )}
      </View>
      <ChevronDown size={20} color="#666666" />
    </TouchableOpacity>
  );

  const ListHeader = useCallback(() => (
    <>
      <View style={styles.header}>
        <View style={styles.iconHeader}>
          <ArrowUpRight size={28} color="#4CAF50" />
          <Text style={styles.headerSubtitle}>Tend your plants and watch them grow</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Star size={16} color="#FFD700" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <FilterHeader title="Priority" icon={Star} onPress={() => openFilterModal('priority')} activeFilters={activeFilters.priority} />
          <FilterHeader title="Due Date" icon={Calendar} onPress={() => openFilterModal('dueDate')} activeFilters={activeFilters.dueDate} />
        </View>
        <View style={styles.filterRow}>
          <FilterHeader title="Context" icon={MapPinned} onPress={() => openFilterModal('context')} activeFilters={activeFilters.context} />
          <FilterHeader title="Plot" icon={Tag} onPress={() => openFilterModal('plot')} activeFilters={activeFilters.plot} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks by keyword..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View style={styles.sortSection}>
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.7}
        >
          <SortAsc size={16} color="#666" style={{ marginRight: 8 }} />
          <Text style={styles.sortButtonText}>Sort: {sortOptions.find(o => o.key === activeSort)?.label}</Text>
          <ChevronDown size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </>
  ), [
    searchQuery,
    activeFilters,
    contexts,
    plots,
    activeSort,
    sortOptions,
    openFilterModal,
    setSortModalVisible
  ]);

  const handleFabPress = () => {
    setIsTemplateChooserVisible(true);
  };

  const handleTemplateSelect = (templateData: any | null) => {
    setTaskToEdit(undefined);
    setTemplateInitialData(templateData);
    setIsNewTaskModalVisible(true);
    setIsTemplateChooserVisible(false);
  };
  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggleComplete={toggleTaskComplete}
            onToggleMIT={toggleMIT}
            onDelete={deleteTask}
            onEdit={editTask}
            onPriorityChange={handlePriorityChange}
            updateTask={updateTask}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>{searchQuery ? 'Try a different search term' : 'Add a new task or change filters'}</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleFabPress}
        accessibilityLabel="Create new task"
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <TemplateChooserModal
        visible={isTemplateChooserVisible}
        onClose={() => setIsTemplateChooserVisible(false)}
        onSelect={handleTemplateSelect}
      />

      <NewTaskModal
        visible={isNewTaskModalVisible}
        onClose={() => {
          setIsNewTaskModalVisible(false);
          setTemplateInitialData(null);
        }}
        onAdd={handleAddTask}
        task={taskToEdit}
        initialData={templateInitialData}
        contexts={contexts}
        plots={plots}
        addContext={addContext}
        addPlot={addPlot}
        onTransplantSuccess={handleTransplantSuccess}
      />

      <MultiSelectFilterModal
        visible={filterModal.visible}
        onClose={() => setFilterModal(prev => ({ ...prev, visible: false }))}
        title={filterModal.title}
        options={filterModal.options}
        selectedOptions={filterModal.activeOptions}
        onToggle={(option) => filterModal.filterType && toggleFilter(filterModal.filterType, option)}
        onClear={() => filterModal.filterType && clearFilters(filterModal.filterType)}
      />
      {sortModalVisible && (
        <FilterModal
          visible={sortModalVisible}
          onClose={() => setSortModalVisible(false)}
          title="Sort By"
          options={sortOptions.map(o => o.label)}
          activeOption={sortOptions.find(o => o.key === activeSort)?.label || ''}
          onSelect={(label) => {
            const key = sortOptions.find(o => o.label === label)?.key;
            if (key) handleSetActiveSort(key);
            setSortModalVisible(false);
          }}
        />
      )}

      {showTransplantInfo && (
        <Modal transparent visible animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', maxWidth: 320 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12, textAlign: 'center' }}>
                🌸 Your Seedling has sprouted into a Plant! Watch it grow in the Action Garden!
              </Text>
              <TouchableOpacity onPress={() => setShowTransplantInfo(false)} style={{ marginTop: 16, backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  iconHeader: { flexDirection: 'row', alignItems: 'center' },
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
  headerSubtitle: { fontSize: 13, color: '#666666', marginLeft: 12, flex: 1 },
  searchSection: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F1F1', borderRadius: 10, paddingHorizontal: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#1A1A1A', marginLeft: 8 },
  filtersContainer: { backgroundColor: '#FFFFFF', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  filterHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F8F9FA', borderRadius: 8, marginHorizontal: 4 },
  filterHeaderLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  filterHeaderTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginLeft: 8 },
  activeFilterBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  activeFilterText: { fontSize: 10, color: '#4CAF50', fontWeight: '500' },
  listContent: { padding: 16, paddingTop: 8, paddingBottom: 80 },
  emptyContainer: { flex: 1, paddingTop: 100, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  emptySubtext: { marginTop: 8, fontSize: 15, color: '#666666', textAlign: 'center' },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  sortSection: { backgroundColor: '#FFFFFF', padding: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  sortButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
  sortButtonText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1 },
});