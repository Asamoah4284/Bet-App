import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BackHeader } from '../components/BackHeader';
import { useTheme } from '../theme';

const HELPLINES = [
  {
    name: 'National Problem Gambling Helpline (US)',
    detail: '1-800-GAMBLER · 24/7, free and confidential',
    phone: '1-800-426-2537',
  },
  {
    name: 'GamCare (UK)',
    detail: '0808 8020 133 · 24/7',
    phone: '08088020133',
  },
  {
    name: 'Gambling Help Online (AU)',
    detail: '1800 858 858 · 24/7',
    phone: '1800858858',
  },
];

const RESOURCES = [
  {
    name: 'Gamblers Anonymous',
    detail: 'Find local and online meetings',
    url: 'https://www.gamblersanonymous.org',
  },
  {
    name: 'GamTalk community',
    detail: 'Moderated peer support, 24/7',
    url: 'https://www.gamtalk.org',
  },
  {
    name: 'r/problemgambling',
    detail: 'Reddit community for recovery stories and support',
    url: 'https://www.reddit.com/r/problemgambling',
  },
  {
    name: 'NCPG: understanding problem gambling',
    detail: 'Articles, screening tools, and treatment finder',
    url: 'https://www.ncpgambling.org',
  },
];

function LinkRow({ icon, name, detail, onPress, theme }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radii.sm },
        ]}
      >
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{name}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

export function SupportScreen() {
  const theme = useTheme();

  return (
    <Screen scroll>
      <BackHeader title="Support" />
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: -8, marginBottom: 16 }]}>
        Reaching out is a strength, not a setback.
      </Text>

      <Card title="Talk to someone now">
        {HELPLINES.map((line) => (
          <LinkRow
            key={line.name}
            icon="call-outline"
            name={line.name}
            detail={line.detail}
            theme={theme}
            onPress={() => Linking.openURL(`tel:${line.phone}`)}
          />
        ))}
      </Card>

      <Card title="Communities & reading">
        {RESOURCES.map((resource) => (
          <LinkRow
            key={resource.name}
            icon="globe-outline"
            name={resource.name}
            detail={resource.detail}
            theme={theme}
            onPress={() => Linking.openURL(resource.url)}
          />
        ))}
      </Card>

      <Card title="In a crisis?">
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>
          If you're having thoughts of harming yourself, call or text 988 (US) or your local
          emergency number right away.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
});
