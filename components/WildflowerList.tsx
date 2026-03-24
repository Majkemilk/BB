import type { Wildflower } from '../types/wildflower';
import React, { memo, useCallback } from 'react';
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native';
import { WildflowerItem } from './WildflowerItem';

interface WildflowerListProps {
  wildflowers: Wildflower[];
  onCompost: (id: string) => void; // Changed from onDelete to onCompost
  onEdit: (wildflower: Wildflower) => void;
  onNurture: (wildflower: Wildflower) => void;
}

const keyExtractor = (item: Wildflower) => item.id;

const ItemSeparator = memo(() => <View style={styles.separator} />);

export const WildflowerList = memo(({ 
  wildflowers,
  onCompost,
  onEdit,
  onNurture
}: WildflowerListProps) => {
  const renderItem: ListRenderItem<Wildflower> = useCallback(({ item }) => (
    <WildflowerItem
      wildflower={item}
      onCompost={onCompost}
      onEdit={onEdit}
      onNurture={onNurture}
    />
  ), [onCompost, onEdit, onNurture]);

  return (
    <FlatList
      data={wildflowers}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
    />
  );
});

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },
});

WildflowerList.displayName = 'WildflowerList';