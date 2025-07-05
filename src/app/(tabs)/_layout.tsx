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
          bottom: 0, // Changed from 20 to 0 to stick to bottom
          left: 0, // Changed from 16 to 0
          right: 0, // Changed from 16 to 0
          backgroundColor:
            Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
          borderRadius: 0, // Changed from 20 to 0 for full width
          height: Platform.OS === 'ios' ? 88 : 64, // Increased height for iOS to account for safe area
          paddingBottom: Platform.OS === 'ios' ? 24 : 8, // More padding for iOS
          paddingTop: 8,
          paddingHorizontal: 16, // Keep horizontal padding
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 }, // Shadow upward
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 12,
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
        name="myReceipts"
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
    </Tabs>
  );
}
