import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useOnboardingStore } from '../store/onboardingStore';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    key: 'control',
    image: require('../../assets/onboarding/control.png'),
    tag: 'Take back control',
    title: 'Your recovery,\none steady step at a time',
    body: 'Pause urges with calm breathing tools, notice your patterns without judgment, and build a plan that fits your life.',
    accent: 'primary',
  },
  {
    key: 'progress',
    image: require('../../assets/onboarding/progress.png'),
    tag: 'Watch it add up',
    title: 'Progress you can\nactually see and feel',
    body: 'Count gambling-free days, watch the money you kept grow, and celebrate the small wins that rebuild confidence.',
    accent: 'secondary',
  },
  {
    key: 'support',
    image: require('../../assets/onboarding/support.png'),
    tag: 'Never alone',
    title: 'Real support,\nright when you need it',
    body: 'Team up with a trusted buddy, share daily check-ins, and reach helplines instantly on the hardest days.',
    accent: 'accent',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const isLast = index === PAGES.length - 1;

  const goNext = async () => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    await completeOnboarding();
  };

  const accentColor = (page) => theme.colors[page.accent];
  const accentMuted = (page) =>
    theme.colors[`${page.accent}Muted`] ?? theme.colors.primaryMuted;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topRow}>
        <ThemeToggle compact />
        <Pressable onPress={completeOnboarding} hitSlop={12}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={(event) => {
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item, index: pageIndex }) => {
          const inputRange = [
            (pageIndex - 1) * width,
            pageIndex * width,
            (pageIndex + 1) * width,
          ];

          const imageTranslate = scrollX.interpolate({
            inputRange,
            outputRange: [width * 0.25, 0, -width * 0.25],
          });
          const imageScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
          });
          const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
          });
          const textTranslate = scrollX.interpolate({
            inputRange,
            outputRange: [24, 0, 24],
          });

          return (
            <View style={[styles.page, { width }]}>
              <Animated.View
                style={[
                  styles.imageCard,
                  theme.elevation.card,
                  {
                    borderRadius: theme.radii.lg + 8,
                    transform: [{ translateX: imageTranslate }, { scale: imageScale }],
                  },
                ]}
              >
                {/* Slightly over-scaled to crop the image's own baked-in corners */}
                <Image source={item.image} style={styles.image} resizeMode="cover" />
              </Animated.View>

              <Animated.View
                style={[
                  styles.textBlock,
                  { opacity: textOpacity, transform: [{ translateY: textTranslate }] },
                ]}
              >
                <View
                  style={[
                    styles.tag,
                    {
                      backgroundColor: accentMuted(item),
                      borderRadius: theme.radii.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: accentColor(item), fontWeight: '700' },
                    ]}
                  >
                    {item.tag}
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.title,
                    styles.title,
                    { color: theme.colors.text },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    styles.body,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.body}
                </Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View style={styles.dots}>
        {PAGES.map((page, pageIndex) => {
          const inputRange = [
            (pageIndex - 1) * width,
            pageIndex * width,
            (pageIndex + 1) * width,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 26, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={page.key}
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

      <View style={styles.actions}>
        <Button label={isLast ? 'Get started' : 'Continue'} onPress={goNext} />
      </View>
    </Screen>
  );
}

const IMAGE_SIZE = Math.min(width - 88, 340);

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  page: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  imageCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    overflow: 'hidden',
  },
  image: {
    width: IMAGE_SIZE * 1.12,
    height: IMAGE_SIZE * 1.12,
    marginLeft: -IMAGE_SIZE * 0.06,
    marginTop: -IMAGE_SIZE * 0.06,
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginTop: 28,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  title: {
    marginTop: 14,
  },
  body: {
    marginTop: 10,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
});
