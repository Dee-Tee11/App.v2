import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({
  message = 'A processar...',
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1
    );

    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [1, 1.1], [0.3, 0.6]);

    return {
      opacity,
      transform: [{ scale: scale.value * 1.5 }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <Animated.View style={[styles.spinner, animatedStyle]}>
          <View style={styles.innerCircle} />
        </Animated.View>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  spinnerContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderTopColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
