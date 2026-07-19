import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';
import { useBuddyStore } from '../store/buddyStore';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function BuddyDetailScreen({ route, navigation }) {
  const { userId, displayName, linkId } = route.params;
  const theme = useTheme();
  const fetchBuddyCheckins = useBuddyStore((state) => state.fetchBuddyCheckins);
  const removeLink = useBuddyStore((state) => state.removeLink);

  const [checkins, setCheckins] = useState([]);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchBuddyCheckins(userId)
        .then((result) => {
          if (active) setCheckins(result.checkins);
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
      return () => {
        active = false;
      };
    }, [fetchBuddyCheckins, userId])
  );

  const confirmRemove = () => {
    Alert.alert('Remove buddy', `Stop sharing check-ins with ${displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeLink(linkId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <BackHeader title={displayName} />
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: -8, marginBottom: 16 }]}>
        Their recent check-ins
      </Text>

      {error ? (
        <Card>
          <Text style={[theme.typography.body, { color: theme.colors.danger }]}>{error}</Text>
        </Card>
      ) : checkins.length === 0 ? (
        <Card>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            No check-ins yet. Maybe send them some encouragement.
          </Text>
        </Card>
      ) : (
        checkins.map((checkin) => (
          <Card key={checkin.id}>
            <View style={styles.checkinHeader}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                {checkin.mood ? `Feeling ${checkin.mood}` : 'Checked in'}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {formatDate(checkin.created_at)}
              </Text>
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
              {checkin.streak_days} day streak · ${Number(checkin.money_saved || 0).toFixed(0)} kept
              {Number.isFinite(checkin.urge_level) && checkin.urge_level !== null
                ? ` · urge level ${checkin.urge_level}`
                : ''}
            </Text>
            {checkin.note ? (
              <Text style={[theme.typography.body, { color: theme.colors.text, marginTop: 10 }]}>
                “{checkin.note}”
              </Text>
            ) : null}
          </Card>
        ))
      )}

      <Button label="Remove buddy" variant="ghost" onPress={confirmRemove} style={styles.remove} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remove: {
    marginTop: 8,
    marginBottom: 12,
  },
});
