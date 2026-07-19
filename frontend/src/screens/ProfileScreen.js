import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';

export function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <BrandMark size={64} />
        <ThemeToggle />
      </View>

      <Card title="Account">
        <Text style={[theme.typography.title, { color: theme.colors.text }]}>
          {user?.displayName}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          {user?.email}
        </Text>

        <View
          style={[
            styles.codeBox,
            { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md },
          ]}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            Buddy code
          </Text>
          <Text style={[theme.typography.subtitle, { color: theme.colors.primary, marginTop: 4 }]}>
            {user?.buddyCode || '—'}
          </Text>
        </View>
      </Card>

      <Card title="Privacy">
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>
          Your urges, journal, and money logs never leave this device. Only your account, buddy
          links, and the check-ins you post are stored on the server.
        </Text>
      </Card>

      <Card title="Urge support">
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>
          Personalize the reasons and safe actions shown during an Urge SOS session.
        </Text>
        <Button
          label="Edit my safety plan"
          variant="soft"
          onPress={() => navigation.navigate('SafetyPlan')}
          style={styles.safetyButton}
        />
      </Card>

      <Button label="Sign out" variant="ghost" onPress={logout} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeBox: {
    marginTop: 16,
    padding: 14,
  },
  safetyButton: {
    marginTop: 14,
  },
  signOut: {
    marginTop: 8,
    marginBottom: 12,
  },
});
