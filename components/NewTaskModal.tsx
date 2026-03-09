import { useAuth } from '@/contexts/AuthContext';
import { Task, useTasks } from '@/contexts/TaskContext';
import { scheduleTaskNotifications } from '@/utils/notifications';
import { ResponsiveUtils } from '@/utils/responsive';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Check, ChevronDown, ChevronUp, Clock, Coffee, Flame, Flower, Leaf, MapPinned, Pencil, PlusCircle, Repeat, Star, Tag, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ContextPlotSelectorModal from './ContextPlotSelectorModal';
import NameTemplateModal from './NameTemplateModal';
import RecurrenceModal from './RecurrenceModal';

// Zakładamy, że ta funkcja jest zakomentowana globalnie
// import { scheduleTaskNotifications } from '@/utils/notifications';

interface NewTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => Promise<void>;
  task?: Task;
  initialData?: Partial<Task>;
  contexts?: string[];
  plots?: string[];
  addContext?: (newContext: string) => void;
  addPlot?: (newPlot: string) => void;
  onTransplantSuccess?: () => void;
  addTemplate?: (templateData: { name: string; taskData: any }) => void;
  modalMode?: 'plant' | 'edit' | 'create' | null;
}

export default function NewTaskModal({ visible, onClose, onAdd, task, initialData, contexts = [], plots = [], addContext, addPlot, onTransplantSuccess, addTemplate: addTemplateProp, modalMode }: NewTaskModalProps) {
  const { addTemplate: addTemplateContext, updateRecurringTask, templates, tasks } = useTasks();
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  const addTemplate = addTemplateProp || addTemplateContext;
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  
  // Detect if we're planting from a seedling template
  const isPlantingFromSeedling = !task && initialData && Object.keys(initialData).length > 2;
  const isEditingSeedling = task && task.id && task.id.startsWith('seedling-');
  const scrollViewRef = useRef<ScrollView>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hasUserInput, setHasUserInput] = useState(false);
  const [isMIT, setIsMIT] = useState(false);
  const [priority, setPriority] = useState<'Must-do' | 'Could-do' | 'Later' | 'Key Plant'>('Could-do');
  const [context, setContext] = useState('');
  const [plot, setPlot] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newContext, setNewContext] = useState('');
  const [newPlot, setNewPlot] = useState('');
  const [newBranchText, setNewBranchText] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchText, setEditingBranchText] = useState('');
  const [localBranches, setLocalBranches] = useState<{ id: string; text: string; isCompleted: boolean }[]>([]);
  const [isNameTemplateModalVisible, setIsNameTemplateModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(undefined);
  const [isRecurrenceModalVisible, setIsRecurrenceModalVisible] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [isContextModalVisible, setIsContextModalVisible] = useState(false);
  const [isPlotModalVisible, setIsPlotModalVisible] = useState(false);
  
  // Animation values
  const descriptionHeight = useRef(new Animated.Value(0)).current;
  const branchesHeight = useRef(new Animated.Value(0)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const branchesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const isEditing = !!task;
      const hasInitialData = !!initialData && !task;
      
      // Always reset form when modal opens with new data
      // Reset user input flag to allow proper form reset
      setHasUserInput(false);
      
      // Title & Description
      setTitle(isEditing ? task!.title : hasInitialData ? initialData!.title || '' : '');
      setDescription(isEditing ? task!.description || '' : hasInitialData ? initialData!.description || '' : '');
      
      // Priority - CHECK initialData.priority for seedlings!
      setPriority(
        isEditing 
          ? task!.priority 
          : hasInitialData && initialData!.priority 
            ? initialData!.priority 
            : 'Could-do'
      );
      
      // isMIT - CHECK initialData.isMIT for seedlings!
      setIsMIT(
        isEditing 
          ? task!.isMIT 
          : hasInitialData && initialData!.isMIT 
            ? initialData!.isMIT 
            : false
      );
      
      // Context - CHECK initialData.context for seedlings!
      setContext(
        isEditing
          ? task!.context || ''
          : hasInitialData && initialData!.context
            ? initialData!.context
            : ''
      );
      
      // Plot - CHECK initialData.plot for seedlings!
      setPlot(
        isEditing
          ? task!.plot || ''
          : hasInitialData && initialData!.plot
            ? initialData!.plot
            : ''
      );
      
      setStartDate(isEditing && task!.startDate ? new Date(task!.startDate) : new Date());
      setDueDate(isEditing && task!.dueDate ? new Date(task!.dueDate) : new Date());
      setNewContext('');
      setNewPlot('');
      setNewBranchText('');
      setEditingBranchId(null);
      setEditingBranchText('');
      const fromTemplateBranches = (!isEditing && initialData?.branches && Array.isArray(initialData.branches))
        ? [...initialData.branches as any]
        : [];
      setLocalBranches(isEditing && task!.branches ? [...task!.branches] : fromTemplateBranches);
      setRecurrence(task?.recurrence || initialData?.recurrence || undefined);
      
      // Reset user input flag when modal closes
      if (!visible) {
        setHasUserInput(false);
      }
      
      // Scroll to top when modal opens
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 100);
      
      // Reset animations
      descriptionHeight.setValue(0);
      branchesHeight.setValue(0);
      descriptionOpacity.setValue(0);
      branchesOpacity.setValue(0);
    }
  }, [visible, task, initialData]);
  
  // Animate description section
  useEffect(() => {
    Animated.timing(descriptionOpacity, {
      toValue: showDescription ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showDescription, descriptionOpacity]);
  
  // Animate branches section
  useEffect(() => {
    Animated.timing(branchesOpacity, {
      toValue: showBranches ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showBranches, branchesOpacity]); 
  
  // --- Local branch handlers ---
  const handleAddBranch = () => {
    if (newBranchText.trim()) {
      const branchLimit = 3;
      
      if (isProfileLoaded && !isPremium && localBranches.length >= branchLimit) {
        Alert.alert(
          'Upgrade to Premium',
          `You've reached the limit of ${branchLimit} branches per task. Upgrade to Premium for unlimited subtasks!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              // Close modal and navigate to premium
              onClose();
              setTimeout(() => {
                router.push('/(tabs)/(settings)/premium');
              }, 100);
            }}
          ]
        );
        return;
      }
      
      setLocalBranches(prev => [
        ...prev,
        { id: Date.now().toString(), text: newBranchText.trim(), isCompleted: false }
      ]);
      setNewBranchText('');
    }
  };
  const handleToggleBranch = (branchId: string) => {
    setLocalBranches(prev => prev.map(branch =>
      branch.id === branchId ? { ...branch, isCompleted: !branch.isCompleted } : branch
    ));
  };
  const handleDeleteBranch = (branchId: string) => {
    setLocalBranches(prev => prev.filter(branch => branch.id !== branchId));
  };
  const handleUpdateBranch = (branchId: string, newText: string) => {
    setLocalBranches(prev => prev.map(branch =>
      branch.id === branchId ? { ...branch, text: newText } : branch
    ));
  };

  const priorities = [
    { id: 'Must-do', color: '#FF5252', icon: Star },
    { id: 'Could-do', color: '#FFD740', icon: Clock },
    { id: 'Later', color: '#448AFF', icon: Coffee },
  ];
  
  const validateDates = (startDate: Date, dueDate: Date) => {
    if (startDate > dueDate) {
      return { valid: false, error: 'Start date cannot be after due date' };
    }
    return { valid: true };
  };
  
  const handleAdd = async () => {
    if (title.trim() === '') {
      return;
    }
    
    // Prevent multiple calls while saving
    if (isSaving) {
      return;
    }
    
    // 🔒 CRITICAL SECURITY: Check premium access for Seedling creation
    if (modalMode === 'create' && isProfileLoaded && !isPremium) {
      Alert.alert(
        'Premium Feature',
        'Task templates (Seedlings) are a Premium feature. Upgrade to create reusable task templates!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            onClose();
            setTimeout(() => {
              router.push('/(tabs)/(settings)/premium');
            }, 100);
          }}
        ]
      );
      return;
    }
    
    setIsSaving(true);
    
    // Check task limit for non-premium users BEFORE creating task
    const taskLimit = 30;
    const activeTasks = tasks.filter(task => !task.isCompleted);
    
    if (isProfileLoaded && !isPremium && activeTasks.length >= taskLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `You've reached the limit of ${taskLimit} active tasks. Upgrade to Premium for unlimited tasks!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // Close modal and navigate to settings (with back button)
            onClose();
            setTimeout(() => {
              router.push('/(tabs)/(settings)');
            }, 100);
          }}
        ]
      );
      setIsSaving(false);
      return;
    }
    
    const validation = validateDates(startDate, dueDate);
    if (!validation.valid) {
      setIsSaving(false);
      return;
    }
    
    // Haptic feedback for important actions
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // If editing a recurring task (but NOT a seedling template), show simplified option
    if (task && !isEditingSeedling && (task.recurrence || task.parentTaskId || task.isRecurringTemplate)) {
      Alert.alert(
        'Edit Recurring Task',
        'This will update only this plant and remove its recurring pattern. All future plants in the series will be deleted.\n\n💡 Tip: Create a new recurring task if you want to repeat this task in the future.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsSaving(false)
          },
          {
            text: 'Update this Plant',
            onPress: async () => {
              try {
                await updateRecurringTask(task.id, updates);
                onClose();
              } finally {
                setIsSaving(false);
              }
            },
          },
        ]
      );
      return;
    }
    // Not recurring, normal save
    const taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'> = {
      title: title.trim() || '',
      description: description.trim(),
      priority: (isMIT ? 'Key Plant' : priority) as Task['priority'],
      context,
      plot,
      startDate,
      dueDate,
      isMIT,
      branches: localBranches,
      recurrence,
    };
    
    // Schedule notifications for the task
    if (dueDate) {
      try {
        await scheduleTaskNotifications(
          task?.id || Date.now().toString(),
          taskData.title,
          taskData.priority,
          dueDate
        );
      } catch (error) {
        console.error('Failed to schedule notifications:', error);
      }
    }
    try {
      await onAdd(taskData);
      
      // Only show success messages for non-cultivate scenarios
      // Cultivate success message is handled in handleTaskAdd
      if (initialData && !task && onTransplantSuccess) {
        onTransplantSuccess();
      } else if (!task && !initialData && !isEditingSeedling && modalMode === 'create') {
        // Seedling template creation success
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Success', '🌸 Your Seedling template has grown into a Plant! Ready for action in the Action Garden!');
      } else if (!task && !initialData && !isEditingSeedling && !onTransplantSuccess && modalMode === 'create') {
        // Direct task creation success (not from wildflower, not from replant, not from cultivate)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Success', '🌱 Your new Plant is growing in the Action Garden! Keep an eye on your task!');
      } else if (isEditingSeedling) {
        // Edit seedling template success - handled by addTemplate in TaskContext
        // No additional success message needed here
      } else if (task && !isEditingSeedling) {
        // Edit task success
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Success', '🌸 Your Plant has been tended to! It\'s looking healthier than ever!');
      }
      
      // Close modal after successful operation
      onClose();
    } catch (error) {
      console.error('Error in handleAdd:', error);
      Alert.alert('Error', 'Failed to create your task. Please try again.');
      // Don't re-throw error to prevent modal from staying open
      // The error has already been logged and shown to user
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      // Format with weekday
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // --- Save as Seedling logic ---
  const handleSaveAsSeedling = () => {
    setIsNameTemplateModalVisible(true);
  };

  const handleNameTemplateSave = (name: string) => {
    if (!name || !name.trim()) return;
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority: isMIT ? 'Key Plant' : priority,
      context,
      plot,
      isMIT,
      branches: localBranches.map(b => ({ ...b, isCompleted: false })),
      recurrence,
    };
    addTemplate({ name: name.trim(), taskData });
    setIsNameTemplateModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', `🌿 Your Plant has been saved as a Seedling template! Ready to grow again!`);
    onClose(); // Close the main modal after saving seedling
  };

  // --- Recurrence summary helper ---
  function getRecurrenceSummary(rec: Task['recurrence']) {
    if (!rec) return 'Does not repeat';
    let base = 'Repeats';
    switch (rec.type) {
      case 'daily':
        return `${base} every ${rec.interval > 1 ? rec.interval + ' days' : 'day'}`;
      case 'weekly':
        const days = (rec.daysOfWeek || []).map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ');
        return `${base} every ${rec.interval > 1 ? rec.interval + ' weeks' : 'week'}${days ? ' on ' + days : ''}`;
      case 'monthly':
        return `${base} every ${rec.interval > 1 ? rec.interval + ' months' : 'month'}${rec.dayOfMonth ? ' on day ' + rec.dayOfMonth : ''}`;
      case 'yearly':
        return `${base} every ${rec.interval > 1 ? rec.interval + ' years' : 'year'}`;
      default:
        return 'Does not repeat';
    }
  }
  
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
        <ScrollView ref={scrollViewRef} style={[styles.modalView, { 
          width: ResponsiveUtils.getModalDimensions().width,
          maxWidth: ResponsiveUtils.getModalDimensions().maxWidth,
          height: ResponsiveUtils.getModalDimensions().height
        }]}>
          <View style={styles.modalHeader}>
            <View style={styles.titleContainer}>
              {isEditingSeedling ? (
                <Leaf size={28} color="#388E3C" strokeWidth={1.5} />
              ) : isPlantingFromSeedling ? (
                <Leaf size={28} color="#4CAF50" strokeWidth={1.5} />
              ) : task ? (
                <Pencil size={28} color="#666" strokeWidth={1.5} />
              ) : initialData ? (
                <ArrowUpRight size={28} color="#4CAF50" strokeWidth={1.5} />
              ) : modalMode === 'create' ? (
                <Leaf size={28} color="#4CAF50" strokeWidth={1.5} />
              ) : (
                <Flower size={28} color="#4CAF50" strokeWidth={1.5} />
              )}
              <Text style={[styles.modalTitle, { color: isEditingSeedling ? '#4CAF50' : '#4CAF50' }]}> 
                {isEditingSeedling ? 'Tend Seedling' : isPlantingFromSeedling ? 'Plant from Seedling' : task ? 'Tend your Plant' : initialData ? 'Cultivate into Plant' : modalMode === 'create' ? 'Grow a New Seedling' : 'Grow a New Plant'}
              </Text>
            </View>
            {isEditingSeedling ? (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>update your template</Text>
            ) : isPlantingFromSeedling ? (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>create task from template</Text>
            ) : task ? (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>update your task</Text>
            ) : initialData ? (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>transform idea into task</Text>
            ) : modalMode === 'create' ? (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>create new task template</Text>
            ) : (
              <Text style={[styles.modalSubtitle, { marginLeft: 40 }]}>create new task</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inlineLabelRow}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.titleInputInline}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  setHasUserInput(true);
                }}
                placeholder="What do you need to do?"
                autoFocus={!task && !initialData}
                returnKeyType="next"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowDescription(!showDescription)}
              activeOpacity={0.7}
              accessibilityLabel={showDescription ? "Collapse description" : "Expand description"}
              accessibilityRole="button"
              accessibilityHint="Toggle description field visibility"
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.inputLabel}>Description </Text>
                <Text style={styles.optionalText}>(optional)</Text>
              </View>
              <View style={styles.chevronButton}>
                {showDescription ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
              </View>
            </TouchableOpacity>
            
            {showDescription && (
              <Animated.View style={{ opacity: descriptionOpacity }}>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    setHasUserInput(true);
                  }}
                  placeholder="Add details about your task"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Animated.View>
            )}

            {/* --- BRANCHES SECTION --- */}
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowBranches(!showBranches)}
              activeOpacity={0.7}
              accessibilityLabel={showBranches ? "Collapse branches section" : "Expand branches section"}
              accessibilityRole="button"
              accessibilityHint={`Manage subtasks. Currently ${localBranches.length} branch${localBranches.length !== 1 ? 'es' : ''}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.inputLabel}>Branches </Text>
                <Text style={styles.optionalText}>(subtasks - optional) </Text>
                <Text style={styles.branchesCount}>{localBranches.length}</Text>
              </View>
              <View style={styles.chevronButton}>
                {showBranches ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
              </View>
            </TouchableOpacity>
            
            {showBranches && (
              <Animated.View style={{ opacity: branchesOpacity }}>
              <View style={styles.branchesInputRow}>
              <TextInput
                style={[styles.titleInput, { flex: 1, marginBottom: 0 }]}
                value={newBranchText}
                onChangeText={setNewBranchText}
                placeholder="Add a new branch (subtask)"
                returnKeyType="done"
                onSubmitEditing={handleAddBranch}
              />
              <TouchableOpacity
                style={styles.addBranchButton}
                onPress={handleAddBranch}
                accessibilityLabel="Add branch"
                accessibilityRole="button"
              >
                <PlusCircle size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            {localBranches.length > 0 && (
              <View style={styles.branchesList}>
                {localBranches.map(branch => (
                  <View key={branch.id} style={styles.branchRow}>
                    <TouchableOpacity
                      style={styles.branchCheckbox}
                      onPress={() => handleToggleBranch(branch.id)}
                    >
                      <View style={[styles.branchCircle, branch.isCompleted && styles.branchCircleCompleted]}>
                        {branch.isCompleted && <Check size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                    {editingBranchId === branch.id ? (
                      <TextInput
                        style={[styles.branchText, styles.branchTextInput]}
                        value={editingBranchText}
                        onChangeText={setEditingBranchText}
                        autoFocus
                        onBlur={() => {
                          setEditingBranchId(null);
                          setEditingBranchText('');
                        }}
                        onSubmitEditing={() => {
                          if (editingBranchText.trim()) {
                            handleUpdateBranch(branch.id, editingBranchText.trim());
                          }
                          setEditingBranchId(null);
                          setEditingBranchText('');
                        }}
                      />
                    ) : (
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onLongPress={() => {
                          setEditingBranchId(branch.id);
                          setEditingBranchText(branch.text);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.branchText, branch.isCompleted && styles.branchTextCompleted]}
                          numberOfLines={2}
                        >
                          {branch.text}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.branchDeleteButton}
                      onPress={() => handleDeleteBranch(branch.id)}
                    >
                      <Trash2 size={18} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
              </Animated.View>
            )}
            {/* --- END BRANCHES SECTION --- */}

            {/* --- DATES AND REPEAT ROW --- */}
            <View style={styles.datesAndRepeatRow}>
              {/* Repeat */}
              <TouchableOpacity
                style={[
                  styles.repeatColumnButton,
                  (!isProfileLoaded || !isPremium) && styles.premiumFeatureDisabled
                ]}
                onPress={() => {
                  if (isProfileLoaded && !isPremium) {
                    Alert.alert(
                      '🌟 Premium Feature',
                      'Advanced recurring tasks help you automate your workflow. Upgrade to Premium to set up daily, weekly, monthly, and custom recurrence patterns!',
                      [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Unlock Premium', onPress: () => {
                          onClose();
                          setTimeout(() => {
                            router.push('/(tabs)/(settings)/premium');
                          }, 100);
                        }}
                      ]
                    );
                    return;
                  }
                  setIsRecurrenceModalVisible(true);
                }}
                activeOpacity={0.7}
                accessibilityLabel="Set recurrence"
                accessibilityRole="button"
                accessibilityHint={recurrence ? `Currently repeats ${getRecurrenceSummary(recurrence)}` : 'Does not repeat'}
              >
                <View style={styles.dateLabelRow}>
                  <Repeat size={16} color={(isProfileLoaded && isPremium) ? "#4CAF50" : "#999"} style={{ marginRight: 6 }} />
                  <Text style={[styles.inputLabel, (!isProfileLoaded || !isPremium) && styles.premiumFeatureText]}>
                    Repeat {(!isProfileLoaded || !isPremium) && '(Premium)'}
                  </Text>
                </View>
                <View style={styles.repeatValueContainer}>
                  <Text style={[styles.repeatValueText, (!isProfileLoaded || !isPremium) && styles.premiumFeatureText]} numberOfLines={1}>
                    {recurrence ? getRecurrenceSummary(recurrence).replace('Repeats ', '') : 'None'}
                  </Text>
                  <ChevronDown size={14} color={(isProfileLoaded && isPremium) ? "#666" : "#999"} />
                </View>
              </TouchableOpacity>

              {/* Start Date */}
              <View style={styles.dateColumn}>
                <View style={styles.dateLabelRow}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📅</Text>
                  <Text style={styles.inputLabel}>Start Date</Text>
                </View>
                <TouchableOpacity
                  style={styles.dateButtonCompact}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                  accessibilityLabel="Set start date"
                  accessibilityRole="button"
                  accessibilityValue={{ text: formatDate(startDate) }}
                >
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>
              
              {/* Due Date */}
              <View style={styles.dateColumn}>
                <View style={styles.dateLabelRow}>
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📅</Text>
                  <Text style={styles.inputLabel}>Due Date</Text>
                </View>
                <TouchableOpacity
                  style={styles.dateButtonCompact}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                  accessibilityLabel="Set due date"
                  accessibilityRole="button"
                  accessibilityValue={{ text: formatDate(dueDate) }}
                >
                  <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
                minimumDate={startDate}
              />
            )}
            
            <Text style={styles.inputLabel}>Priority</Text>
            
            {/* Key Plant Button - Compact version above priorities */}
            <TouchableOpacity
              style={[
                styles.keyPlantCompactButton,
                isMIT && styles.keyPlantCompactButtonActive
              ]}
              onPress={() => {
                setIsMIT(!isMIT);
                if (!isMIT) setPriority('Must-do');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Mark as Key Plant"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isMIT }}
              accessibilityHint="Most important task of the day"
            >
              <View style={styles.keyPlantCompactContent}>
                <Flame size={20} color="#FF5252" />
                <Text style={[
                  styles.keyPlantCompactText,
                  isMIT && styles.keyPlantCompactTextActive
                ]}>
                  Key Plant
                </Text>
                <Text style={[
                  styles.keyPlantCompactDesc,
                  isMIT && styles.keyPlantCompactDescActive
                ]}>
                  (first to water)
                </Text>
              </View>
              {isMIT && <Check size={18} color="#FF5252" />}
            </TouchableOpacity>
            
            {!isMIT && (
              <View style={styles.priorityContainer}>
                {priorities.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.priorityButton,
                      priority === item.id && { backgroundColor: item.color + '20', borderColor: item.color }
                    ]}
                    onPress={() => setPriority(item.id as 'Must-do' | 'Could-do' | 'Later' | 'Key Plant')}
                    activeOpacity={0.7}
                  >
                    <item.icon size={16} color={item.color} />
                    <Text 
                      style={[
                        styles.priorityText,
                        priority === item.id && { color: item.color, fontWeight: '600' }
                      ]}
                    >
                      {item.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.selectorButton, { marginBottom: 16 }]}
              onPress={() => setIsContextModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Select context"
              accessibilityRole="button"
              accessibilityValue={{ text: context || 'None' }}
            >
              <View style={styles.selectorLeft}>
                <MapPinned size={18} color="#666" style={{ marginRight: 8 }} />
                <Text style={styles.selectorLabel}>Context</Text>
              </View>
              <View style={styles.selectorRight}>
                {context ? (
                  <>
                    <Text style={styles.selectorValue} numberOfLines={1} ellipsizeMode="tail">
                      {context}
                    </Text>
                    <TouchableOpacity 
                      onPress={(e) => { 
                        e.stopPropagation(); 
                        setContext(''); 
                      }}
                      style={{ marginLeft: 8, padding: 4 }}
                    >
                      <X size={16} color="#FF5252" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>None</Text>
                )}
                <ChevronDown size={16} color="#666" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.selectorButton, { marginBottom: 16 }]}
              onPress={() => setIsPlotModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Select plot"
              accessibilityRole="button"
              accessibilityValue={{ text: plot || 'None' }}
            >
              <View style={styles.selectorLeft}>
                <Tag size={18} color="#666" style={{ marginRight: 8 }} />
                <Text style={styles.selectorLabel}>Plot</Text>
              </View>
              <View style={styles.selectorRight}>
                {plot ? (
                  <>
                    <Text style={styles.selectorValue} numberOfLines={1} ellipsizeMode="tail">
                      {plot}
                    </Text>
                    <TouchableOpacity 
                      onPress={(e) => { 
                        e.stopPropagation(); 
                        setPlot(''); 
                      }}
                      style={{ marginLeft: 8, padding: 4 }}
                    >
                      <X size={16} color="#FF5252" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>None</Text>
                )}
                <ChevronDown size={16} color="#666" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalFooter}>
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
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
                accessibilityLabel={isEditingSeedling ? 'Update seedling' : task ? 'Save plant' : initialData ? 'Cultivate wildflower' : 'Plant new task'}
                accessibilityRole="button"
                accessibilityState={{ disabled: title.trim() === '' || isSaving }}
              >
                <Text style={styles.addButtonText}>
                  {isSaving ? 'Saving...' : isEditingSeedling ? 'Tend' : task ? 'Tend' : initialData ? 'Cultivate' : modalMode === 'create' ? 'Grow' : 'Grow'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Save as Seedling Button - Secondary row (hidden when editing seedling or in create mode) */}
            {!isEditingSeedling && modalMode !== 'create' && (
              <TouchableOpacity
                style={styles.saveSeedlingButtonFull}
                onPress={handleSaveAsSeedling}
                accessibilityLabel="Plant as Seedling (template)"
              >
                <Leaf size={18} color="#388E3C" style={{ marginRight: 6 }} />
                <Text style={{ color: '#388E3C', fontWeight: '600', fontSize: 14 }}>Plant as Seedling (template)</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NameTemplateModal
        visible={isNameTemplateModalVisible}
        onClose={() => setIsNameTemplateModalVisible(false)}
        onSave={handleNameTemplateSave}
        suggestedName={title.trim()}
        existingNames={templates.map(t => t.name)}
        previewData={{
          hasPriority: true,
          hasContext: !!context,
          hasPlot: !!plot,
          branchCount: localBranches.length,
          hasRecurrence: !!recurrence,
          hasDescription: !!description.trim(),
        }}
      />
      {/* Recurrence Modal */}
      <RecurrenceModal
        visible={isRecurrenceModalVisible}
        onClose={() => setIsRecurrenceModalVisible(false)}
        onSave={(config: any) => setRecurrence(config)}
        initialConfig={recurrence}
      />
      {/* Context Selector Modal */}
      <ContextPlotSelectorModal
        visible={isContextModalVisible}
        onClose={() => setIsContextModalVisible(false)}
        title="Context"
        options={contexts}
        selectedValue={context}
        onSelect={setContext}
        onAddNew={addContext}
        placeholder="Search contexts..."
      />
      {/* Plot Selector Modal */}
      <ContextPlotSelectorModal
        visible={isPlotModalVisible}
        onClose={() => setIsPlotModalVisible(false)}
        title="Plot"
        options={plots}
        selectedValue={plot}
        onSelect={setPlot}
        onAddNew={addPlot}
        placeholder="Search plots..."
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: ResponsiveUtils.getResponsiveValue(20, 24, 28),
    borderTopRightRadius: ResponsiveUtils.getResponsiveValue(20, 24, 28),
    paddingTop: ResponsiveUtils.getResponsiveSpacing().md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
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
    marginBottom: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    marginLeft: 40,
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
  inputLabelSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 0,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    fontStyle: 'italic',
  },
  branchesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
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
  titleInputInline: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    height: 36,
    textAlign: 'left',
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
  dateButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  dateText: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  keyPlantCompactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 36,
  },
  keyPlantCompactButtonActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: '#FF5252',
  },
  keyPlantCompactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyPlantCompactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  keyPlantCompactTextActive: {
    color: '#FF5252',
    fontWeight: '600',
  },
  keyPlantCompactDesc: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
  keyPlantCompactDescActive: {
    color: '#FF8A80',
  },
  mitGardenButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mitGardenButtonActive: {
    backgroundColor: '#FF5252',
    borderColor: '#FF5252',
  },
  mitGardenContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mitIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sproutIcon: {
    position: 'absolute',
    bottom: 0,
    right: -4,
  },
  mitTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  mitGardenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
    marginBottom: 4,
  },
  mitGardenTitleActive: {
    color: '#FFFFFF',
  },
  mitGardenDescription: {
    fontSize: 12,
    color: '#666666',
  },
  mitGardenDescriptionActive: {
    color: '#FFFFFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  priorityText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666666',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chevronButton: {
    backgroundColor: '#F8F9FA',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  datesAndRepeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    // Responsive: Allow wrapping on very small screens
    flexWrap: Dimensions.get('window').width < 350 ? 'wrap' : 'nowrap',
  },
  dateColumn: {
    flex: 1,
    // Responsive: Minimum width for small screens
    minWidth: Dimensions.get('window').width < 350 ? '47%' : 100,
  },
  repeatColumnButton: {
    flex: 1,
    // Responsive: Minimum width for small screens
    minWidth: Dimensions.get('window').width < 350 ? '100%' : 100,
  },
  repeatValueContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  repeatValueText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  dateButtonCompact: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    height: 36,
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  addButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  branchesInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  branchesList: {
    marginBottom: 16,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchCheckbox: {
    padding: 8,
  },
  branchCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  branchText: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    color: '#1A1A1A',
  },
  branchTextCompleted: {
    textDecorationLine: 'line-through',
  },
  branchTextInput: {
    padding: 8,
  },
  addBranchButton: {
    padding: 8,
  },
  branchDeleteButton: {
    padding: 8,
  },
  saveSeedlingButtonFull: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  premiumFeatureDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  premiumFeatureText: {
    color: '#999',
  },
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  recurrenceText: {
    fontSize: 16,
    color: '#388E3C',
    fontWeight: '500',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    height: 36,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  selectorValue: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    maxWidth: 150,
  },
  selectorPlaceholder: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
});

export { NewTaskModal };

