import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const calculateNextOccurrence = (frequency, interval, daysOfWeek, dayOfMonth) => {
  const now = new Date();
  const intervalNum = parseInt(interval) || 1;
  
  switch (frequency) {
    case 'daily':
      const nextDaily = new Date(now);
      nextDaily.setDate(now.getDate() + intervalNum);
      return nextDaily.toLocaleDateString();
    
    case 'weekly':
      if (daysOfWeek.length === 0) return 'Select days';
      const nextWeekly = new Date(now);
      const daysUntilNext = Math.min(...daysOfWeek.map(day => 
        (day - now.getDay() + 7) % 7 || 7
      ));
      nextWeekly.setDate(now.getDate() + daysUntilNext);
      return nextWeekly.toLocaleDateString();
    
    case 'monthly':
      const day = parseInt(dayOfMonth) || 1;
      const nextMonthly = new Date(now);
      nextMonthly.setMonth(now.getMonth() + intervalNum);
      nextMonthly.setDate(day);
      if (nextMonthly <= now) {
        nextMonthly.setMonth(nextMonthly.getMonth() + intervalNum);
      }
      return nextMonthly.toLocaleDateString();
    
    case 'yearly':
      const nextYearly = new Date(now);
      nextYearly.setFullYear(now.getFullYear() + intervalNum);
      return nextYearly.toLocaleDateString();
    
    default:
      return 'Invalid frequency';
  }
};

const FREQUENCIES = [
  { label: 'Does not repeat', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const WEEKDAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export default function RecurrenceModal({ visible, onClose, onSave, initialConfig }) {
  const [frequency, setFrequency] = useState(null);
  const [interval, setInterval] = useState('1');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [dayOfMonth, setDayOfMonth] = useState('');

  useEffect(() => {
    if (initialConfig) {
      setFrequency(initialConfig.type || null);
      setInterval(initialConfig.interval ? String(initialConfig.interval) : '1');
      setDaysOfWeek(initialConfig.daysOfWeek || []);
      setDayOfMonth(initialConfig.dayOfMonth ? String(initialConfig.dayOfMonth) : '');
    } else {
      setFrequency(null);
      setInterval('1');
      setDaysOfWeek([]);
      setDayOfMonth('');
    }
  }, [visible, initialConfig]);

  const handleToggleDay = (day) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = () => {
    if (!frequency) {
      onSave(undefined);
      onClose();
      return;
    }
    const config = {
      type: frequency,
      interval: Number(interval) || 1,
      ...(frequency === 'weekly' ? { daysOfWeek } : {}),
      ...(frequency === 'monthly' ? { dayOfMonth: Number(dayOfMonth) || undefined } : {}),
    };
    onSave(config);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Repeat</Text>
          <ScrollView>
            <Text style={styles.label}>Frequency</Text>
            {FREQUENCIES.map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.option, frequency === opt.value && styles.selectedOption]}
                onPress={() => setFrequency(opt.value)}
              >
                <Text style={[styles.optionText, frequency === opt.value && styles.selectedOptionText]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            {frequency && (
              <>
                <Text style={styles.label}>Repeat every</Text>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={interval}
                    onChangeText={setInterval}
                  />
                  <Text style={styles.unitText}>
                    {frequency === 'daily' && 'day(s)'}
                    {frequency === 'weekly' && 'week(s)'}
                    {frequency === 'monthly' && 'month(s)'}
                    {frequency === 'yearly' && 'year(s)'}
                  </Text>
                </View>
              </>
            )}
            {frequency === 'weekly' && (
              <>
                <Text style={styles.label}>Repeat on</Text>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      style={[styles.dayButton, daysOfWeek.includes(day.value) && styles.dayButtonSelected]}
                      onPress={() => handleToggleDay(day.value)}
                    >
                      <Text style={[styles.dayText, daysOfWeek.includes(day.value) && styles.dayTextSelected]}>{day.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {frequency === 'monthly' && (
              <>
                <Text style={styles.label}>Day of month</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  placeholder="e.g. 15"
                />
              </>
            )}
            
            {/* Preview next occurrence */}
            {frequency && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Next occurrence:</Text>
                <Text style={styles.previewText}>
                  {calculateNextOccurrence(frequency, interval, daysOfWeek, dayOfMonth)}
                </Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Set Repeat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 6,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 6,
  },
  selectedOption: {
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  selectedOptionText: {
    color: '#388E3C',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 60,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  unitText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  dayButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  dayText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#F1F1F1',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  previewContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 20,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
}); 