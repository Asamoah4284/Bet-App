import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { ModalHeader } from '../components/ModalHeader';
import { useTheme } from '../theme';
import { useHabitStore } from '../store/habitStore';

const EMOTIONS = ['stressed', 'bored', 'lonely', 'sad', 'excited', 'angry'];
const LOCATIONS = ['home', 'work', 'out', 'online'];

export function LogUrgeScreen({ navigation }) {
  const theme = useTheme();
  const logUrge = useHabitStore((state) => state.logUrge);

  const [intensity, setIntensity] = useState(5);
  const [emotion, setEmotion] = useState(null);
  const [location, setLocation] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await logUrge({ intensity, emotion, location, note: note.trim() });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <ModalHeader
        kicker="Log urge"
        title="You noticed an urge"
        subtitle="That awareness is the hard part. Log it, breathe, and let it pass."
        accent="secondary"
      />

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
        How strong is it?
      </Text>
      <View style={styles.sliderRow}>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={intensity}
          onValueChange={setIntensity}
          minimumTrackTintColor={theme.colors.secondary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.secondary}
        />
        <Text style={[theme.typography.title, { color: theme.colors.secondary, width: 42 }]}>
          {intensity}
        </Text>
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        What are you feeling?
      </Text>
      <View style={styles.chips}>
        {EMOTIONS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={emotion === item}
            onPress={() => setEmotion(emotion === item ? null : item)}
          />
        ))}
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        Where are you?
      </Text>
      <View style={styles.chips}>
        {LOCATIONS.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={location === item}
            onPress={() => setLocation(location === item ? null : item)}
          />
        ))}
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 6 }]}>
        Anything else? (optional)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What triggered it?"
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
        <Button label="Save urge log" onPress={onSave} loading={saving} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
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
