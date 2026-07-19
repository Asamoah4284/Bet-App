import { useCallback, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useBuddyStore } from '../store/buddyStore';

export function BuddiesScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const buddies = useBuddyStore((state) => state.buddies);
  const incomingRequests = useBuddyStore((state) => state.incomingRequests);
  const outgoingRequests = useBuddyStore((state) => state.outgoingRequests);
  const error = useBuddyStore((state) => state.error);
  const refresh = useBuddyStore((state) => state.refresh);
  const sendRequest = useBuddyStore((state) => state.sendRequest);
  const acceptRequest = useBuddyStore((state) => state.acceptRequest);
  const removeLink = useBuddyStore((state) => state.removeLink);

  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const shareCode = async () => {
    if (!user?.buddyCode) return;
    await Share.share({
      message: `Add me as your accountability buddy on Betapp! My buddy code is ${user.buddyCode}`,
    });
  };

  const onSendRequest = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await sendRequest(code.trim().toUpperCase());
      setMessage(result);
      setCode('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={[theme.typography.title, { color: theme.colors.text, marginBottom: 16 }]}>
        Buddies
      </Text>

      <Card title="Your buddy code">
        <View style={styles.codeRow}>
          <Text style={[theme.typography.display, { color: theme.colors.primary }]}>
            {user?.buddyCode || '—'}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Share buddy code" onPress={shareCode} hitSlop={8}>
            <Ionicons name="share-outline" size={26} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 6 }]}>
          Share this with someone you trust so you can check in on each other.
        </Text>
      </Card>

      <Card title="Add a buddy">
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter their buddy code"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
          style={[
            styles.codeInput,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              color: theme.colors.text,
            },
          ]}
        />
        <Button label="Send request" onPress={onSendRequest} loading={busy} style={styles.cardButton} />
        {message ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 10 }]}>
            {message}
          </Text>
        ) : null}
      </Card>

      {incomingRequests.length > 0 ? (
        <Card title="Incoming requests">
          {incomingRequests.map((request) => (
            <View key={request.linkId} style={styles.requestRow}>
              <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                {request.displayName}
              </Text>
              <Button
                label="Accept"
                variant="secondary"
                onPress={() => acceptRequest(request.linkId)}
                style={styles.smallButton}
              />
              <Button
                label="Decline"
                variant="ghost"
                onPress={() => removeLink(request.linkId)}
                style={styles.smallButton}
              />
            </View>
          ))}
        </Card>
      ) : null}

      {outgoingRequests.length > 0 ? (
        <Card title="Sent requests">
          {outgoingRequests.map((request) => (
            <View key={request.linkId} style={styles.requestRow}>
              <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                {request.displayName} (pending)
              </Text>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => removeLink(request.linkId)}
                style={styles.smallButton}
              />
            </View>
          ))}
        </Card>
      ) : null}

      <Card title={`Your buddies (${buddies.length})`}>
        {buddies.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            No buddies yet. Recovery is easier with someone in your corner.
          </Text>
        ) : (
          buddies.map((buddy) => (
            <Pressable
              key={buddy.linkId}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('BuddyDetail', {
                  userId: buddy.id,
                  displayName: buddy.displayName,
                  linkId: buddy.linkId,
                })
              }
              style={({ pressed }) => [
                styles.buddyRow,
                { borderBottomColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
              <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                {buddy.displayName}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          ))
        )}
      </Card>

      <Button
        label="Post today's check-in"
        onPress={() => navigation.navigate('Checkin')}
        style={styles.checkinButton}
      />

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 10 }]}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeInput: {
    minHeight: 50,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  cardButton: {
    marginTop: 12,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  buddyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkinButton: {
    marginBottom: 12,
  },
});
