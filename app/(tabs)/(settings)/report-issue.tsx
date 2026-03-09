import { Bug } from 'lucide-react-native';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportIssueScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:support@plantascape.com?subject=[Plantascape Bug Report]');
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          Found a bug or something not working as expected? Tap the button below to send us a bug report. Please include as much detail as possible to help us fix the issue quickly.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleEmail}>
          <Bug size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Report a Bug</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  backButton: {},
  headerTitle: {},
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 