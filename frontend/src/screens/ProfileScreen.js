import { useCallback, useEffect } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useHabitStore } from '../store/habitStore';
import { useFinanceStore } from '../store/financeStore';
import { profileApi, API_BASE_URL } from '../services/api';
import { achievementSummary } from '../services/achievements';

function MenuRow({ icon, color, muted, title, detail, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        { borderBottomColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: muted, borderRadius: theme.radii.sm }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.menuBody}>
        <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
          {title}
        </Text>
        {detail ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

export function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const avatarUri = useProfileStore((state) => state.avatarUri);
  const hydrateProfile = useProfileStore((state) => state.hydrate);
  const streakDays = useHabitStore((state) => state.streakDays);
  const urges = useHabitStore((state) => state.urges);
  const journalEntries = useHabitStore((state) => state.journalEntries);
  const refreshHabits = useHabitStore((state) => state.refresh);
  const moneyKept = useFinanceStore((state) => state.summary.moneyKept);
  const refreshFinance = useFinanceStore((state) => state.refresh);

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  useFocusEffect(
    useCallback(() => {
      refreshHabits();
      refreshFinance();
    }, [refreshHabits, refreshFinance])
  );

  useEffect(() => {
    if (!token) return;
    profileApi
      .syncStats(token, {
        streakDays,
        moneyKept,
        urgesLogged: urges.length,
        journalEntries: journalEntries.length,
      })
      .catch(() => {});
  }, [token, streakDays, moneyKept, urges.length, journalEntries.length]);

  const achievements = achievementSummary({
    streakDays,
    moneyKept,
    urgesLogged: urges.length,
    journalEntries: journalEntries.length,
  });

  const shareProfile = async () => {
    if (!user?.buddyCode) return;
    const url = `${API_BASE_URL}/buddy/${user.buddyCode}`;
    await Share.share({
      title: `Add ${user.displayName} on Betapp`,
      message:
        `Add me as an accountability buddy on Betapp.\n\n${url}\n\n` +
        `If the link doesn't open the app, use buddy code ${user.buddyCode}.`,
      url,
    });
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[theme.typography.title, { color: theme.colors.text }]}>Profile</Text>
        <ThemeToggle compact />
      </View>

      <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileCard, { borderRadius: theme.radii.lg }]}
      >
        <View style={styles.identityRow}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(user?.displayName || 'F')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.identity}>
            <Text style={[theme.typography.title, styles.white]}>{user?.displayName}</Text>
            <Text style={[theme.typography.caption, styles.mutedWhite]}>
              {user?.username ? `@${user.username}` : user?.email}
            </Text>
            {user?.bio ? (
              <Text style={[theme.typography.caption, styles.bio]} numberOfLines={2}>
                {user.bio}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.profileActions}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.profileAction}>
            <Ionicons name="create-outline" size={17} color="#FFFFFF" />
            <Text style={[theme.typography.caption, styles.white]}>Edit profile</Text>
          </Pressable>
          <Pressable onPress={shareProfile} style={styles.profileAction}>
            <Ionicons name="share-social-outline" size={17} color="#FFFFFF" />
            <Text style={[theme.typography.caption, styles.white]}>Share profile</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <Pressable
          onPress={() => navigation.navigate('StreakDetail')}
          style={[
            styles.stat,
            theme.elevation.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
          ]}
        >
          <Ionicons name="flame" size={19} color={theme.colors.accent} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{streakDays}</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>day streak</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Achievements')}
          style={[
            styles.stat,
            theme.elevation.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
          ]}
        >
          <Ionicons name="trophy" size={19} color={theme.colors.secondary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {achievements.unlocked.length}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>achievements</Text>
        </Pressable>
        <View
          style={[
            styles.stat,
            theme.elevation.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
          ]}
        >
          <Ionicons name="cash" size={19} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${Math.max(0, moneyKept).toFixed(0)}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>money kept</Text>
        </View>
      </View>

      {achievements.next ? (
        <Pressable
          onPress={() => navigation.navigate('StreakDetail')}
          style={[
            styles.nextCard,
            { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.lg },
          ]}
        >
          <View style={[styles.nextIcon, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md }]}>
            <Ionicons name={achievements.next.icon} size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.menuBody}>
            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
              NEXT ACHIEVEMENT
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
              {achievements.next.title}
            </Text>
            <View style={[styles.track, { backgroundColor: theme.colors.surface }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: theme.colors.primary, width: `${achievements.next.ratio * 100}%` },
                ]}
              />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </Pressable>
      ) : null}

      <Text style={[theme.typography.caption, styles.section, { color: theme.colors.textSecondary }]}>
        RECOVERY
      </Text>
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <MenuRow
          icon="trophy-outline"
          color={theme.colors.secondary}
          muted={theme.colors.secondaryMuted}
          title="Achievements"
          detail="See every milestone and what's next"
          onPress={() => navigation.navigate('Achievements')}
        />
        <MenuRow
          icon="podium-outline"
          color={theme.colors.accent}
          muted={theme.colors.accentMuted}
          title="Leaderboard"
          detail={user?.leaderboardOptIn ? 'Friends and global rankings' : 'Private until you opt in'}
          onPress={() => navigation.navigate('Leaderboard')}
        />
        <MenuRow
          icon="shield-checkmark-outline"
          color={theme.colors.primary}
          muted={theme.colors.primaryMuted}
          title="My safety plan"
          detail="Reasons and actions for difficult moments"
          onPress={() => navigation.navigate('SafetyPlan')}
        />
        <MenuRow
          icon="notifications-outline"
          color={theme.colors.accent}
          muted={theme.colors.accentMuted}
          title="Reminders"
          detail="Daily reflection and encouragement times"
          onPress={() => navigation.navigate('Reminders')}
        />
      </View>

      <Text style={[theme.typography.caption, styles.section, { color: theme.colors.textSecondary }]}>
        CONNECTION & HELP
      </Text>
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <MenuRow
          icon="people-outline"
          color={theme.colors.primary}
          muted={theme.colors.primaryMuted}
          title="My buddies"
          detail={`Your share code: ${user?.buddyCode || '—'}`}
          onPress={() => navigation.navigate('Buddies')}
        />
        <MenuRow
          icon="heart-outline"
          color={theme.colors.secondary}
          muted={theme.colors.secondaryMuted}
          title="Support & helplines"
          detail="Communities, resources and crisis help"
          onPress={() => navigation.navigate('Support')}
        />
      </View>

      <Text style={[theme.typography.caption, styles.section, { color: theme.colors.textSecondary }]}>
        ACCOUNT
      </Text>
      <View style={[styles.menu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <MenuRow
          icon="person-outline"
          color={theme.colors.primary}
          muted={theme.colors.primaryMuted}
          title="Edit profile"
          detail="Photo, display name, username and bio"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuRow
          icon="lock-closed-outline"
          color={theme.colors.textSecondary}
          muted={theme.colors.surfaceMuted}
          title="Privacy"
          detail="Recovery details stay on this device"
          onPress={() => navigation.navigate('Privacy')}
        />
      </View>

      <Button label="Sign out" variant="ghost" onPress={logout} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileCard: {
    padding: 20,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  identity: {
    flex: 1,
  },
  white: {
    color: '#FFFFFF',
  },
  mutedWhite: {
    color: 'rgba(255,255,255,0.78)',
  },
  bio: {
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  profileAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 14,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginTop: 14,
  },
  nextIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  section: {
    letterSpacing: 1.1,
    marginTop: 22,
    marginBottom: 8,
  },
  menu: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: {
    flex: 1,
  },
  signOut: {
    marginTop: 20,
    marginBottom: 20,
  },
});
