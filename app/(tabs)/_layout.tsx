import ProfileQuickModal from '../../components/ProfileQuickModal';
import { ResponsiveUtils } from '../../utils/responsive';
import { Tabs } from 'expo-router';
import { BookOpen, Flower, Settings, Sprout, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  
  const activeColor = '#4CAF50';
  const inactiveColor = colorScheme === 'dark' ? '#666666' : '#AAAAAA';
  const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';

  return (
    <View style={styles.container}>
      {/* Status bar background with dynamic height */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Sprout size={48} color="#4CAF50" strokeWidth={1.5} />
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>Plantascape</Text>
              <Text style={styles.slogan}>Grow Your Ideas</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setIsProfileModalVisible(true)}
            style={styles.menuButton}
          >
            <User size={24} color="#666666" />
          </TouchableOpacity>
        </View>
        <View style={styles.gardenBorder} />
      </View>
      
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: bgColor,
            height: ResponsiveUtils.getTabBarDimensions().height + insets.bottom,
            paddingBottom: ResponsiveUtils.getTabBarDimensions().paddingBottom + insets.bottom,
            paddingTop: ResponsiveUtils.getTabBarDimensions().paddingTop,
            borderTopWidth: 1,
            borderTopColor: '#E8F5E9',
          },
          tabBarLabelStyle: {
            fontSize: ResponsiveUtils.getTabBarDimensions().fontSize,
            fontWeight: '500',
            paddingBottom: ResponsiveUtils.getResponsiveSpacing().sm,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Idea Meadow',
            tabBarIcon: ({ color, size }) => <Sprout size={ResponsiveUtils.getTabBarDimensions().iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="garden"
          options={{
            title: 'Action Garden',
            tabBarIcon: ({ color, size }) => <Flower size={ResponsiveUtils.getTabBarDimensions().iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="almanac"
          options={{
            title: 'Almanac',
            tabBarIcon: ({ color, size }) => <BookOpen size={ResponsiveUtils.getTabBarDimensions().iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Settings size={ResponsiveUtils.getTabBarDimensions().iconSize} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <ProfileQuickModal 
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBackground: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  slogan: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  gardenBorder: {
    height: 6,
    backgroundColor: '#E8F5E9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#C8E6C9',
  },
});