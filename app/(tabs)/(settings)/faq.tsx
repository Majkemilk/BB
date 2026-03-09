import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FAQS = [
  {
    question: "What is a Wildflower vs. a Plant?",
    answer: "A 'Wildflower' is a raw idea or thought. A 'Plant' is an actionable task that you cultivate from an idea, with a due date, priority, and other details.",
  },
  {
    question: "What is the difference between a Context and a Plot?",
    answer: "A 'Context' defines *where* or *when* you might do a task (e.g., @Home, @Work). A 'Plot' groups tasks into larger projects or areas of life (e.g., 'Q3 Report', 'Garden Renovations').",
  },
  {
    question: "What is the Seed Almanac?",
    answer: "The Seed Almanac is your collection of unique 'seeds' you discover by completing tasks. It's a fun way to track your productivity and build a collection.",
  },
];

export default function FAQScreen() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.content}>
        {FAQS.map((item, idx) => (
          <View key={idx} style={styles.accordionItem}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => toggleIndex(idx)}
              activeOpacity={0.7}
            >
              <Text style={styles.question}>{item.question}</Text>
              {openIndexes.includes(idx) ? (
                <ChevronUp size={20} color="#388E3C" />
              ) : (
                <ChevronDown size={20} color="#388E3C" />
              )}
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <Text style={styles.answer}>{item.answer}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  backButton: {},
  headerTitle: {},
  content: {
    padding: 20,
  },
  accordionItem: {
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: '#F1F8E9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  answer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 15,
    color: '#444',
    lineHeight: 21,
  },
}); 