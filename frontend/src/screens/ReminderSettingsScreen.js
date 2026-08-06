import { useCallback, useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BackHeader } from '../components/BackHeader';
import { Button } from '../components/Button';
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

function ToggleRow({ label, value, onValueChange }) {
  const theme = useTheme();
  return (
    <View style={styles.toggleRow}>
      <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
}

export function ReminderSettingsScreen() {
  const theme = useTheme();
  const settings = useReminderStore((state) => state.settings);
  const hydrated = useReminderStore((state) => state.hydrated);
  const permissionDenied = useReminderStore((state) => state.permissionDenied);
  const serverOwnsDailies = useReminderStore((state) => state.serverOwnsDailies);
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
        <Card style={{ borderColor: theme.colors.danger, marginBottom: 12 }}>
          <Text style={[theme.typography.body, { color: theme.colors.danger, marginBottom: 12 }]}>
            Notifications are turned off for Betapp. Enable them in your device settings to receive
            reminders.
          </Text>
          <Button label="Open device settings" onPress={() => Linking.openSettings()} />
        </Card>
      ) : null}

      <Card title="Daily reflection reminder">
        <ToggleRow
          label="Remind me to confirm whether I stayed gambling-free"
          value={settings.checkinEnabled}
          onValueChange={(value) => update({ checkinEnabled: value })}
        />
        <TimeStepper
          hour={settings.checkinHour}
          minute={settings.checkinMinute}
          disabled={!settings.checkinEnabled}
          onChange={(hour, minute) => update({ checkinHour: hour, checkinMinute: minute })}
        />
      </Card>

      <Card title="Daily encouragement">
        <ToggleRow
          label="Send me a supportive note each day"
          value={settings.encouragementEnabled}
          onValueChange={(value) => update({ encouragementEnabled: value })}
        />
        <TimeStepper
          hour={settings.encouragementHour}
          minute={settings.encouragementMinute}
          disabled={!settings.encouragementEnabled}
          onChange={(hour, minute) =>
            update({ encouragementHour: hour, encouragementMinute: minute })
          }
        />
      </Card>

      <Card title="Other nudges">
        <ToggleRow
          label="Buddy requests, accepts, and check-ins"
          value={settings.buddyEventsEnabled}
          onValueChange={(value) => update({ buddyEventsEnabled: value })}
        />
        <ToggleRow
          label="Streak milestone celebrations"
          value={settings.streakMilestonesEnabled}
          onValueChange={(value) => update({ streakMilestonesEnabled: value })}
        />
        <ToggleRow
          label="Gentle check-in after Urge SOS"
          value={settings.urgeFollowupEnabled}
          onValueChange={(value) => update({ urgeFollowupEnabled: value })}
        />
      </Card>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
        {serverOwnsDailies
          ? 'Daily reminders are delivered by Betapp push while you are signed in. Event nudges also use push.'
          : 'Daily reminders are scheduled on this device. Sign in on a development or production build for remote push delivery.'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepperRow: {
    marginTop: 8,
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
