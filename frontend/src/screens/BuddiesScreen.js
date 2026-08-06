import { useCallback, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useBuddyStore } from '../store/buddyStore';

function Panel({ children, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ children, right }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{children}</Text>
      {right || null}
    </View>
  );
}

function Identity({ person }) {
  const theme = useTheme();
  return (
    <View style={styles.identity}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.avatarText}>{(person.displayName || '?')[0].toUpperCase()}</Text>
      </View>
      <View style={styles.identityText}>
        <Text style={[styles.identityName, { color: theme.colors.text }]}>
          {person.displayName}
        </Text>
        {person.username ? (
          <Text style={[styles.identityMeta, { color: theme.colors.textSecondary }]}>
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
          opacity: disabled ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons
        name={loading ? 'ellipsis-horizontal' : icon}
        size={14}
        color={primary ? '#FFFFFF' : theme.colors.text}
      />
      <Text
        style={[
          styles.compactActionText,
          { color: primary ? '#FFFFFF' : theme.colors.text },
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
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: theme.colors.primary }]}>Buddies</Text>
          <Text style={[styles.headline, { color: theme.colors.text }]}>Your corner</Text>
          <Text style={[styles.subhead, { color: theme.colors.textSecondary }]}>
            Recovery is stronger with someone beside you.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buddy privacy settings"
          onPress={() => navigation.navigate('Privacy')}
          style={styles.topIcon}
          hitSlop={8}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Buddy code hero */}
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroEyebrow}>Your buddy code</Text>
          <Text style={styles.heroCode}>{user?.buddyCode || '—'}</Text>
          <Text style={styles.heroHint}>Share it with someone you trust</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share buddy code"
          onPress={shareCode}
          style={({ pressed }) => [styles.heroShare, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.heroShareText}>Share</Text>
        </Pressable>
      </View>

      {/* Incoming requests */}
      {incomingRequests.length > 0 ? (
        <View style={styles.block}>
          <SectionLabel
            right={
              <View style={[styles.countBadge, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.countBadgeText}>{incomingRequests.length}</Text>
              </View>
            }
          >
            Requests for you
          </SectionLabel>
          <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
            {incomingRequests.map((request, index, list) => (
              <View
                key={request.linkId}
                style={[
                  styles.personRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
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
          </Panel>
        </View>
      ) : null}

      {/* Find people */}
      <View style={styles.block}>
        <SectionLabel>Find people</SectionLabel>
        <Panel>
          <View
            style={[
              styles.searchInputWrap,
              { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
            ]}
          >
            <Ionicons name="search-outline" size={17} color={theme.colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              onSubmitEditing={onSearch}
              placeholder="Name or @username"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search"
              onPress={onSearch}
              disabled={searching}
              style={({ pressed }) => [
                styles.searchGo,
                { backgroundColor: theme.colors.primary, opacity: pressed || searching ? 0.8 : 1 },
              ]}
            >
              <Ionicons
                name={searching ? 'ellipsis-horizontal' : 'arrow-forward'}
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
          <Text style={[styles.searchHint, { color: theme.colors.textSecondary }]}>
            Only people who opt in to discovery appear in results.
          </Text>

          {searched && !searching && searchResults.length === 0 ? (
            <View style={styles.emptySearch}>
              <Ionicons name="person-add-outline" size={22} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No discoverable people matched that search.
              </Text>
            </View>
          ) : null}

          {searchResults.map((person) => (
            <View
              key={person.id}
              style={[
                styles.personRow,
                styles.searchResultRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Identity person={person} />
                {person.bio ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.bio, { color: theme.colors.textSecondary }]}
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
                  icon={
                    person.relationship === 'buddy' ? 'checkmark-circle-outline' : 'time-outline'
                  }
                  variant="muted"
                  disabled
                />
              )}
            </View>
          ))}
        </Panel>
      </View>

      {/* Buddy code entry */}
      <View style={styles.block}>
        <SectionLabel>Have a code?</SectionLabel>
        <Panel>
          <View style={styles.codeRow}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Enter buddy code"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="characters"
              style={[
                styles.codeInput,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
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
        </Panel>
      </View>

      {/* Sent requests */}
      {outgoingRequests.length > 0 ? (
        <View style={styles.block}>
          <SectionLabel
            right={
              <Text style={[styles.countPill, { color: theme.colors.textSecondary }]}>
                {outgoingRequests.length}
              </Text>
            }
          >
            Sent requests
          </SectionLabel>
          <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
            {outgoingRequests.map((request, index, list) => (
              <View
                key={request.linkId}
                style={[
                  styles.personRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
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
          </Panel>
        </View>
      ) : null}

      {/* Buddies list */}
      <View style={styles.block}>
        <SectionLabel
          right={
            <Text style={[styles.countPill, { color: theme.colors.textSecondary }]}>
              {buddies.length}
            </Text>
          }
        >
          Your buddies
        </SectionLabel>
        <Panel style={{ paddingVertical: 4, paddingHorizontal: 0 }}>
          {buddies.length === 0 ? (
            <View style={styles.emptyBuddies}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryMuted }]}>
                <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No buddies yet. Search above or share your code with someone you trust.
              </Text>
            </View>
          ) : (
            buddies.map((buddy, index, list) => (
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
                  styles.personRow,
                  index < list.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Identity person={buddy} />
                <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
              </Pressable>
            ))
          )}
        </Panel>
      </View>

      <Button
        label="Post today's check-in"
        icon="chatbubble-ellipses-outline"
        onPress={() => navigation.navigate('Checkin')}
        style={styles.checkinButton}
      />

      {message || error ? (
        <Text
          style={[
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
  screen: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  subhead: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  topIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },
  heroLeft: {
    flex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroCode: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 6,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  heroShare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  heroShareText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  block: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  countPill: {
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
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
  identityName: {
    fontSize: 13,
    fontWeight: '700',
  },
  identityMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchResultRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 0,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  compactAction: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  compactActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchInputWrap: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: '500',
  },
  searchGo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHint: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySearch: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emptyBuddies: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },
  bio: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 46,
    marginTop: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  checkinButton: {
    marginTop: 4,
    marginBottom: 10,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
});
