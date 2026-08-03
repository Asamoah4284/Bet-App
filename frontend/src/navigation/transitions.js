import { Animated, Easing, Platform } from 'react-native';

const OPEN_MS = 280;
const CLOSE_MS = 260;

const timing = {
  animation: 'timing',
  config: {
    duration: OPEN_MS,
    easing: Easing.out(Easing.cubic),
  },
};

const timingClose = {
  animation: 'timing',
  config: {
    duration: CLOSE_MS,
    easing: Easing.out(Easing.cubic),
  },
};

/**
 * Pure horizontal slide — translateX only, no opacity.
 * Opacity interpolators are what caused the fade/blink.
 */
export function forSlideFromRight({ current, inverted, layouts }) {
  const { width } = layouts.screen;

  const translateX = Animated.multiply(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [width, 0],
      extrapolate: 'clamp',
    }),
    inverted
  );

  return {
    cardStyle: {
      transform: [{ translateX }],
    },
  };
}

/** Modal rises from bottom — translateY only, dim overlay (no card fade). */
export function forSlideFromBottom({ current, layouts }) {
  const { height } = layouts.screen;

  return {
    cardStyle: {
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [height, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.4],
        extrapolate: 'clamp',
      }),
      backgroundColor: '#0F1419',
    },
  };
}

export function createSlideScreenOptions(backgroundColor) {
  return {
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    gestureResponseDistance: Platform.OS === 'ios' ? 50 : 40,
    cardOverlayEnabled: false,
    cardShadowEnabled: false,
    cardStyle: { backgroundColor, flex: 1 },
    transitionSpec: {
      open: timing,
      close: timingClose,
    },
    cardStyleInterpolator: forSlideFromRight,
    presentation: 'card',
  };
}

export function createSlideModalOptions(backgroundColor) {
  return {
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'vertical',
    gestureResponseDistance: 120,
    cardOverlayEnabled: true,
    cardShadowEnabled: false,
    cardStyle: { backgroundColor, flex: 1 },
    transitionSpec: {
      open: timing,
      close: timingClose,
    },
    cardStyleInterpolator: forSlideFromBottom,
    presentation: 'modal',
  };
}
