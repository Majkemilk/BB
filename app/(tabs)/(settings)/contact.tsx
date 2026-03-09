import { Mail } from 'lucide-react-native';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ContactSupportScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:support@plantascape.com?subject=[Plantascape Support] Query');
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.content}>
        <Text style={styles.infoText}>
          Need help or have a question? Our support team is here for you. Tap the button below to send us an email and we'll get back to you as soon as possible.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleEmail}>
          <Mail size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Send us an Email</Text>
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