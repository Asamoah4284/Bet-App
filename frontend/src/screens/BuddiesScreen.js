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

function Identity({ person }) {
  const theme = useTheme();
  return (
    <View style={styles.identity}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.pill },
        ]}
      >
        <Text style={[theme.typography.subtitle, { color: theme.colors.primary }]}>
          {(person.displayName || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.identityText}>
        <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '700' }]}>
          {person.displayName}
        </Text>
        {person.username ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            @{person.username}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CompactAction({ label, icon, variant = 'primary', disabled, loading, onPress }) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactAction,
        {
          backgroundColor: primary ? theme.colors.primary : theme.colors.surfaceMuted,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons
        name={loading ? 'ellipsis-horizontal' : icon}
        size={15}
        color={primary ? theme.colors.textInverse : theme.colors.text}
      />
      <Text
        style={[
          theme.typography.caption,
          { color: primary ? theme.colors.textInverse : theme.colors.text, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BuddiesScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const buddies = useBuddyStore((state) => state.buddies);
  const incomingRequests = useBuddyStore((state) => state.incomingRequests);
  const outgoingRequests = useBuddyStore((state) => state.outgoingRequests);
  const searchResults = useBuddyStore((state) => state.searchResults);
  const searching = useBuddyStore((state) => state.searching);
  const error = useBuddyStore((state) => state.error);
  const refresh = useBuddyStore((state) => state.refresh);
  const searchUsers = useBuddyStore((state) => state.searchUsers);
  const clearSearch = useBuddyStore((state) => state.clearSearch);
  const sendRequest = useBuddyStore((state) => state.sendRequest);
  const acceptRequest = useBuddyStore((state) => state.acceptRequest);
  const removeLink = useBuddyStore((state) => state.removeLink);

  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [searched, setSearched] = useState(false);

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

  const run = async (key, action, successMessage) => {
    setBusyKey(key);
    setMessage(null);
    try {
      await action();
      setMessage(successMessage);
      if (searched && query.trim().length >= 2) await searchUsers(query);
      return true;
    } catch (err) {
      setMessage(err.message);
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const onSearch = async () => {
    if (query.trim().length < 2) {
      setMessage('Enter at least 2 characters to search.');
      return;
    }
    setSearched(true);
    setMessage(null);
    try {
      await searchUsers(query);
    } catch {
      // Store error is shown below.
    }
  };

  const onQueryChange = (value) => {
    setQuery(value);
    if (!value) {
      clearSearch();
      setSearched(false);
    }
  };

  const requestByCode = async () => {
    if (!code.trim()) return;
    const normalized = code.trim().toUpperCase();
    const sent = await run('code', () => sendRequest(normalized), 'Buddy request sent.');
    if (sent) setCode('');
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>Buddies</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
            Recovery is stronger with someone in your corner.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buddy privacy settings"
          onPress={() => navigation.navigate('Privacy')}
          style={[
            styles.headerButton,
            { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={21} color={theme.colors.primary} />
        </Pressable>
      </View>

      {incomingRequests.length > 0 ? (
        <View
          style={[
            styles.inbox,
            { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.lg },
          ]}
        >
          <View style={styles.inboxTitle}>
            <View>
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '800' }]}>
                REQUEST INBOX
              </Text>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text, marginTop: 2 }]}>
                {incomingRequests.length} waiting for you
              </Text>
            </View>
            <View style={[styles.count, { backgroundColor: theme.colors.primary }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.textInverse, fontWeight: '800' }]}>
                {incomingRequests.length}
              </Text>
            </View>
          </View>
          {incomingRequests.map((request) => (
            <View
              key={request.linkId}
              style={[styles.personRow, { borderTopColor: theme.colors.border }]}
            >
              <Identity person={request} />
              <View style={styles.rowActions}>
                <CompactAction
                  label="Accept"
                  icon="checkmark"
                  loading={busyKey === `accept-${request.linkId}`}
                  onPress={() =>
                    run(
                      `accept-${request.linkId}`,
                      () => acceptRequest(request.linkId),
                      `${request.displayName} is now your buddy.`
                    )
                  }
                />
                <CompactAction
                  label="Decline"
                  icon="close"
                  variant="muted"
                  loading={busyKey === `decline-${request.linkId}`}
                  onPress={() =>
                    run(
                      `decline-${request.linkId}`,
                      () => removeLink(request.linkId),
                      'Request declined.'
                    )
                  }
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Card title="Find people">
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          Search by display name or @username. Only people who opt in appear.
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputWrap,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <Ionicons name="search-outline" size={19} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              onSubmitEditing={onSearch}
              placeholder="Name or username"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              returnKeyType="search"
              style={[styles.searchInput, theme.typography.body, { color: theme.colors.text }]}
            />
          </View>
          <CompactAction
            label="Search"
            icon="search"
            loading={searching}
            onPress={onSearch}
          />
        </View>

        {searched && !searching && searchResults.length === 0 ? (
          <View style={styles.emptySearch}>
            <Ionicons name="person-add-outline" size={25} color={theme.colors.textSecondary} />
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              No discoverable people matched that search.
            </Text>
          </View>
        ) : null}

        {searchResults.map((person) => (
          <View
            key={person.id}
            style={[styles.personRow, { borderTopColor: theme.colors.border }]}
          >
            <View style={styles.searchIdentity}>
              <Identity person={person} />
              {person.bio ? (
                <Text
                  numberOfLines={1}
                  style={[theme.typography.caption, styles.bio, { color: theme.colors.textSecondary }]}
                >
                  {person.bio}
                </Text>
              ) : null}
            </View>
            {person.relationship === 'none' ? (
              <CompactAction
                label="Add"
                icon="person-add-outline"
                loading={busyKey === `add-${person.id}`}
                onPress={() =>
                  run(
                    `add-${person.id}`,
                    () => sendRequest(person.buddyCode),
                    `Request sent to ${person.displayName}.`
                  )
                }
              />
            ) : person.relationship === 'incoming' ? (
              <CompactAction
                label="Accept"
                icon="checkmark"
                loading={busyKey === `accept-search-${person.id}`}
                onPress={() =>
                  run(
                    `accept-search-${person.id}`,
                    () => acceptRequest(person.linkId),
                    `${person.displayName} is now your buddy.`
                  )
                }
              />
            ) : (
              <CompactAction
                label={person.relationship === 'buddy' ? 'Buddies' : 'Sent'}
                icon={person.relationship === 'buddy' ? 'checkmark-circle-outline' : 'time-outline'}
                variant="muted"
                disabled
              />
            )}
          </View>
        ))}
      </Card>

      <Card title="Or use a buddy code">
        <View style={styles.searchRow}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter code"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="characters"
            style={[
              styles.codeInput,
              theme.typography.body,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.md,
                color: theme.colors.text,
              },
            ]}
          />
          <CompactAction
            label="Send"
            icon="send-outline"
            loading={busyKey === 'code'}
            onPress={requestByCode}
          />
        </View>
        <Pressable onPress={shareCode} style={styles.shareRow}>
          <View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              YOUR CODE
            </Text>
            <Text style={[theme.typography.subtitle, { color: theme.colors.primary, letterSpacing: 2 }]}>
              {user?.buddyCode || '—'}
            </Text>
          </View>
          <Ionicons name="share-social-outline" size={22} color={theme.colors.primary} />
        </Pressable>
      </Card>

      {outgoingRequests.length > 0 ? (
        <Card title={`Sent requests (${outgoingRequests.length})`}>
          {outgoingRequests.map((request) => (
            <View key={request.linkId} style={styles.personRow}>
              <Identity person={request} />
              <CompactAction
                label="Cancel"
                icon="close"
                variant="muted"
                loading={busyKey === `cancel-${request.linkId}`}
                onPress={() =>
                  run(
                    `cancel-${request.linkId}`,
                    () => removeLink(request.linkId),
                    'Request canceled.'
                  )
                }
              />
            </View>
          ))}
        </Card>
      ) : null}

      <Card title={`Your buddies (${buddies.length})`}>
        {buddies.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            No buddies yet. Search above or share your code with someone you trust.
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
              <Identity person={buddy} />
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          ))
        )}
      </Card>

      <Button
        label="Post today's check-in"
        icon="chatbubble-ellipses-outline"
        onPress={() => navigation.navigate('Checkin')}
        style={styles.checkinButton}
      />

      {message || error ? (
        <Text
          style={[
            theme.typography.caption,
            styles.message,
            { color: error ? theme.colors.danger : theme.colors.textSecondary },
          ]}
        >
          {message || error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inbox: {
    padding: 16,
    marginBottom: 16,
  },
  inboxTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  count: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  identityText: {
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  compactAction: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  searchInputWrap: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 0,
  },
  emptySearch: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
  },
  searchIdentity: {
    flex: 1,
  },
  bio: {
    marginLeft: 48,
    marginTop: -2,
  },
  codeInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
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
  message: {
    textAlign: 'center',
    marginBottom: 12,
  },
});
