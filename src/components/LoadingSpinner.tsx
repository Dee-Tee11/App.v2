import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { styles } from '../_styles/LoadingSpinner.styles'; // Update the path to your styles file
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
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({
  message = 'A processar...',
  size = 'large',
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const sizes = {
    small: { spinner: 32, pulse: 48, inner: 20 },
    medium: { spinner: 40, pulse: 56, inner: 24 },
    large: { spinner: 48, pulse: 56, inner: 28 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
    );

    scale.value = withRepeat(
      withTiming(1.08, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [1, 1.08], [0.2, 0.4]);

    return {
      opacity,
      transform: [{ scale: scale.value }],
    };
  });

  const dynamicStyles = StyleSheet.create({
    pulseRing: {
      position: 'absolute',
      width: currentSize.pulse,
      height: currentSize.pulse,
      borderRadius: currentSize.pulse / 2,
      borderWidth: 1.5,
      borderColor: '#6366F1',
    },
    spinner: {
      width: currentSize.spinner,
      height: currentSize.spinner,
      borderRadius: currentSize.spinner / 2,
      borderWidth: 2.5,
      borderColor: '#F1F5F9',
      borderTopColor: '#6366F1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerCircle: {
      width: currentSize.inner,
      height: currentSize.inner,
      borderRadius: currentSize.inner / 2,
      backgroundColor: '#FEFEFE',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={[dynamicStyles.pulseRing, pulseStyle]} />
        <Animated.View style={[dynamicStyles.spinner, animatedStyle]}>
          <View style={dynamicStyles.innerCircle} />
        </Animated.View>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}
