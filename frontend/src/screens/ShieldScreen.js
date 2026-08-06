import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useShieldStore } from '../store/shieldStore';

export function ShieldScreen({ navigation }) {
  const theme = useTheme();
  const targets = useShieldStore((state) => state.targets);
  const customDomains = useShieldStore((state) => state.customDomains);
  const enabled = useShieldStore((state) => state.enabled);
  const vpnActive = useShieldStore((state) => state.vpnActive);
  const capability = useShieldStore((state) => state.capability);
  const loading = useShieldStore((state) => state.loading);
  const error = useShieldStore((state) => state.error);
  const hydrate = useShieldStore((state) => state.hydrate);
  const setEnabled = useShieldStore((state) => state.setEnabled);
  const addCustomDomain = useShieldStore((state) => state.addCustomDomain);
  const removeCustomDomain = useShieldStore((state) => state.removeCustomDomain);

  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      hydrate();
    }, [hydrate])
  );

  const onToggle = async (value) => {
    setLocalError(null);
    try {
      await setEnabled(value);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const onAdd = async () => {
    setLocalError(null);
    try {
      await addCustomDomain(draft);
      setDraft('');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const domainTargets = targets.filter((item) => item.kind === 'domain');
  const packageTargets = targets.filter((item) => item.kind === 'androidPackage');
  const statusColor = vpnActive
    ? theme.colors.secondary
    : capability.available
      ? theme.colors.accent
      : theme.colors.textSecondary;

  return (
    <Screen scroll>
      <BackHeader title="Shield" />

      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <View style={[styles.statusIcon, { backgroundColor: theme.colors.primaryMuted }]}>
          <Ionicons name={vpnActive ? 'shield-checkmark' : 'shield-outline'} size={26} color={theme.colors.primary} />
        </View>
        <View style={styles.statusBody}>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
            {vpnActive ? 'Website blocking is on' : enabled ? 'Protection requested' : 'Protection is off'}
          </Text>
          <Text style={[theme.typography.caption, { color: statusColor, marginTop: 4 }]}>
            {vpnActive
              ? 'Local DNS filter is active on this phone.'
              : capability.available
                ? Platform.OS === 'ios'
                  ? 'Turn on the switch and allow the Shield VPN configuration when iOS asks.'
                  : 'Turn on the switch to start the local VPN filter.'
                : capability.message}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={loading}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryMuted }}
          thumbColor={enabled ? theme.colors.primary : theme.colors.surface}
        />
      </View>

      <Card title="What Shield does">
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Blocks known betting websites (and sites you add) with a local DNS filter
          {Platform.OS === 'ios' ? ' (iOS Packet Tunnel)' : ' (Android VPN)'} on this device. Traffic
          stays on your phone — Betapp does not inspect your browsing remotely.
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 10 }]}>
          It cannot force-close or uninstall native betting apps like SportyBet. For strongest
          protection, uninstall those apps and keep Shield on for the web.
        </Text>
        <Button
          label="Open Urge SOS"
          variant="soft"
          icon="pulse-outline"
          onPress={() => navigation.navigate('UrgeSOS')}
          style={styles.sosButton}
        />
      </Card>

      <Card title="Add a personal domain">
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="example.com"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              theme.typography.body,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.md,
                color: theme.colors.text,
              },
            ]}
          />
          <Button label="Add" onPress={onAdd} style={styles.addButton} />
        </View>
        {customDomains.length === 0 ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 10 }]}>
            No personal domains yet.
          </Text>
        ) : (
          customDomains.map((row) => (
            <View key={row.domain} style={[styles.row, { borderTopColor: theme.colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
                  {row.domain}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Personal
                </Text>
              </View>
              <Pressable onPress={() => removeCustomDomain(row.domain)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <Card title={`Curated sites (${domainTargets.length})`}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
          Maintained by Betapp for Ghana and common international betting domains.
        </Text>
        {domainTargets.map((target) => (
          <View key={target.id} style={[styles.row, { borderTopColor: theme.colors.border }]}>
            <View style={styles.rowText}>
              <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
                {target.label}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {target.value}
              </Text>
            </View>
            <Ionicons name="globe-outline" size={18} color={theme.colors.primary} />
          </View>
        ))}
      </Card>

      {Platform.OS === 'android' && packageTargets.length > 0 ? (
        <Card title="Known Android apps">
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
            Listed for awareness only in this version. Shield does not force-close these apps.
          </Text>
          {packageTargets.map((target) => (
            <View key={target.id} style={[styles.row, { borderTopColor: theme.colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
                  {target.label}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {target.value}
                </Text>
              </View>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.accent} />
            </View>
          ))}
        </Card>
      ) : null}

      {localError || error ? (
        <Text style={[theme.typography.caption, styles.error, { color: theme.colors.danger }]}>
          {localError || error}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBody: {
    flex: 1,
  },
  sosButton: {
    marginTop: 14,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  addButton: {
    minHeight: 48,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
