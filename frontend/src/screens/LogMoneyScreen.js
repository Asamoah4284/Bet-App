import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { useTheme } from '../theme';
import { useFinanceStore } from '../store/financeStore';

export function LogMoneyScreen({ navigation }) {
  const theme = useTheme();
  const logMoney = useFinanceStore((state) => state.logMoney);

  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('saved');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await logMoney({ amount: value, kind, note: note.trim() });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text }]}>Log money</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
        Both wins and slips count. Honesty keeps the picture real — no judgment either way.
      </Text>

      <View style={styles.kindRow}>
        <Chip
          label="Set aside (win)"
          selected={kind === 'saved'}
          onPress={() => setKind('saved')}
        />
        <Chip label="Slipped" selected={kind === 'slip'} onPress={() => setKind('slip')} />
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 6 }]}>
        Amount
      </Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="numeric"
        style={[
          styles.input,
          theme.typography.body,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
            color: theme.colors.text,
          },
        ]}
      />
      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 6 }]}>
          {error}
        </Text>
      ) : null}

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 6 }]}>
        Note (optional)
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={kind === 'saved' ? 'e.g. skipped a betting site deposit' : 'What happened?'}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          styles.input,
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
        <Button label="Save" onPress={onSave} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kindRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  actions: {
    marginTop: 24,
    gap: 10,
    paddingBottom: 12,
  },
});
