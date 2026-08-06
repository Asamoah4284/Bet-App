import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { useTheme } from '../theme';
import { useOnboardingStore } from '../store/onboardingStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.min(SCREEN_H * 0.52, 460);

const PAGES = [
  {
    key: 'control',
    image: require('../../assets/onboarding/control.png'),
    kicker: 'Find your bearings',
    title: 'Take back control,\none calm step at a time',
    body: 'Pause urges with steady tools, notice patterns without judgment, and rebuild on your own terms.',
    glow: ['#1E3A5F', '#2A9D8F'],
  },
  {
    key: 'progress',
    image: require('../../assets/onboarding/progress.png'),
    kicker: 'See the difference',
    title: 'Progress you can\nfeel and measure',
    body: 'Count gambling-free days, watch the money you kept grow, and mark the wins that rebuild confidence.',
    glow: ['#152A45', '#1F7F73'],
  },
  {
    key: 'support',
    image: require('../../assets/onboarding/support.png'),
    kicker: 'Stay connected',
    title: 'Support when you\nneed it most',
    body: 'Lean on a trusted buddy, share check-ins, and reach helplines in a tap on the hardest days.',
    glow: ['#1E3A5F', '#4CAF87'],
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const isLast = index === PAGES.length - 1;
  const page = PAGES[index];

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enter, float]);

  const goTo = (nextIndex) => {
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setIndex(nextIndex);
  };

  const goNext = async () => {
    if (!isLast) {
      goTo(index + 1);
      return;
    }
    await completeOnboarding();
  };

  const goBack = () => {
    if (index > 0) goTo(index - 1);
  };

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const screenOpacity = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const screenLift = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.colors.statusBar} />

      {/* Soft atmosphere that shifts with the active page */}
      <LinearGradient
        colors={[...page.glow.map((c) => `${c}22`), theme.colors.background]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orb,
          {
            backgroundColor: page.glow[1],
            opacity: 0.16,
            transform: [{ translateY: floatY }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.safe,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12),
            opacity: screenOpacity,
            transform: [{ translateY: screenLift }],
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <BrandMark size={34} />
            <Text style={[styles.brandWord, { color: theme.colors.text }]}>Quibet</Text>
          </View>
          <Pressable onPress={completeOnboarding} hitSlop={14} style={styles.skipHit}>
            <Text style={[styles.skip, { color: theme.colors.textSecondary }]}>Skip</Text>
          </Pressable>
        </View>

        <Animated.FlatList
          ref={listRef}
          style={styles.pager}
          data={PAGES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          onMomentumScrollEnd={(event) => {
            setIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_W));
          }}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          renderItem={({ item, index: pageIndex }) => {
            const inputRange = [
              (pageIndex - 1) * SCREEN_W,
              pageIndex * SCREEN_W,
              (pageIndex + 1) * SCREEN_W,
            ];

            const imageScale = scrollX.interpolate({
              inputRange,
              outputRange: [1.08, 1, 1.08],
              extrapolate: 'clamp',
            });
            const imageShift = scrollX.interpolate({
              inputRange,
              outputRange: [SCREEN_W * 0.12, 0, -SCREEN_W * 0.12],
              extrapolate: 'clamp',
            });
            const copyOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            });
            const copyY = scrollX.interpolate({
              inputRange,
              outputRange: [28, 0, 28],
              extrapolate: 'clamp',
            });

            return (
              <View style={[styles.page, { width: SCREEN_W }]}>
                <View style={styles.hero}>
                  <Animated.View
                    style={[
                      styles.heroArt,
                      {
                        transform: [{ translateX: imageShift }, { scale: imageScale }],
                      },
                    ]}
                  >
                    <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
                  </Animated.View>
                  <LinearGradient
                    colors={[
                      'transparent',
                      theme.mode === 'dark' ? 'rgba(20,22,26,0.55)' : 'rgba(244,246,249,0.55)',
                      theme.colors.background,
                    ]}
                    locations={[0.35, 0.72, 1]}
                    style={styles.heroFade}
                  />
                </View>

                <Animated.View
                  style={[
                    styles.copy,
                    { opacity: copyOpacity, transform: [{ translateY: copyY }] },
                  ]}
                >
                  <Text style={[styles.kicker, { color: theme.colors.secondary }]}>
                    {item.kicker}
                  </Text>
                  <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                  <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                    {item.body}
                  </Text>
                </Animated.View>
              </View>
            );
          }}
        />

        <View style={styles.footer}>
          <View style={styles.progressRow}>
            <Text style={[styles.stepLabel, { color: theme.colors.textMuted }]}>
              {String(index + 1).padStart(2, '0')}
              <Text style={{ color: theme.colors.textSecondary }}>
                {'  /  '}
                {String(PAGES.length).padStart(2, '0')}
              </Text>
            </Text>
            <View style={styles.dots}>
              {PAGES.map((p, pageIndex) => {
                const inputRange = [
                  (pageIndex - 1) * SCREEN_W,
                  pageIndex * SCREEN_W,
                  (pageIndex + 1) * SCREEN_W,
                ];
                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 28, 8],
                  extrapolate: 'clamp',
                });
                const dotOpacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.28, 1, 0.28],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={p.key}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: theme.colors.primary,
                        width: dotWidth,
                        opacity: dotOpacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            {index > 0 ? (
              <Pressable
                onPress={goBack}
                style={[
                  styles.backBtn,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text style={[styles.backLabel, { color: theme.colors.text }]}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.backSpacer} />
            )}
            <Button
              label={isLast ? 'Get started' : 'Continue'}
              onPress={goNext}
              icon={isLast ? 'arrow-forward' : undefined}
              style={styles.primaryBtn}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W,
    top: -SCREEN_W * 0.18,
    alignSelf: 'center',
    left: SCREEN_W * 0.05,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandWord: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  skipHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skip: {
    fontSize: 14,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  hero: {
    height: HERO_H,
    width: SCREEN_W,
    overflow: 'hidden',
  },
  heroArt: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    width: '100%',
    height: '108%',
    marginTop: -HERO_H * 0.02,
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  copy: {
    paddingHorizontal: 28,
    marginTop: -28,
  },
  kicker: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  body: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    maxWidth: 360,
  },
  footer: {
    paddingHorizontal: 22,
    marginTop: 'auto',
    gap: 18,
    paddingTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  backSpacer: {
    width: 0,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
  },
});
