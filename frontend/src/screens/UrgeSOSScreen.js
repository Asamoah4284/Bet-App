import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useSafetyPlanStore } from '../store/safetyPlanStore';

const SESSION_SECONDS = 60;

function breathingCue(seconds) {
  const position = (SESSION_SECONDS - seconds) % 10;
  if (position < 4) return 'Breathe in';
  if (position < 6) return 'Hold gently';
  return 'Breathe out';
}

export function UrgeSOSScreen({ navigation }) {
  const theme = useTheme();
  const reasons = useSafetyPlanStore((state) => state.reasons);
  const actions = useSafetyPlanStore((state) => state.actions);
  const ensureHydrated = useSafetyPlanStore((state) => state.ensureHydrated);
  const [seconds, setSeconds] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(true);
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ensureHydrated();
  }, [ensureHydrated]);

  useEffect(() => {
    if (!running || seconds <= 0) return undefined;

    const interval = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, seconds]);

  useEffect(() => {
    if (!running || seconds <= 0) {
      breath.stopAnimation();
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(breath, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [breath, running]);

  const cue = useMemo(
    () => (seconds === 0 ? 'You made space between the urge and the action.' : breathingCue(seconds)),
    [seconds]
  );

  const circleScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const restart = () => {
    breath.setValue(0);
    setSeconds(SESSION_SECONDS);
    setRunning(true);
  };

  const openTab = (screen) => {
    navigation.navigate('Main', { screen });
  };

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[theme.typography.caption, { color: theme.colors.secondary }]}>
            URGE SOS
          </Text>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>
            This feeling will pass
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close urge support"
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Ionicons name="close" size={28} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.breathCard, { borderRadius: theme.radii.lg }]}
      >
        <Animated.View
          style={[
            styles.breathCircle,
            {
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.5)',
              transform: [{ scale: circleScale }],
            },
          ]}
        >
          <Text style={[styles.timer, { color: theme.colors.textInverse }]}>{seconds}</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textInverse }]}>
            seconds
          </Text>
        </Animated.View>
        <Text style={[theme.typography.subtitle, { color: theme.colors.textInverse }]}>
          {cue}
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textInverse, opacity: 0.82, marginTop: 4 },
          ]}
        >
          Slow is enough. You do not need to decide anything right now.
        </Text>
        <View style={styles.timerActions}>
          {seconds > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setRunning((current) => !current)}
              style={styles.timerAction}
            >
              <Ionicons
                name={running ? 'pause' : 'play'}
                size={18}
                color={theme.colors.textInverse}
              />
              <Text style={[theme.typography.caption, { color: theme.colors.textInverse }]}>
                {running ? 'Pause' : 'Continue'}
              </Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={restart} style={styles.timerAction}>
              <Ionicons name="refresh" size={18} color={theme.colors.textInverse} />
              <Text style={[theme.typography.caption, { color: theme.colors.textInverse }]}>
                Breathe again
              </Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <Card title="Why you choose recovery">
        {reasons.map((reason, index) => (
          <View key={`${reason}-${index}`} style={styles.planRow}>
            <Ionicons name="heart-outline" size={19} color={theme.colors.accent} />
            <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
              {reason}
            </Text>
          </View>
        ))}
        <Button
          label="Edit my safety plan"
          variant="soft"
          onPress={() => navigation.navigate('SafetyPlan')}
          style={styles.cardButton}
        />
      </Card>

      <Card title="Do one safe thing now">
        {actions.map((action, index) => (
          <View key={`${action}-${index}`} style={styles.planRow}>
            <View
              style={[
                styles.number,
                {
                  backgroundColor: theme.colors.secondaryMuted,
                  borderRadius: theme.radii.pill,
                },
              ]}
            >
              <Text style={[theme.typography.caption, { color: theme.colors.secondary }]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
              {action}
            </Text>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Log what triggered this"
          onPress={() => navigation.replace('LogUrge')}
        />
        <Button
          label="Reach my buddies"
          variant="secondary"
          onPress={() => openTab('Buddies')}
        />
        <Button label="Find immediate support" variant="ghost" onPress={() => openTab('Support')} />
      </View>

      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
        ]}
      >
        If you may harm yourself or someone else, contact emergency services now.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWrap: {
    flex: 1,
    gap: 3,
    paddingRight: 12,
  },
  breathCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  breathCircle: {
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 54,
  },
  timerActions: {
    marginTop: 16,
  },
  timerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  number: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButton: {
    marginTop: 4,
  },
  actions: {
    gap: 10,
    marginBottom: 18,
  },
});
