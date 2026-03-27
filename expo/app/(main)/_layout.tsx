import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { Home, Send, ClipboardList, History, Settings } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Brief',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="command"
        options={{
          title: 'Request',
          tabBarIcon: ({ color, size }) => <Send size={size - 2} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size - 2} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Log',
          tabBarIcon: ({ color, size }) => <History size={size - 2} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.borderLight,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 88 : 68,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
});
