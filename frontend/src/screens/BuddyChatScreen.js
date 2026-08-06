import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';
import { useMessageStore } from '../store/messageStore';

const POLL_MS = 10000;
const MAX_LENGTH = 1000;

function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MessageBubble({ item, colors, fonts, radii }) {
  const mine = item.mine;
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? colors.primary : colors.surface,
            borderColor: mine ? colors.primary : colors.border,
            borderRadius: radii.lg,
          },
          mine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: mine ? '#FFFFFF' : colors.text,
              fontFamily: fonts.body,
            },
          ]}
        >
          {item.body}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            { color: mine ? 'rgba(255,255,255,0.72)' : colors.textMuted },
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function BuddyChatScreen({ route }) {
  const { userId, displayName } = route.params;
  const theme = useTheme();
  const messages = useMessageStore((state) => state.threads[userId] || []);
  const loading = useMessageStore((state) => state.loading);
  const sending = useMessageStore((state) => state.sending);
  const error = useMessageStore((state) => state.error);
  const fetchThread = useMessageStore((state) => state.fetchThread);
  const refreshThread = useMessageStore((state) => state.refreshThread);
  const sendMessage = useMessageStore((state) => state.sendMessage);
  const clearError = useMessageStore((state) => state.clearError);

  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const knownCount = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      clearError();
      fetchThread(userId).catch(() => {});

      const timer = setInterval(() => {
        if (active) refreshThread(userId);
      }, POLL_MS);

      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [userId, fetchThread, refreshThread, clearError])
  );

  useEffect(() => {
    if (messages.length > knownCount.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: knownCount.current > 0 });
      });
    }
    knownCount.current = messages.length;
  }, [messages.length]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    try {
      await sendMessage(userId, text);
    } catch {
      setDraft(text);
    }
  };

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <BackHeader title={displayName || 'Buddy'} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: -4 }]}>
          Private messages with your accountability buddy
        </Text>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, messages.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              listRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryMuted }]}>
                <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text, textAlign: 'center' }]}>
                Say hi
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 6 },
                ]}
              >
                Check in, share encouragement, or ask how they are holding up.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              colors={theme.colors}
              fonts={theme.fonts}
              radii={theme.radii}
            />
          )}
        />
      )}

      {error ? (
        <Text style={[theme.typography.caption, styles.error, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <View
        style={[
          styles.composer,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message…"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={MAX_LENGTH}
          style={[
            styles.input,
            theme.typography.body,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
            },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceMuted,
              opacity: pressed && canSend ? 0.85 : 1,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={18} color={canSend ? '#FFFFFF' : theme.colors.textMuted} />
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bubbleRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleMine: {
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  error: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
