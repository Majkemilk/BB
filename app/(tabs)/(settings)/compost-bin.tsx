import { ArchivedWildflowerItem } from '@/components/ArchivedWildflowerItem';
import { FilterModal } from '@/components/FilterModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Wildflower } from '@/contexts/TaskContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Archive, CircleCheck as CheckCircle2, LucideIcon, RefreshCw, Search, SortAsc, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const sortOptions = [
  { key: 'archived_desc', label: 'Archived: Newest' },
  { key: 'archived_asc', label: 'Archived: Oldest' },
  { key: 'title_asc', label: 'Title (A-Z)' },
  { key: 'title_desc', label: 'Title (Z-A)' },
];

export default function CompostBinScreen() {
  const { archivedWildflowers, restoreWildflower, deleteWildflowerPermanently, wildflowers } = useTasks();
  const { userProfile, userProfileLoading } = useAuth();
  const router = useRouter();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState(sortOptions[0].key);
  const [filterModal, setFilterModal] = useState({ visible: false, title: '', options: [] as string[], activeOption: '', onSelect: (option: string) => {} });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const openFilterModal = (type: 'sort') => {
    if (type === 'sort') {
      setFilterModal({
        visible: true,
        title: 'Sort By',
        options: sortOptions.map(o => o.label),
        activeOption: sortOptions.find(o => o.key === activeSort)?.label || '',
        onSelect: (label) => {
          const key = sortOptions.find(o => o.label === label)?.key;
          if (key) setActiveSort(key);
        }
      });
    }
  };

  const filteredAndSortedWildflowers = useMemo(() => {
    let filtered = archivedWildflowers.filter(wildflower => {
      const matchesSearch = searchQuery.trim() === '' ||
        wildflower.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wildflower.description && wildflower.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });

    switch (activeSort) {
      case 'archived_desc':
        return filtered.sort((a, b) => {
          const dateA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
          const dateB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'archived_asc':
        return filtered.sort((a, b) => {
          const dateA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
          const dateB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
          return dateA - dateB;
        });
      case 'title_asc':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filtered;
    }
  }, [archivedWildflowers, searchQuery, activeSort]);

  const FilterHeader = ({ title, icon: Icon, onPress, activeFilter }: { title: string, icon: LucideIcon, onPress: () => void, activeFilter: string }) => (
    <TouchableOpacity style={styles.filterHeader} onPress={onPress}>
      <View style={styles.filterHeaderLeft}>
        <Icon size={18} color="#666" />
        <Text style={styles.filterHeaderTitle}>{title}</Text>
      </View>
      <Text style={styles.activeFilterText}>{activeFilter}</Text>
    </TouchableOpacity>
  );

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedIds([]);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleRestoreSelected = () => {
    // Validate selectedIds
    if (!selectedIds || selectedIds.length === 0) {
      Alert.alert('No Selection', 'Please select items to restore first.');
      return;
    }

    const wildflowerLimit = 30;
    const wouldExceedLimit = wildflowers.length + selectedIds.length > wildflowerLimit;
    
    if (isProfileLoaded && !isPremium && wouldExceedLimit) {
      Alert.alert(
        'Upgrade to Premium',
        `Restoring ${selectedIds.length} wildflowers would exceed the limit of ${wildflowerLimit} active wildflowers. Upgrade to Premium for unlimited ideas!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
        ]
      );
      return;
    }
    
    Alert.alert(
      '🌱 Restore from Compost Bin?',
      `These ${selectedIds.length} wildflower${selectedIds.length === 1 ? '' : 's'} will be restored to your active garden.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              let successCount = 0;
              let errorCount = 0;
              const errors: string[] = [];

              // Process each selected item with individual error handling
              for (const id of selectedIds) {
                try {
                  await restoreWildflower(id, () => router.push('/(tabs)/(settings)/premium'), true); // silent = true
                  successCount++;
                } catch (error) {
                  console.error(`Error restoring wildflower ${id}:`, error);
                  errorCount++;
                  errors.push(`Failed to restore item ${id}`);
                }
              }

              // Reset state regardless of success/failure
              setSelectedIds([]);
              setSelectMode(false);

              // Show appropriate success/error message
              if (successCount > 0 && errorCount === 0) {
                // All successful
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Success', `🌸 ${successCount} wildflower${successCount === 1 ? ' has' : 's have'} been restored! They're blooming again in the Idea Meadow!`);
              } else if (successCount > 0 && errorCount > 0) {
                // Partial success
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Partial Success', `🌸 ${successCount} wildflower${successCount === 1 ? ' has' : 's have'} been restored! ${errorCount} failed to restore.`);
              } else {
                // All failed
                Alert.alert('Error', `Failed to restore ${errorCount} wildflower${errorCount === 1 ? '' : 's'}. Please try again.`);
              }
            } catch (error) {
              console.error('Error in handleRestoreSelected:', error);
              Alert.alert('Error', 'Failed to restore selected items. Please try again.');
              
              // Reset state on error
              setSelectedIds([]);
              setSelectMode(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Ideas Permanently',
      `Are you sure you want to permanently delete ${selectedIds.length} ${selectedIds.length === 1 ? 'idea' : 'ideas'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              let successCount = 0;
              let errorCount = 0;
              const errors: string[] = [];

              // Process each selected item with individual error handling
              for (const id of selectedIds) {
                try {
                  await deleteWildflowerPermanently(id, true); // silent = true
                  successCount++;
                } catch (error) {
                  console.error(`Error deleting wildflower ${id}:`, error);
                  errorCount++;
                  errors.push(`Failed to delete wildflower ${id}`);
                }
              }

              // Reset state regardless of success/failure
              setSelectedIds([]);
              setSelectMode(false);

              // Show appropriate success/error message
              if (successCount > 0 && errorCount === 0) {
                // All successful
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (hapticError) {
                  console.log('Haptic feedback not available:', hapticError);
                }
                Alert.alert('Success', `🌿 ${successCount} wildflower${successCount === 1 ? ' has' : 's have'} been permanently cleared! Your garden now has more space for fresh ideas!`);
              } else if (successCount > 0 && errorCount > 0) {
                // Partial success
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (hapticError) {
                  console.log('Haptic feedback not available:', hapticError);
                }
                Alert.alert('Partial Success', `🌿 ${successCount} wildflower${successCount === 1 ? ' has' : 's have'} been permanently cleared! ${errorCount} failed to delete.`);
              } else {
                // All failed
                Alert.alert('Error', `Failed to delete ${errorCount} wildflower${errorCount === 1 ? '' : 's'}. Please try again.`);
              }
            } catch (error) {
              console.error('Error in handleDeleteSelected:', error);
              Alert.alert('Error', 'Failed to delete selected ideas. Please try again.');
              
              // Reset state on error
              setSelectedIds([]);
              setSelectMode(false);
            }
          },
        },
      ]
    );
  };

  const allVisibleSelected = filteredAndSortedWildflowers.length > 0 &&
    filteredAndSortedWildflowers.every(item => selectedIds.includes(item.id));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredAndSortedWildflowers.some(item => item.id === id)));
    } else {
      setSelectedIds(prev => [
        ...prev,
        ...filteredAndSortedWildflowers
          .map(item => item.id)
          .filter(id => !prev.includes(id))
      ]);
    }
  };

  const renderItem = ({ item }: { item: Wildflower }) => {
    const handleRestore = async (id: string) => {
      try {
        // Check premium status before restore
        const isPremium = userProfile?.is_premium ?? false;
        const isProfileLoaded = !userProfileLoading && userProfile !== null;
        
        await restoreWildflower(id, () => router.push('/(tabs)/(settings)/premium'));
      } catch (error) {
        console.error('Error in renderItem handleRestore:', error);
        Alert.alert('Error', 'Failed to restore your idea. Please try again.');
      }
    };

    const handleDelete = async (id: string) => {
      try {
        await deleteWildflowerPermanently(id);
      } catch (error) {
        console.error('Error in renderItem handleDelete:', error);
        Alert.alert('Error', 'Failed to delete your idea. Please try again.');
      }
    };

    return (
      <ArchivedWildflowerItem
        wildflower={item}
        onRestore={handleRestore}
        onDelete={handleDelete}
        selectMode={selectMode}
        selected={selectedIds.includes(item.id)}
        onSelect={() => toggleSelectItem(item.id)}
      />
    );
  };

  const ListHeaderComponent = () => (
    <>
      <View style={styles.filtersGrid}>
        <View style={styles.filterRow}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <FilterHeader
              title="Sort By"
              icon={SortAsc}
              onPress={() => openFilterModal('sort')}
              activeFilter={sortOptions.find(o => o.key === activeSort)?.label || ''}
            />
            <TouchableOpacity
              style={styles.selectButton}
              onPress={toggleSelectMode}
            >
              <Text style={{ color: selectMode ? '#D32F2F' : '#4CAF50', fontWeight: 'bold', fontSize: 15 }}>
                {selectMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {selectMode && (
        <View style={styles.unifiedActionBar}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
            disabled={filteredAndSortedWildflowers.length === 0}
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
              style={[styles.restoreButton, selectedIds.length === 0 && styles.actionButtonDisabled]}
              onPress={handleRestoreSelected}
              disabled={selectedIds.length === 0}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={selectedIds.length === 0 ? '#CCC' : '#4CAF50'} />
              <Text style={[styles.actionText, { color: selectedIds.length === 0 ? '#CCC' : '#4CAF50' }]}>
                Restore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, selectedIds.length === 0 && styles.actionButtonDisabled]}
              onPress={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={selectedIds.length === 0 ? '#CCC' : '#FF5252'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Archive size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>Compost Bin is Empty</Text>
      <Text style={styles.emptyDescription}>
        Composted wildflowers will appear here.{'\n'}
        You can restore them or delete them permanently.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconHeader}>
          <Archive size={28} color="#4CAF50" />
          <Text style={styles.headerSubtitle}>Archived Ideas & Discarded Concepts</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in Compost Bin..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={filteredAndSortedWildflowers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FilterModal
        visible={filterModal.visible}
        onClose={() => setFilterModal({ ...filterModal, visible: false })}
        title={filterModal.title}
        options={filterModal.options}
        activeOption={filterModal.activeOption}
        onSelect={(option) => {
          filterModal.onSelect(option);
          setFilterModal({ ...filterModal, visible: false });
        }}
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
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filtersGrid: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterHeaderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
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
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

