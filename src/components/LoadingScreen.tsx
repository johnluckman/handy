import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface LoadingScreenProps {
  size?: number;
  text?: string;
  backgroundColor?: string;
  compact?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  size = 100, 
  text,
  backgroundColor = 'transparent',
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
        <Svg width={size} height={size} viewBox="0 0 47.65 72.37">
          <G>
            <Path fill="#000000" d="M11.32,22.29V0C6.85.03,3.11,5.04,3.16,11.2s3.7,11.12,8.17,11.09Z"/>
            <Path fill="#000000" d="M46.53,42.67c-2.86-2.15-6.12-3.37-9.43-3.74-.22-.26-.45-.5-.68-.75l-.12-18.14s-.03,0-.04,0V0c-4.47.03-8.11,5.04-8.07,11.2.03,4.28,1.77,7.98,4.32,9.83-1.77.93-3.31,2.48-4.49,4.45l-.02-3.19V0c-4.47.03-8.21,5.04-8.17,11.2.02,3.17,1.01,6.02,2.57,8.04-.93.08-1.85.2-2.75.35V0c-4.47.03-8.21,5.04-8.17,11.2.03,4,1.59,7.49,3.9,9.44C6.99,23.41.99,30.06.27,41.73c-.65,4.81-.31,11.37,3.24,19.12.39.85.85,1.61,1.34,2.31.03.05.07.1.11.16.09.13.18.26.27.38,3.43,4.92,8.97,8.25,15.31,8.62.27.03.52.05.74.04.05,0,.1,0,.15,0,.04,0,.07,0,.11,0,.06,0,.12,0,.18,0,8.7,0,16.11-5.55,18.94-13.32.03-.07.08-.14.1-.2,2.26-6.02,6-16.03,6-16.03l-.21-.13Z"/>
            <Path fill="#fff" d="M25.28,35.04h.37c-.06-8.12,4.67-14.76,10.54-14.81h.07v-.37h-.21c-6,.16-10.82,6.92-10.76,15.18Z"/>
            <Path fill="#fff" d="M26.5,20.23h0s1.1,0,1.1,0v-.37h-1.1c-6.07.04-10.97,6.85-10.91,15.18h.37c-.06-8.13,4.67-14.77,10.54-14.81Z"/>
            <Path fill="#000000" d="M47.65,39.68c-4.44,0-8.04-4.96-8.04-11.07s3.6-11.07,8.04-11.07v22.15Z"/>
            <Path fill="#fff" d="M14.46,21.08c.06-.03.12-.06.18-.09.01,0,.02-.01.04-.02.05-.02.1-.05.16-.07.02,0,.03-.02.05-.02.05-.02.11-.05.16-.07.05-.02.09-.04.14-.05.03,0,.05-.02.08-.03.88-.33,1.79-.5,2.71-.5v-.37c-2.06.01-4.07.81-5.8,2.31h0c-3.11,2.7-5.16,7.46-5.12,12.87h.37c-.04-6.42,2.9-11.91,7.03-13.96,0,0,0,0,0,0Z"/>
            <Path fill="#fff" d="M36.76,38.56c-6.83-.53-13.51,2.58-17.51,8.21-2.57,3.61-3.83,7.87-3.66,12.3h.37c-.17-4.36,1.07-8.54,3.59-12.09,3.99-5.62,10.72-8.69,17.55-8.02l-.35-.4Z"/>
          </G>
        </Svg>
      </Animated.View>
      {text && !compact && (
        <Text style={styles.loadingText}>
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
    color: '#000000',
  },
});

export default LoadingScreen; 