import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface WavingHandLoaderProps {
  size?: number;
  color?: string;
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  compact?: boolean;
}

const WavingHandLoader: React.FC<WavingHandLoaderProps> = ({ 
  size = 100, 
  color = '#000000',
  text,
  textColor = '#000000',
  backgroundColor = '#ffffff',
  compact = false
}) => {
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create a continuous waving animation
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Create a subtle breathing/pulsing animation
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    waveLoop.start();
    scaleLoop.start();

    return () => {
      waveLoop.stop();
      scaleLoop.stop();
    };
  }, [waveAnimation, scaleAnimation]);

  // Interpolate the wave animation to rotation values
  const rotateZ = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  // SVG path for a simple hand with fingers
  const handPath = `
    M 20 80 
    L 20 60 
    L 30 50 
    L 40 45 
    L 50 50 
    L 60 60 
    L 70 70 
    L 80 75 
    L 85 80 
    L 80 85 
    L 70 90 
    L 60 95 
    L 50 100 
    L 40 95 
    L 30 90 
    L 20 85 
    Z
  `;

  const containerStyle = compact ? styles.compactContainer : [styles.container, { backgroundColor }];

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          styles.handContainer,
          {
            transform: [
              { rotateZ },
              { scale: scaleAnimation },
            ],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G>
            {/* Main hand shape */}
            <Path
              d={handPath}
              fill={color}
              stroke={color}
              strokeWidth="1"
            />
            {/* Fingers */}
            <Path
              d="M 25 60 L 25 40 L 30 35 L 35 40 L 30 60 Z"
              fill={color}
            />
            <Path
              d="M 35 55 L 35 35 L 40 30 L 45 35 L 40 55 Z"
              fill={color}
            />
            <Path
              d="M 45 50 L 45 30 L 50 25 L 55 30 L 50 50 Z"
              fill={color}
            />
            <Path
              d="M 55 45 L 55 25 L 60 20 L 65 25 L 60 45 Z"
              fill={color}
            />
            {/* Thumb */}
            <Path
              d="M 15 70 L 15 50 L 20 45 L 25 50 L 20 70 Z"
              fill={color}
            />
          </G>
        </Svg>
      </Animated.View>
      {text && !compact && (
        <Text style={[styles.loadingText, { color: textColor }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  handContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default WavingHandLoader; 