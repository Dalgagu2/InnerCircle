import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D12',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#E8364F',
        tabBarInactiveTintColor: '#6B6760',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon label="🏠" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <TabIcon label="⚙️" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 22 }}>{label}</Text>;
}
