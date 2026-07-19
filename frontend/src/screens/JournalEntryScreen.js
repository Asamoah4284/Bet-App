import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { ModalHeader } from '../components/ModalHeader';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

const MOODS = ['great', 'good', 'okay', 'low', 'struggling'];

export function JournalEntryScreen({ navigation }) {
  const theme = useTheme();
  const todayEntry = useHabitStore((state) => state.todayEntry);
  const saveJournalEntry = useHabitStore((state) => state.saveJournalEntry);

  const [mood, setMood] = useState(todayEntry?.mood || null);
  const [note, setNote] = useState(todayEntry?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSave = async () => {
    if (!mood) {
      setError('Pick a mood first');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveJournalEntry({ mood, note: note.trim() });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <ModalHeader
        kicker="Journal"
        title="Today's journal"
        subtitle="A short honest note keeps you connected to your progress."
      />

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
        How are you feeling today?
      </Text>
      <View style={styles.chips}>
        {MOODS.map((item) => (
          <Chip key={item} label={item} selected={mood === item} onPress={() => setMood(item)} />
        ))}
      </View>
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 8 }]}>
          {error}
        </Text>
      ) : null}

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 6 }]}>
        Notes (optional)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What happened today? What helped?"
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

      <View style={styles.actions}>
        <Button label="Save entry" onPress={onSave} loading={saving} />
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
  noteInput: {
    minHeight: 120,
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
