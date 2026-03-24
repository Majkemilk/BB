import { ResponsiveUtils } from '../utils/responsive';
import * as Haptics from 'expo-haptics';
import { IS_OFFLINE_MODE } from '../utils/featureFlags';
import { ArrowUpRight, ChevronUp, MoreHorizontal, Pencil, Sprout, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { getBloomStatus } from './TimeIndicator'; // Importujemy funkcję, a nie cały komponent

// Konfiguracja LayoutAnimation dla Androida
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Wildflower {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface WildflowerItemProps {
  wildflower: Wildflower;
  onCompost: (id: string) => void; // Changed from onDelete to onCompost
  onEdit: (wildflower: Wildflower) => void;
  onNurture: (wildflower: Wildflower) => void;
  onQuickHarvest: (wildflower: Wildflower) => void;
  viewMode?: 'list' | 'grid';
}

export const WildflowerItem: React.FC<WildflowerItemProps> = ({ 
  wildflower, 
  onCompost, 
  onEdit, 
  onNurture, 
  onQuickHarvest, 
  viewMode = 'list'
}) => {
  const [expanded, setExpanded] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const handleCompost = () => {
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "🌿 Move to Compost Bin?", 
      "This wildflower will be moved to the Compost Bin for future restoration.",
      [
        { text: "Cancel", style: "cancel" }, 
        { 
          text: "Compost", 
          onPress: () => onCompost(wildflower.id), 
          style: "destructive" 
        }
      ]
    );
  };

  const handlePress = () => {
    if (viewMode === 'grid') {
      onEdit(wildflower);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(!expanded);
    }
  };
  
  const handleQuickHarvestAnimated = () => {
    if (justCompleted) return;
    setJustCompleted(true);
    if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      try {
        await onQuickHarvest(wildflower);
        // Show success message after quick harvest
        Alert.alert('Success', '🌿 Quick replant complete! Your idea is now a growing Plant in the Action Garden!');
      } catch (error) {
        console.error('Error in handleQuickHarvestAnimated:', error);
        Alert.alert('Error', 'Failed to replant your idea. Please try again.');
      } finally {
        setJustCompleted(false);
      }
    }, 400);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  // Pobieramy aktualny status pomysłu
  const bloomStatus = getBloomStatus(new Date(wildflower.createdAt));
  const StatusIcon = bloomStatus.icon;

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity style={styles.gridContainer} onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.gridTitle} numberOfLines={4}>{wildflower.title}</Text>
          <View style={styles.gridFooter}>
            <StatusIcon size={12} color={bloomStatus.color} />
            <Text style={[styles.gridStatusText, { color: bloomStatus.color }]}>
              {bloomStatus.label}
            </Text>
          </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainContentContainer}>
        <TouchableOpacity style={styles.textAndChevronContainer} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{wildflower.title}</Text>
              
              {/* ZAKTUALIZOWANY BLOK STATUSU I DATY */}
              <View style={styles.dateContainer}>
                <StatusIcon size={14} color={bloomStatus.color} />
                <Text style={[styles.statusText, { color: bloomStatus.color }]}>
                  {bloomStatus.label}
                </Text>
                <Text style={styles.dateSeparator}>•</Text>
                <Text style={styles.dateText}>{formatDate(wildflower.createdAt)}</Text>
              </View>

              {expanded && wildflower.description && (
                <Text style={styles.description}>{wildflower.description}</Text>
              )}
            </View>
            <TouchableOpacity onPress={handlePress}>
              {expanded ? <ChevronUp size={18} color="#9E9E9E" /> : <MoreHorizontal size={18} color="#9E9E9E" />}
            </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.plantButton} 
            onPress={() => {
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleQuickHarvestAnimated();
            }}
            activeOpacity={0.7}
          >
            <Sprout size={16} color="#FFFFFF" />
            <Text style={styles.plantButtonText}>Replant</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cultivateButton} 
            onPress={() => {
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNurture(wildflower);
            }}
            activeOpacity={0.7}
          >
            <ArrowUpRight size={16} color="#4CAF50" />
            <Text style={styles.cultivateButtonText}>Cultivate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tendButton} 
            onPress={() => {
              if (!IS_OFFLINE_MODE) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(wildflower);
            }}
            activeOpacity={0.7}
          >
            <Pencil size={16} color="#666" />
            <Text style={styles.tendButtonText}>Tend</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.compostButton} 
            onPress={handleCompost}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color="#FF5252" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: ResponsiveUtils.getCardDimensions().borderRadius, marginBottom: ResponsiveUtils.getCardDimensions().margin, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  mainContentContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ResponsiveUtils.getCardDimensions().padding, paddingVertical: ResponsiveUtils.getResponsiveSpacing().sm },
  textAndChevronContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: { flex: 1 },
  title: { fontSize: ResponsiveUtils.getResponsiveFontSizes().md, fontWeight: '600', color: '#1A1A1A', marginBottom: ResponsiveUtils.getResponsiveSpacing().xs },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  statusText: {
    fontSize: ResponsiveUtils.getResponsiveFontSizes().xs,
    fontWeight: '600',
    marginLeft: ResponsiveUtils.getResponsiveSpacing().xs,
    textTransform: 'capitalize',
  },
  dateSeparator: {
    fontSize: ResponsiveUtils.getResponsiveFontSizes().xs,
    color: '#BDBDBD',
    marginHorizontal: ResponsiveUtils.getResponsiveSpacing().xs,
  },
  dateText: { fontSize: ResponsiveUtils.getResponsiveFontSizes().xs, color: '#9E9E9E' },
  description: { marginTop: ResponsiveUtils.getResponsiveSpacing().sm, fontSize: ResponsiveUtils.getResponsiveFontSizes().sm, color: '#666666', lineHeight: ResponsiveUtils.getResponsiveValue(20, 22, 24) },
  actions: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F1F1F1', 
    paddingVertical: ResponsiveUtils.getResponsiveSpacing().sm, 
    paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().sm, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: ResponsiveUtils.getResponsiveSpacing().xs,
  },
  // PRIMARY ACTION - "Replant"
  plantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().sm,
    paddingVertical: ResponsiveUtils.getResponsiveSpacing().xs,
    borderRadius: ResponsiveUtils.getResponsiveValue(8, 10, 12),
    flex: 1,
    justifyContent: 'center',
  },
  plantButtonText: {
    marginLeft: ResponsiveUtils.getResponsiveSpacing().xs,
    fontSize: ResponsiveUtils.getResponsiveFontSizes().sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // SECONDARY ACTION - "Cultivate"
  cultivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().sm,
    paddingVertical: ResponsiveUtils.getResponsiveSpacing().xs,
    borderRadius: ResponsiveUtils.getResponsiveValue(8, 10, 12),
    flex: 1,
    justifyContent: 'center',
  },
  cultivateButtonText: {
    marginLeft: ResponsiveUtils.getResponsiveSpacing().xs,
    fontSize: ResponsiveUtils.getResponsiveFontSizes().sm,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // TERTIARY ACTION - "Tend" (Edit)
  tendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#999',
    paddingHorizontal: ResponsiveUtils.getResponsiveSpacing().sm,
    paddingVertical: ResponsiveUtils.getResponsiveSpacing().xs,
    borderRadius: ResponsiveUtils.getResponsiveValue(8, 10, 12),
    justifyContent: 'center',
  },
  tendButtonText: {
    marginLeft: ResponsiveUtils.getResponsiveSpacing().xs,
    fontSize: ResponsiveUtils.getResponsiveFontSizes().sm,
    fontWeight: '600',
    color: '#666',
  },
  // DESTRUCTIVE ACTION - "Compost" (icon only)
  compostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ResponsiveUtils.getResponsiveSpacing().xs,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: ResponsiveUtils.getResponsiveValue(8, 10, 12),
  },
  gridContainer: {
    flex: 1,
    margin: ResponsiveUtils.getResponsiveSpacing().xs,
    backgroundColor: '#FFFFFF',
    borderRadius: ResponsiveUtils.getCardDimensions().borderRadius,
    padding: ResponsiveUtils.getCardDimensions().padding,
    minHeight: ResponsiveUtils.getResponsiveValue(120, 140, 160),
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridTitle: {
    fontSize: ResponsiveUtils.getResponsiveFontSizes().sm,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  gridFooter: {
    marginTop: ResponsiveUtils.getResponsiveSpacing().sm,
    alignItems: 'flex-start',
  },
  gridStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
});