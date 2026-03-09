import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';
import * as Notifications from 'expo-notifications';
import { Bell, ChevronDown, Clock, TestTube } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

type ReminderPreset = 'minimal' | 'standard' | 'proactive';

interface NotificationPreferences {
  enabled: boolean;
  preset: ReminderPreset;
  defaultTime: string; // Store as "HH:MM" format
  wildflowerReminders: boolean;
  wildflowerFrequency: 'daily' | '3days' | 'weekly';
  wildflowerReminderTime: string;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  preset: 'standard',
  defaultTime: '09:00',
  wildflowerReminders: true,
  wildflowerFrequency: '3days',
  wildflowerReminderTime: '10:00',
};

const PRESETS = {
  minimal: {
    name: 'Minimal',
    description: 'Due date only',
    reminders: ['onDueDate']
  },
  standard: {
    name: 'Standard',
    description: '1 day before + due date',
    reminders: ['oneDayBefore', 'onDueDate']
  },
  proactive: {
    name: 'Proactive',
    description: '1 week, 3 days, 1 day + due date',
    reminders: ['oneWeekBefore', 'threeDaysBefore', 'oneDayBefore', 'onDueDate']
  }
};

// All reminder presets are available to all users (free feature)

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showWildflowerFrequencyModal, setShowWildflowerFrequencyModal] = useState(false);
  const [showWildflowerTimePicker, setShowWildflowerTimePicker] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    loadCalendarSyncSettings();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.remindOneDayBefore !== undefined) {
          const newPrefs: NotificationPreferences = {
            enabled: true,
            preset: 'standard',
            defaultTime: parsed.dailyReminderTime || '09:00',
          };
          setPreferences(newPrefs);
          await AsyncStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
        } else {
          const validPrefs = {
            enabled: parsed.enabled !== undefined ? parsed.enabled : true,
            preset: parsed.preset || 'standard',
            defaultTime: parsed.defaultTime || '09:00',
          };
          setPreferences(validPrefs);
        }
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    }
  };

  const handleMasterToggle = (value: boolean) => {
    const newPreferences = {
      ...preferences,
      enabled: value,
    };
    savePreferences(newPreferences);
  };

  const handlePresetChange = (preset: ReminderPreset) => {
    const newPreferences = {
      ...preferences,
      preset,
    };
    savePreferences(newPreferences);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      const newPreferences = {
        ...preferences,
        defaultTime: timeString,
      };
      savePreferences(newPreferences);
    }
  };

  const getCurrentTime = () => {
    const [hours, minutes] = (preferences.defaultTime || '09:00').split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const getCurrentWildflowerTime = () => {
    const [hours, minutes] = (preferences.wildflowerReminderTime || '10:00').split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const handleWildflowerTimeChange = (event: any, selectedTime?: Date) => {
    setShowWildflowerTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      const newPreferences = {
        ...preferences,
        wildflowerReminderTime: timeString,
      };
      savePreferences(newPreferences);
    }
  };

  const showWildflowerFrequencySelector = () => {
    Alert.alert(
      'Choose Reminder Frequency',
      'How often should we remind you about your wildflowers?',
      [
        { text: 'Daily', onPress: () => {
          const newPreferences = { ...preferences, wildflowerFrequency: 'daily' as const };
          savePreferences(newPreferences);
        }},
        { text: 'Every 3 days', onPress: () => {
          const newPreferences = { ...preferences, wildflowerFrequency: '3days' as const };
          savePreferences(newPreferences);
        }},
        { text: 'Weekly', onPress: () => {
          const newPreferences = { ...preferences, wildflowerFrequency: 'weekly' as const };
          savePreferences(newPreferences);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const showPresetSelector = () => {
    Alert.alert(
      'Choose Reminder Style',
      'Select how you want to be reminded about your tasks',
      [
        { text: 'Minimal - Due date only', onPress: () => handlePresetChange('minimal') },
        { text: 'Standard - 1 day before + due date', onPress: () => handlePresetChange('standard') },
        { text: 'Proactive - 1 week, 3 days, 1 day + due date', onPress: () => handlePresetChange('proactive') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all notification settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => savePreferences(defaultPreferences) }
      ]
    );
  };

  const loadCalendarSyncSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('calendar_sync_enabled');
      setCalendarSyncEnabled(enabled === 'true');
      const calId = await AsyncStorage.getItem('calendar_sync_calendar_id');
      setSelectedCalendarId(calId || null);
    } catch (e) {
      // ignore
    }
  };

  const handleCalendarSyncToggle = async (isEnabled: boolean) => {
    if (isEnabled) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot sync with calendar without permissions.');
        setCalendarSyncEnabled(false);
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const modifiableCalendars = calendars.filter(cal => cal.allowsModifications);
      if (modifiableCalendars.length === 0) {
        Alert.alert('No Calendars Found', 'No modifiable calendars were found on your device.');
        setCalendarSyncEnabled(false);
        return;
      }
      const calendarOptions = modifiableCalendars.map(cal => ({
        text: cal.title,
        onPress: async () => {
          await AsyncStorage.setItem('calendar_sync_enabled', 'true');
          await AsyncStorage.setItem('calendar_sync_calendar_id', cal.id);
          setSelectedCalendarId(cal.id);
          setCalendarSyncEnabled(true);
          Alert.alert('Sync Enabled', `Tasks will now be synced to the "${cal.title}" calendar.`);
        },
      }));
      calendarOptions.push({ text: 'Cancel', onPress: async () => { setCalendarSyncEnabled(false); } } as any);
      Alert.alert('Select a Calendar', 'Choose a calendar to sync your tasks with.', calendarOptions, { cancelable: false });
    } else {
      await AsyncStorage.removeItem('calendar_sync_enabled');
      await AsyncStorage.removeItem('calendar_sync_calendar_id');
      setCalendarSyncEnabled(false);
      setSelectedCalendarId(null);
    }
  };

  const handleTestNotification = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings to test notifications.');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌱 Test Notification',
          body: 'Your notifications are working perfectly! Your garden is ready for reminders.',
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      });

      Alert.alert('Success', '🔔 Test notification planted! It will bloom in your notifications!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plant Care Reminders 🌱</Text>
          <Text style={styles.sectionDescription}>Get notified about upcoming and overdue tasks</Text>
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Task Reminders</Text>
              <Text style={styles.settingSubtitle}>Remind me about my plants</Text>
            </View>
            <View style={styles.switchContainer}>
              <Switch value={preferences.enabled} onValueChange={handleMasterToggle} trackColor={{ false: '#E0E0E0', true: '#4CAF50' }} thumbColor={preferences.enabled ? '#FFFFFF' : '#F4F3F4'} />
            </View>
          </View>

          {preferences.enabled && (
            <>
              <TouchableOpacity style={styles.selectorRow} onPress={showPresetSelector} activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Bell size={20} color="#4CAF50" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorTitle}>Reminder Style</Text>
                    <Text style={styles.selectorDescription}>
                      {PRESETS[preferences.preset]?.name || 'Standard'} - {PRESETS[preferences.preset]?.description || '1 day before + due date'}
                    </Text>
                  </View>
                </View>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.selectorRow} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Clock size={20} color="#4CAF50" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorTitle}>Default Time</Text>
                    <Text style={styles.selectorDescription}>Reminders at {formatTime(preferences.defaultTime)}</Text>
                  </View>
                </View>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.customizeButton} onPress={() => Alert.alert('Coming Soon', 'Advanced customization will be available in a future update.')} activeOpacity={0.7}>
                <Text style={styles.customizeButtonText}>Customize Reminder Schedule</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {showTimePicker && (
          <DateTimePicker value={getCurrentTime()} mode="time" is24Hour={false} display="default" onChange={handleTimeChange} />
        )}

        {showWildflowerTimePicker && (
          <DateTimePicker value={getCurrentWildflowerTime()} mode="time" is24Hour={false} display="default" onChange={handleWildflowerTimeChange} />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idea Meadow Reminders 🌸</Text>
          <Text style={styles.sectionDescription}>Get reminded to tend your wildflowers and transform them into Plants</Text>
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Wildflower Reminders</Text>
              <Text style={styles.settingSubtitle}>Remind me to review my ideas</Text>
            </View>
            <View style={styles.switchContainer}>
              <Switch 
                value={preferences.wildflowerReminders} 
                onValueChange={(value) => {
                  setPreferences(prev => ({ ...prev, wildflowerReminders: value }));
                }} 
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }} 
                thumbColor={preferences.wildflowerReminders ? '#FFFFFF' : '#F4F3F4'} 
              />
            </View>
          </View>

          {preferences.wildflowerReminders && (
            <>
              <TouchableOpacity style={styles.selectorRow} onPress={showWildflowerFrequencySelector} activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Clock size={20} color="#4CAF50" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorTitle}>Reminder Frequency</Text>
                    <Text style={styles.selectorDescription}>
                      {preferences.wildflowerFrequency === 'daily' ? 'Daily' : 
                       preferences.wildflowerFrequency === '3days' ? 'Every 3 days' : 'Weekly'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#666" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.selectorRow} onPress={() => setShowWildflowerTimePicker(true)} activeOpacity={0.7}>
                <View style={styles.selectorLeft}>
                  <Clock size={20} color="#4CAF50" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectorTitle}>Reminder Time</Text>
                    <Text style={styles.selectorDescription}>{preferences.wildflowerReminderTime}</Text>
                  </View>
                  <ChevronDown size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Sync 📅</Text>
          <Text style={styles.sectionDescription}>Automatically sync your tasks with a calendar on your device.</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Automatic Calendar Sync</Text>
            </View>
            <View style={styles.switchContainer}>
              <Switch value={calendarSyncEnabled} onValueChange={handleCalendarSyncToggle} trackColor={{ false: '#E0E0E0', true: '#1976D2' }} thumbColor={calendarSyncEnabled ? '#FFFFFF' : '#F4F3F4'} />
            </View>
          </View>
          {calendarSyncEnabled && selectedCalendarId && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionDescription}>Tasks will be synced to your selected calendar.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications 🧪</Text>
          <Text style={styles.sectionDescription}>Make sure your notifications are working properly</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={handleTestNotification}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <TestTube size={24} color="#4CAF50" style={{ marginRight: 12 }} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Send Test Notification</Text>
                    <Text style={styles.settingSubtitle}>Test if notifications work on your device</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  sectionDescription: { fontSize: 14, color: '#666666', lineHeight: 20 },
  settingsContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24 },
  settingItem: { flexDirection: 'column', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingContent: { flex: 1, marginBottom: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 4 },
  settingSubtitle: { fontSize: 14, color: '#666666' },
  selectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectorTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  selectorDescription: { fontSize: 14, color: '#666' },
  customizeButton: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#E8F5E9', borderRadius: 8, borderWidth: 1, borderColor: '#C8E6C9', alignItems: 'center' },
  customizeButtonText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  switchContainer: { alignSelf: 'flex-end' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333333' },
  settingHeader: { flexDirection: 'row', alignItems: 'center' },
  settingText: { flex: 1 },
});


