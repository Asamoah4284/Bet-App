import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { ModalHeader } from '../components/ModalHeader';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

const OPTIONS = [
  {
    value: 'clean',
    icon: 'shield-checkmark-outline',
    title: 'I stayed gambling-free',
    copy: 'Confirm this day and continue your streak.',
    color: 'primary',
  },
  {
    value: 'slipped',
    icon: 'heart-outline',
    title: 'I gambled today',
    copy: 'Record the slip honestly and begin again without judgment.',
    color: 'secondary',
  },
];

export function DailyReflectionScreen({ navigation, route }) {
  const theme = useTheme();
  const todayKey = useHabitStore((state) => state.todayKey);
  const yesterdayKey = useHabitStore((state) => state.yesterdayKey);
  const todayReflection = useHabitStore((state) => state.todayReflection);
  const yesterdayReflection = useHabitStore((state) => state.yesterdayReflection);
  const confirmReflection = useHabitStore((state) => state.confirmReflection);
  const dayKey = route.params?.dayKey || todayKey;
  const isYesterday = dayKey === yesterdayKey;
  const existing = isYesterday ? yesterdayReflection : todayReflection;
  const [selected, setSelected] = useState(existing?.status || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    if (!selected) {
      setError('Choose the answer that reflects the day.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await confirmReflection({ dayKey, status: selected });
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <ModalHeader
        kicker="Daily reflection"
        title={isYesterday ? 'How did yesterday go?' : 'How did today go?'}
        subtitle="One honest answer keeps your streak meaningful. This reflection stays on your device."
        accent="secondary"
      />

      <View
        style={[
          styles.prompt,
          { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg },
        ]}
      >
        <Ionicons name="sparkles-outline" size={22} color={theme.colors.accent} />
        <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
          Did you stay gambling-free {isYesterday ? 'yesterday' : 'today'}?
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const active = selected === option.value;
          const color = theme.colors[option.color];
          const muted = theme.colors[`${option.color}Muted`];
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setSelected(option.value)}
              style={({ pressed }) => [
                styles.option,
                theme.elevation.card,
                {
                  backgroundColor: active ? muted : theme.colors.surface,
                  borderColor: active ? color : theme.colors.border,
                  borderRadius: theme.radii.lg,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: muted }]}>
                <Ionicons name={option.icon} size={25} color={color} />
              </View>
              <View style={styles.optionBody}>
                <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                  {option.title}
                </Text>
                <Text
                  style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 3 }]}
                >
                  {option.copy}
                </Text>
              </View>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={23}
                color={active ? color : theme.colors.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>

      {existing ? (
        <Text style={[theme.typography.caption, styles.correction, { color: theme.colors.textSecondary }]}>
          You already reflected on this day. Saving will correct your previous answer.
        </Text>
      ) : null}
      {error ? (
        <Text style={[theme.typography.caption, styles.error, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <Button
        label={existing ? 'Save correction' : 'Confirm reflection'}
        icon="checkmark-circle-outline"
        onPress={save}
        loading={saving}
        disabled={!dayKey}
        style={styles.save}
      />

      <View style={styles.reassurance}>
        <Ionicons name="lock-closed-outline" size={15} color={theme.colors.textSecondary} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, flex: 1 }]}>
          Betapp cannot monitor gambling activity. Your streak is based on the days you personally
          confirm.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    marginBottom: 16,
  },
  options: {
    gap: 12,
  },
  option: {
    minHeight: 104,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
  },
  correction: {
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    textAlign: 'center',
    marginTop: 12,
  },
  save: {
    marginTop: 20,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});
