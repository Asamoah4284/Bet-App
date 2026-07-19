import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { useTheme } from '../theme';
import { useBuddyStore } from '../store/buddyStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';

const MOODS = ['great', 'good', 'okay', 'low', 'struggling'];

export function CheckinScreen({ navigation }) {
  const theme = useTheme();
  const postCheckin = useBuddyStore((state) => state.postCheckin);
  const streakDays = useHabitStore((state) => state.streakDays);
  const moneyKept = useFinanceStore((state) => state.summary.moneyKept);

  const [mood, setMood] = useState(null);
  const [urgeLevel, setUrgeLevel] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!mood) {
      setError('Pick a mood first');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await postCheckin({
        mood,
        urgeLevel: urgeLevel > 0 ? urgeLevel : undefined,
        note: note.trim() || undefined,
        streakDays,
        moneySaved: Math.max(0, moneyKept),
      });
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text }]}>Daily check-in</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
        Your buddies will see this. Your streak ({streakDays} days) and money kept ($
        {Math.max(0, moneyKept).toFixed(0)}) are attached automatically.
      </Text>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 28 }]}>
        How are you doing?
      </Text>
      <View style={styles.chips}>
        {MOODS.map((item) => (
          <Chip key={item} label={item} selected={mood === item} onPress={() => setMood(item)} />
        ))}
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        Urge level today (0 = none)
      </Text>
      <View style={styles.sliderRow}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={urgeLevel}
          onValueChange={setUrgeLevel}
          minimumTrackTintColor={theme.colors.secondary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.secondary}
        />
        <Text style={[theme.typography.title, { color: theme.colors.secondary, width: 42 }]}>
          {urgeLevel}
        </Text>
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 6 }]}>
        Note for your buddies (optional)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="How did today go?"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        style={[
          styles.noteInput,
          theme.typography.body,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            color: theme.colors.text,
          },
        ]}
      />

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 10 }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button label="Post check-in" onPress={onSubmit} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
  },
  actions: {
    marginTop: 24,
    gap: 10,
    paddingBottom: 12,
  },
});
