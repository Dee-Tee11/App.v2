import { Tabs } from 'expo-router';
import {
  Camera,
  FileText,
  ChartBar as BarChart3,
  Sparkles,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          backgroundColor:
            Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
          borderRadius: 20,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: Platform.OS === 'ios' ? 1 : 0,
          borderColor: 'rgba(255, 255, 255, 0.8)',
        },
        tabBarBackground:
          Platform.OS === 'ios'
            ? () => (
                <BlurView
                  intensity={80}
                  tint="light"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    borderRadius: 20,
                    overflow: 'hidden',
                  }}
                />
              )
            : undefined,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          paddingHorizontal: 4,
          borderRadius: 14,
          marginHorizontal: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ size, color, focused }) => (
            <Camera
              size={focused ? size + 3 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            letterSpacing: 0.2,
          },
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: 'Recibos',
          tabBarIcon: ({ size, color, focused }) => (
            <FileText
              size={focused ? size + 3 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            letterSpacing: 0.2,
          },
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Análise',
          tabBarIcon: ({ size, color, focused }) => (
            <BarChart3
              size={focused ? size + 3 : size}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            letterSpacing: 0.2,
          },
        }}
      />
    </Tabs>
  );
}
