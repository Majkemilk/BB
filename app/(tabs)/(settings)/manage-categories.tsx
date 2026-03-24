import { useAuth } from '../../../contexts/AuthContext';
import { useTasks } from '../../../contexts/TaskContext';
import { useRouter } from 'expo-router';
import { Tag, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManageCategoriesScreen() {
  const { 
    contexts, 
    plots, 
    addContext, 
    deleteContext, 
    addPlot, 
    deletePlot 
  } = useTasks();
  
  const { userProfile, userProfileLoading } = useAuth();
  
  // Safe premium check with loading state
  const isPremium = userProfile?.is_premium ?? false;
  const isProfileLoaded = !userProfileLoading && userProfile !== null;
  const router = useRouter();

  const [newContext, setNewContext] = useState('');
  const [newPlot, setNewPlot] = useState('');

  const handleAddContext = () => {
    if (newContext.trim()) {
      // Check context limit for non-premium users
      const contextLimit = 5;
      
      if (isProfileLoaded && !isPremium && contexts.length >= contextLimit) {
        Alert.alert(
          'Upgrade to Premium',
          `You've reached the limit of ${contextLimit} contexts. Upgrade to Premium for unlimited categories!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
          ]
        );
        return;
      }
      
      addContext(newContext.trim());
      setNewContext('');
    }
  };

  const handleAddPlot = () => {
    if (newPlot.trim()) {
      // Check plot limit for non-premium users
      const plotLimit = 5;
      
      if (isProfileLoaded && !isPremium && plots.length >= plotLimit) {
        Alert.alert(
          'Upgrade to Premium',
          `You've reached the limit of ${plotLimit} plots. Upgrade to Premium for unlimited categories!`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/(tabs)/(settings)/premium') }
          ]
        );
        return;
      }
      
      addPlot(newPlot.trim());
      setNewPlot('');
    }
  };

  const confirmDelete = (item: string, deleteFunction: (item: string) => void) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${item}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteFunction(item) }
      ]
    );
  };

  const sections = [
    { title: 'Contexts', data: contexts, type: 'context' as const },
    { title: 'Plots', data: plots, type: 'plot' as const }
  ];

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.iconHeader}>
          <Tag size={28} color="#4CAF50" />
          <Text style={styles.headerSubtitle}>Organize Contexts & Plots</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item + index}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, section }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity onPress={() => confirmDelete(item, section.type === 'context' ? deleteContext : deletePlot)}>
                <X size={18} color="#FF5252" />
              </TouchableOpacity>
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>
                {section.type === 'context' 
                  ? 'Organize tasks by context (e.g., Work, Home, Personal)'
                  : 'Organize tasks by plot (e.g., Quick Tasks, Projects, Long Term)'}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={`Add new ${section.type}...`}
                  value={section.type === 'context' ? newContext : newPlot}
                  onChangeText={section.type === 'context' ? setNewContext : setNewPlot}
                  onSubmitEditing={section.type === 'context' ? handleAddContext : handleAddPlot}
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={section.type === 'context' ? handleAddContext : handleAddPlot}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Start organizing your tasks by adding contexts and plots above.</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
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
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  itemText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


