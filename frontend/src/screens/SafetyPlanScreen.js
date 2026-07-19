import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useSafetyPlanStore } from '../store/safetyPlanStore';

function linesToList(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function SafetyPlanScreen({ navigation }) {
  const theme = useTheme();
  const reasons = useSafetyPlanStore((state) => state.reasons);
  const actions = useSafetyPlanStore((state) => state.actions);
  const saving = useSafetyPlanStore((state) => state.saving);
  const ensureHydrated = useSafetyPlanStore((state) => state.ensureHydrated);
  const save = useSafetyPlanStore((state) => state.save);
  const [reasonsDraft, setReasonsDraft] = useState(reasons.join('\n'));
  const [actionsDraft, setActionsDraft] = useState(actions.join('\n'));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    ensureHydrated().then(() => {
      if (!active) return;
      const state = useSafetyPlanStore.getState();
      setReasonsDraft(state.reasons.join('\n'));
      setActionsDraft(state.actions.join('\n'));
    });

    return () => {
      active = false;
    };
  }, [ensureHydrated]);

  const onSave = async () => {
    const nextReasons = linesToList(reasonsDraft);
    const nextActions = linesToList(actionsDraft);

    if (!nextReasons.length || !nextActions.length) {
      setError('Add at least one recovery reason and one safe action.');
      return;
    }

    setError(null);
    await save({ reasons: nextReasons, actions: nextActions });
    navigation.goBack();
  };

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text }]}>My safety plan</Text>
      <Text
        style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}
      >
        Write these while you feel steady. Betapp will put them in front of you when an urge hits.
      </Text>

      <Card title="Why recovery matters to me" style={styles.firstCard}>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 8 },
          ]}
        >
          One reason per line
        </Text>
        <TextInput
          value={reasonsDraft}
          onChangeText={setReasonsDraft}
          placeholder={'My health\nMy relationships\nMy financial freedom'}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            theme.typography.body,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              color: theme.colors.text,
            },
          ]}
        />
      </Card>

      <Card title="Safe actions I can take">
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 8 },
          ]}
        >
          Keep each action small and immediately doable
        </Text>
        <TextInput
          value={actionsDraft}
          onChangeText={setActionsDraft}
          placeholder={'Leave the room\nCall a trusted person\nTake a short walk'}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            theme.typography.body,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              color: theme.colors.text,
            },
          ]}
        />
      </Card>

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginBottom: 12 }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Save safety plan" onPress={onSave} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </View>

      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
        ]}
      >
        Your safety plan is stored only on this device.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  firstCard: {
    marginTop: 24,
  },
  input: {
    minHeight: 132,
    borderWidth: 1,
    padding: 14,
  },
  actions: {
    gap: 10,
    marginBottom: 18,
  },
});
