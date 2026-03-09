import { useRouter } from 'expo-router';
import {
  CircleAlert as AlertCircle,
  Archive,
  Bell,
  Bug,
  ChartBar,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  CircleHelp as HelpCircle,
  Mail,
  PlayCircle,
  Shield,
  Star,
  Tag,
  Wheat
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { ErrorBoundary } from '../../components/ErrorBoundary'; // Temporarily disabled

export default function SettingsScreen() {
  const router = useRouter();
  const [shouldRedirectToPremium, setShouldRedirectToPremium] = useState(false);

  console.log('🔍 SettingsScreen: Rendering...');

  // Sprawdź czy użytkownik przyszedł z akcji limitów
  useEffect(() => {
    try {
      const navigationState = router.getState();
      const previousRoute = navigationState?.routes?.[navigationState.index - 1];
      
      console.log('🔍 Navigation state:', { navigationState, previousRoute });
      
      // Jeśli poprzednia trasa to Idea Meadow lub Action Garden, ustaw flagę przekierowania
      if (previousRoute?.name === 'index' || previousRoute?.name === 'garden') {
        console.log('🔍 Redirecting to Premium');
        setShouldRedirectToPremium(true);
      }
    } catch (error) {
      console.error('🚨 Navigation state error:', error);
    }
  }, [router]);

  // Automatyczne przekierowanie do Premium z debouncing
  useEffect(() => {
    if (shouldRedirectToPremium) {
      const timer = setTimeout(() => {
        router.push('/(tabs)/(settings)/premium');
        setShouldRedirectToPremium(false);
      }, 200); // Zwiększone opóźnienie dla stabilności
      
      return () => clearTimeout(timer);
    }
  }, [shouldRedirectToPremium, router]);

  const menuSections = [
    {
      title: '',
      items: [
        {
          icon: Star,
          title: 'Go Premium',
          description: 'Unlock unlimited features and grow your garden without limits',
          route: '/(tabs)/(settings)/premium',
          highlight: true,
        },
      ],
    },
    {
      title: 'Content & Archives',
      items: [
        {
          icon: ChartBar,
          title: 'Growth Tracker',
          description: 'Analyze your progress and stats',
          route: '/(tabs)/(settings)/tracker',
        },
        {
          icon: Wheat,
          title: 'Granary',
          description: 'View completed tasks',
          route: '/(tabs)/(settings)/granary',
        },
        {
          icon: Archive,
          title: 'Compost Bin',
          description: 'Manage archived ideas',
          route: '/(tabs)/(settings)/compost-bin',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          icon: Tag,
          title: 'Manage Categories',
          description: 'Manage your contexts and plots',
          route: '/(tabs)/(settings)/manage-categories',
        },
        {
          icon: ClipboardList,
          title: 'Manage Seedlings',
          description: 'Create and edit task templates',
          route: '/(tabs)/(settings)/manage-seedlings',
        },
        {
          icon: Bell,
          title: 'Notifications & Calendar',
          description: 'Notification and calendar sync settings',
          route: '/(tabs)/(settings)/notifications-and-calendar',
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: Database,
          title: 'Backup & Restore',
          description: 'Backup your data and restore from backups',
          route: '/(tabs)/(settings)/backup-restore',
        },
        {
          icon: Bug,
          title: 'Crash Reports',
          description: 'View and manage error reports',
          route: '/(tabs)/(settings)/crash-reports',
        },
      ],
    },
    {
      title: 'Support & Help',
      items: [
        {
          icon: PlayCircle,
          title: 'MK-WES Wind Turbine Video',
          description: 'Learn how the M-CVT and flywheel work',
          action: () => {
            // Replace with your actual video URL (YouTube, Vimeo, etc.)
            Linking.openURL('https://www.youtube.com/watch?v=YOUR_VIDEO_ID');
          },
        },
        {
          icon: HelpCircle,
          title: 'F.A.Q.',
          description: 'Find answers to common questions',
          route: '/(tabs)/(settings)/faq',
        },
        {
          icon: AlertCircle,
          title: 'Report an Issue',
          description: "Let us know if something isn't working",
          route: '/(tabs)/(settings)/report-issue',
        },
        {
          icon: Mail,
          title: 'Contact Support',
          description: 'Get help from our team',
          route: '/(tabs)/(settings)/contact',
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: FileText,
          title: 'Terms of Service',
          description: 'Read our terms and conditions',
          route: '/(tabs)/(settings)/terms',
        },
        {
          icon: Shield,
          title: 'Privacy Policy',
          description: 'How we protect your data',
          route: '/(tabs)/(settings)/privacy',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    styles.menuItem,
                    item.highlight && styles.menuItemHighlight,
                    itemIndex === section.items.length - 1 && styles.lastMenuItem,
                  ]}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                    } else if (item.action) {
                      item.action();
                    }
                  }}
                  disabled={!item.route && !item.action}
                >
                  {item.icon && (
                    <View style={[
                      styles.menuItemIcon,
                      item.highlight && styles.menuItemIconHighlight
                    ]}>
                      <item.icon size={20} color={item.highlight ? '#FFD700' : '#4CAF50'} />
                    </View>
                  )}
                  <View style={styles.menuItemContent}>
                    <Text style={[
                      styles.menuItemTitle,
                      item.highlight && styles.menuItemTitleHighlight
                    ]}>
                      {item.title}
                    </Text>
                    <Text style={[
                      styles.menuItemDescription,
                      item.highlight && styles.menuItemDescriptionHighlight
                    ]}>
                      {item.description}
                    </Text>
                  </View>
                  {item.route && <ExternalLink size={16} color="#666666" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  menuItemHighlight: {
    backgroundColor: '#FFFFE0', // Bardzo jasnożółte tło
    borderWidth: 1,
    borderColor: '#FFD700', // Czysty złoty border
    shadowColor: '#FFD700', // Złoty cień
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFE0', // Bardzo jasnożółte tło dla freemium
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIconHighlight: {
    backgroundColor: '#FFFFE0', // Bardzo jasnożółte tło dla premium
  },
  menuItemContent: {
    flex: 1,
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuItemTitleHighlight: {
    color: '#DAA520', // Złoty tytuł
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666666',
  },
  menuItemDescriptionHighlight: {
    color: '#B8860B', // Ciemnożółty opis
  },
});


