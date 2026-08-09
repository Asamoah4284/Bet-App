import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { ModalHeader } from '../components/ModalHeader';
import { useTheme } from '../theme';
import { useSafetyPlanStore } from '../store/safetyPlanStore';
import { useReminderStore } from '../store/reminderStore';
import { useAuthStore } from '../store/authStore';
import { notificationsApi } from '../services/api';
import { scheduleUrgeFollowupLocal } from '../services/notifications';

const SESSION_SECONDS = 60;

function breathingCue(seconds) {
  const position = (SESSION_SECONDS - seconds) % 10;
  if (position < 4) return 'In';
  if (position < 6) return 'Hold';
  return 'Out';
}

function ActionChip({ icon, label, color, muted, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.chipIcon, { backgroundColor: muted }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.chipLabel, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function UrgeSOSScreen({ navigation }) {
  const theme = useTheme();
  const reasons = useSafetyPlanStore((state) => state.reasons);
  const actions = useSafetyPlanStore((state) => state.actions);
  const ensureHydrated = useSafetyPlanStore((state) => state.ensureHydrated);
  const urgeFollowupEnabled = useReminderStore((state) => state.settings.urgeFollowupEnabled);
  const token = useAuthStore((state) => state.token);
  const [seconds, setSeconds] = useState(SESSION_SECONDS);
  const [running, setRunning] = useState(true);
  const breath = useRef(new Animated.Value(0)).current;
  const followupScheduled = useRef(false);

  useEffect(() => {
    ensureHydrated();
  }, [ensureHydrated]);

  useEffect(() => {
    if (seconds > 0 || followupScheduled.current || !urgeFollowupEnabled) {
      return;
    }
    followupScheduled.current = true;

    async function scheduleFollowup() {
      if (token) {
        try {
          const result = await notificationsApi.scheduleUrgeFollowup(token);
          if (result?.scheduled) {
            return;
          }
        } catch {
          // Fall through to local schedule.
        }
      }
      await scheduleUrgeFollowupLocal().catch(() => {});
    }

    scheduleFollowup();
  }, [seconds, urgeFollowupEnabled, token]);

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
    () => (seconds === 0 ? 'You made it through' : breathingCue(seconds)),
    [seconds]
  );

  const circleScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.74, 1],
  });

  const restart = () => {
    breath.setValue(0);
    setSeconds(SESSION_SECONDS);
    setRunning(true);
  };

  const openTab = (screen) => {
    navigation.navigate('Main', { screen });
  };

  const topReasons = reasons.slice(0, 2);
  const topActions = actions.slice(0, 3);

  return (
    <Screen scroll contentStyle={styles.screen}>
      <ModalHeader kicker="Urge SOS" title="Ride it out" accent="secondary" />

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.breathCard, { borderRadius: theme.radii.lg }]}
      >
        <Text style={styles.breathEyebrow}>60-second breathe</Text>
        <Animated.View
          style={[
            styles.breathCircle,
            {
              backgroundColor: 'rgba(255,255,255,0.16)',
              borderColor: 'rgba(255,255,255,0.42)',
              transform: [{ scale: circleScale }],
            },
          ]}
        >
          <Text style={styles.timer}>{seconds}</Text>
          <Text style={styles.timerCue}>{cue}</Text>
        </Animated.View>

        <Pressable
          accessibilityRole="button"
          onPress={seconds > 0 ? () => setRunning((c) => !c) : restart}
          style={styles.timerAction}
        >
          <Ionicons
            name={seconds === 0 ? 'refresh' : running ? 'pause' : 'play'}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.timerActionLabel}>
            {seconds === 0 ? 'Again' : running ? 'Pause' : 'Resume'}
          </Text>
        </Pressable>
      </LinearGradient>

      {topActions.length ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            DO ONE THING
          </Text>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
              },
            ]}
          >
            {topActions.map((action, index) => (
              <View
                key={`${action}-${index}`}
                style={[
                  styles.planRow,
                  index < topActions.length - 1
                    ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border }
                    : null,
                ]}
              >
                <View
                  style={[
                    styles.number,
                    { backgroundColor: theme.colors.secondaryMuted },
                  ]}
                >
                  <Text style={[styles.numberText, { color: theme.colors.secondary }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.planText, { color: theme.colors.text }]} numberOfLines={2}>
                  {action}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {topReasons.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              YOUR WHY
            </Text>
            <Pressable onPress={() => navigation.navigate('SafetyPlan')} hitSlop={8}>
              <Text style={[styles.editLink, { color: theme.colors.primary }]}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.reasonList}>
            {topReasons.map((reason, index) => (
              <View
                key={`${reason}-${index}`}
                style={[
                  styles.reasonChip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name="heart" size={14} color={theme.colors.secondary} />
                <Text
                  style={[styles.reasonText, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.chipRow}>
        <ActionChip
          icon="create-outline"
          label="Log urge"
          color={theme.colors.primary}
          muted={theme.colors.primaryMuted}
          onPress={() => navigation.replace('LogUrge')}
        />
        <ActionChip
          icon="people-outline"
          label="Buddies"
          color={theme.colors.secondary}
          muted={theme.colors.secondaryMuted}
          onPress={() => openTab('Buddies')}
        />
        <ActionChip
          icon="heart-outline"
          label="Support"
          color={theme.colors.accent}
          muted={theme.colors.accentMuted}
          onPress={() => openTab('Support')}
        />
      </View>

      <Button
        label="I'm okay for now"
        variant="soft"
        onPress={() => navigation.goBack()}
        style={styles.okButton}
      />

      <Text style={[styles.crisis, { color: theme.colors.textMuted }]}>
        In crisis? Call emergency services.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 28,
  },
  breathCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  breathEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  breathCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -1,
  },
  timerCue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  timerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  timerActionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  editLink: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  panel: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  reasonList: {
    gap: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  okButton: {
    marginBottom: 14,
  },
  crisis: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
});
