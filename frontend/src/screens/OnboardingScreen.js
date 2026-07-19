import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useOnboardingStore } from '../store/onboardingStore';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    key: 'control',
    icon: 'leaf-outline',
    title: 'Regain your sense of control',
    body: 'Pause urges with calm tools, notice patterns without judgment, and take one steady step at a time.',
  },
  {
    key: 'progress',
    icon: 'trending-up-outline',
    title: 'See progress you can feel',
    body: 'Track gambling-free days, money kept, and the small wins that rebuild confidence over time.',
  },
  {
    key: 'support',
    icon: 'people-outline',
    title: 'Stay supported, not alone',
    body: 'Connect with a trusted accountability buddy and keep check-ins close when you need encouragement.',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const goNext = async () => {
    if (index < PAGES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
      return;
    }

    await completeOnboarding();
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topRow}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Welcome to Betapp
        </Text>
        <ThemeToggle compact />
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: width - 48 }]}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.colors.primaryMuted,
                  borderRadius: theme.radii.lg,
                },
              ]}
            >
              <Ionicons name={item.icon} size={36} color={theme.colors.primary} />
            </View>
            <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 28 }]}>
              {item.title}
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 12 },
              ]}
            >
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {PAGES.map((page, pageIndex) => (
          <View
            key={page.key}
            style={[
              styles.dot,
              {
                backgroundColor:
                  pageIndex === index ? theme.colors.primary : theme.colors.border,
                width: pageIndex === index ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={index === PAGES.length - 1 ? 'Get started' : 'Continue'}
          onPress={goNext}
        />
        {index < PAGES.length - 1 ? (
          <Button label="Skip" variant="ghost" onPress={completeOnboarding} style={styles.skip} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  page: {
    paddingTop: 28,
    paddingRight: 8,
  },
  iconWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  actions: {
    gap: 10,
    paddingBottom: 8,
  },
  skip: {
    marginTop: 2,
  },
});
