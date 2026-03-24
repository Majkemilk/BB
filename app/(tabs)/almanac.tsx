import { useTasks } from '../../contexts/TaskContext';
import { seedsData } from '../../data/seedsData';
import { BookOpen, Flower, Search } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AlmanacScreen() {
  const { almanac } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSeeds = useMemo(() => {
    return seedsData.filter(seed => 
      seed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seed.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seed.rarity.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#666666';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return '🌱';
      case 'rare': return '🌸';
      case 'epic': return '🌺';
      case 'legendary': return '⭐';
      default: return '🌱';
    }
  };

  const renderSeedItem = ({ item: seed }: { item: any }) => {
    const userSeed = almanac[seed.id];
    const isDiscovered = !!userSeed;
    const growthLevel = userSeed?.growthLevel || 0;
    const isFullyGrown = isDiscovered && growthLevel >= seed.growthGoal;
    
    return (
      <View style={[styles.seedCard, !isDiscovered && styles.undiscoveredCard]}>
        <View style={styles.seedHeader}>
          <View style={styles.rarityContainer}>
            <Text style={styles.rarityIcon}>{getRarityIcon(seed.rarity)}</Text>
            <Text style={[styles.rarityText, { color: getRarityColor(seed.rarity) }]}>
              {seed.rarity.toUpperCase()}
            </Text>
          </View>
          {isDiscovered && (
            <View style={[styles.growthBadge, isFullyGrown && styles.fullyGrownBadge]}>
              <Text style={styles.growthText}>
                {growthLevel}/{seed.growthGoal}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.seedImageContainer}>
          {isDiscovered ? (
            <View style={styles.plantVisual}>
              <Flower size={40} color={getRarityColor(seed.rarity)} />
              <Text style={styles.stageText}>
                {growthLevel < seed.stages.length ? `Stage ${growthLevel + 1}` : 'Mature'}
              </Text>
            </View>
          ) : (
            <View style={styles.undiscoveredVisual}>
              <Text style={styles.questionMark}>?</Text>
            </View>
          )}
        </View>

        <View style={styles.seedInfo}>
          <Text style={[styles.seedName, !isDiscovered && styles.undiscoveredText]}>
            {isDiscovered ? seed.name : 'Undiscovered'}
          </Text>
          {isDiscovered && (
            <Text style={styles.seedDescription} numberOfLines={2}>
              {seed.description}
            </Text>
          )}
        </View>

        {isDiscovered && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(growthLevel / seed.growthGoal) * 100}%`,
                    backgroundColor: getRarityColor(seed.rarity)
                  }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const discoveredCount = Object.keys(almanac).length;
  const totalSeeds = seedsData.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconHeader}>
          <BookOpen size={28} color="#4CAF50" />
          <Text style={styles.headerSubtitle}>Seed Almanac Collection</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {discoveredCount}/{totalSeeds} Discovered
          </Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search seeds..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={filteredSeeds}
        renderItem={renderSeedItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={60} color="#BDBDBD" style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No seeds found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Complete tasks to discover seeds!'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
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
    color: '#333',
    marginLeft: 8,
  },
  gridContent: {
    padding: 8,
    paddingBottom: 20,
  },
  seedCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    minHeight: 180,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  undiscoveredCard: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  growthBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullyGrownBadge: {
    backgroundColor: '#4CAF50',
  },
  growthText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  seedImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 8,
  },
  plantVisual: {
    alignItems: 'center',
  },
  stageText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  undiscoveredVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
  questionMark: {
    fontSize: 24,
    color: '#999999',
    fontWeight: 'bold',
  },
  seedInfo: {
    flex: 1,
  },
  seedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  undiscoveredText: {
    color: '#999999',
  },
  seedDescription: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
}); 