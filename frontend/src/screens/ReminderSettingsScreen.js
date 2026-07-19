import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';
import { useReminderStore } from '../store/reminderStore';
import { formatTime } from '../services/notifications';

function TimeStepper({ hour, minute, onChange, disabled }) {
  const theme = useTheme();

  const adjust = (deltaHour, deltaMinute) => {
    let total = hour * 60 + minute + deltaHour * 60 + deltaMinute;
    total = ((total % 1440) + 1440) % 1440;
    onChange(Math.floor(total / 60), total % 60);
  };

  const StepButton = ({ icon, onPress, label }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.sm,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
    </Pressable>
  );

  return (
    <View style={[styles.stepperRow, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={styles.stepperGroup}>
        <StepButton icon="remove" label="Earlier by an hour" onPress={() => adjust(-1, 0)} />
        <Text style={[theme.typography.subtitle, { color: theme.colors.text, minWidth: 96, textAlign: 'center' }]}>
          {formatTime(hour, minute)}
        </Text>
        <StepButton icon="add" label="Later by an hour" onPress={() => adjust(1, 0)} />
      </View>
      <View style={styles.stepperGroup}>
        <StepButton icon="remove-circle-outline" label="Earlier by 15 minutes" onPress={() => adjust(0, -15)} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>15 min</Text>
        <StepButton icon="add-circle-outline" label="Later by 15 minutes" onPress={() => adjust(0, 15)} />
      </View>
    </View>
  );
}

export function ReminderSettingsScreen() {
  const theme = useTheme();
  const settings = useReminderStore((state) => state.settings);
  const hydrated = useReminderStore((state) => state.hydrated);
  const permissionDenied = useReminderStore((state) => state.permissionDenied);
  const hydrate = useReminderStore((state) => state.hydrate);
  const update = useReminderStore((state) => state.update);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  useFocusEffect(
    useCallback(() => {
      if (hydrated) {
        hydrate();
      }
    }, [hydrated, hydrate])
  );

  return (
    <Screen scroll>
      <BackHeader title="Reminders" />
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: -8, marginBottom: 20 }]}>
        Gentle nudges, never pressure. Set the times that support your routine.
      </Text>

      {permissionDenied ? (
        <Card style={{ borderColor: theme.colors.danger }}>
          <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
            Notifications are turned off for Betapp. Enable them in your device settings to receive
            reminders.
          </Text>
        </Card>
      ) : null}

      <Card title="Daily reflection reminder">
        <View style={styles.toggleRow}>
          <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
            Remind me to confirm whether I stayed gambling-free
          </Text>
          <Switch
            value={settings.checkinEnabled}
            onValueChange={(value) => update({ checkinEnabled: value })}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
        <TimeStepper
          hour={settings.checkinHour}
          minute={settings.checkinMinute}
          disabled={!settings.checkinEnabled}
          onChange={(hour, minute) => update({ checkinHour: hour, checkinMinute: minute })}
        />
      </Card>

      <Card title="Daily encouragement">
        <View style={styles.toggleRow}>
          <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
            Send me a supportive note each day
          </Text>
          <Switch
            value={settings.encouragementEnabled}
            onValueChange={(value) => update({ encouragementEnabled: value })}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
            thumbColor={theme.colors.surface}
          />
        </View>
        <TimeStepper
          hour={settings.encouragementHour}
          minute={settings.encouragementMinute}
          disabled={!settings.encouragementEnabled}
          onChange={(hour, minute) =>
            update({ encouragementHour: hour, encouragementMinute: minute })
          }
        />
      </Card>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
        Reminders are scheduled on this device only. They won't fire in the Expo Go simulator.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperRow: {
    marginTop: 16,
    gap: 12,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
