import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { BrandMark } from '../components/BrandMark';
import { MoolrePayment } from '../components/MoolrePayment';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { selectIsPremium, useSubscriptionStore } from '../store/subscriptionStore';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 'GH₵ 9.99',
    period: '/ month',
    badge: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 'GH₵ 22.99',
    period: '/ year',
    badge: '3 DAYS FREE',
    badgeTone: 'primary',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: 'GH₵ 29.99',
    period: ' one-time',
    badge: 'BEST VALUE',
    badgeTone: 'warning',
  },
];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function TimelineRow({ icon, iconColor, iconBg, title, body, isLast, theme }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        {!isLast ? (
          <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
        ) : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.timelineBody, { color: theme.colors.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

export function PaywallScreen({ navigation }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = (nextUser) => useAuthStore.setState({ user: nextUser });
  const startTrial = useSubscriptionStore((state) => state.startTrial);
  const initializePayment = useSubscriptionStore((state) => state.initializePayment);
  const confirmPayment = useSubscriptionStore((state) => state.confirmPayment);
  const loading = useSubscriptionStore((state) => state.loading);
  const error = useSubscriptionStore((state) => state.error);
  const isPremium = useSubscriptionStore(selectIsPremium);
  const subscription = useSubscriptionStore((state) => state.subscription);

  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showMoolre, setShowMoolre] = useState(false);
  const [moolreAuthUrl, setMoolreAuthUrl] = useState(null);
  const [moolreReference, setMoolreReference] = useState(null);
  const [moolreRedirectUrl, setMoolreRedirectUrl] = useState(null);
  const [payingPlan, setPayingPlan] = useState(null);

  const trialAvailable =
    selectedPlan === 'yearly' && !subscription?.trialUsed && subscription?.status !== 'expired';

  const timeline = useMemo(() => {
    const today = new Date();
    const reminder = addDays(today, 2);
    const billing = addDays(today, 3);
    return [
      {
        icon: 'lock-open',
        title: 'Today',
        body:
          'Unlock everything: urge SOS, daily check-ins, journal, money tracking, buddies, and progress.',
        color: theme.colors.primary,
        muted: theme.colors.primaryMuted,
      },
      {
        icon: 'notifications',
        title: 'In 2 days — Reminder',
        body: `We'll remind you on ${formatLongDate(reminder)} that your trial is about to end.`,
        color: theme.colors.primary,
        muted: theme.colors.primaryMuted,
      },
      {
        icon: 'star',
        title: 'In 3 days — Billing starts',
        body: `First charge on ${formatLongDate(billing)}, unless you cancel before.`,
        color: theme.colors.danger,
        muted: theme.colors.warningMuted,
      },
    ];
  }, [theme]);

  const applySubscription = (next) => {
    if (user) {
      setUser({ ...user, subscription: next });
    }
  };

  const startPaidCheckout = async (plan) => {
    const payment = await initializePayment(token, plan);
    const data = payment?.data || payment;
    const authorizationUrl = data?.authorization_url || data?.authorizationUrl;
    const reference = data?.reference;
    const redirectUrl = data?.redirect || data?.redirectUrl;

    if (!authorizationUrl) {
      throw new Error('Payment gateway did not return authorization URL');
    }

    setPayingPlan(plan);
    setMoolreAuthUrl(authorizationUrl);
    setMoolreReference(reference);
    setMoolreRedirectUrl(redirectUrl);
    setShowMoolre(true);
  };

  const onContinue = async () => {
    try {
      if (trialAvailable) {
        const next = await startTrial(token, 'yearly');
        applySubscription(next);
        return;
      }
      await startPaidCheckout(selectedPlan);
    } catch (error) {
      Alert.alert('Payment Error', error?.message || 'Failed to start payment. Please try again.');
    }
  };

  const handleMoolreSuccess = async ({ reference }) => {
    try {
      const next = await confirmPayment(token, {
        plan: payingPlan || selectedPlan,
        paymentReference: reference || moolreReference,
      });
      setShowMoolre(false);
      setMoolreAuthUrl(null);
      applySubscription(next);
    } catch (error) {
      setShowMoolre(false);
      setMoolreAuthUrl(null);
      Alert.alert(
        'Payment',
        error?.message || 'Payment could not be confirmed yet. If you were charged, try again in a moment.'
      );
    }
  };

  const handleMoolreCancel = () => {
    setShowMoolre(false);
    setMoolreAuthUrl(null);
    setMoolreReference(null);
    setPayingPlan(null);
  };

  const ctaLabel = trialAvailable
    ? 'Start My Free Trial'
    : selectedPlan === 'lifetime'
      ? 'Pay with MoMo — Lifetime'
      : selectedPlan === 'yearly'
        ? 'Pay with MoMo — Yearly'
        : 'Pay with MoMo — Monthly';

  const finePrint = trialAvailable
    ? '3 days free, then GH₵22.99 / year. Cancel anytime.'
    : selectedPlan === 'monthly'
      ? 'Billed monthly via MoMo. Cancel anytime.'
      : selectedPlan === 'yearly'
        ? 'Billed yearly via MoMo after your free trial is used.'
        : 'One-time MoMo purchase. Lifetime Premium access.';

  // Once premium, RootNavigator remounts Main — this screen unmounts. Keep Support accessible.
  if (isPremium) {
    return null;
  }

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.brandRow}>
        <BrandMark size={72} />
        <Text style={[styles.kicker, { color: theme.colors.secondary }]}>PREMIUM</Text>
      </View>

      <Text style={[styles.headline, { color: theme.colors.text }]}>
        {trialAvailable
          ? 'Start your free trial and stay on track'
          : 'Unlock Premium and stay on track'}
      </Text>

      {trialAvailable ? (
        <View style={styles.timeline}>
          {timeline.map((item, index) => (
            <TimelineRow
              key={item.title}
              icon={item.icon}
              iconColor={item.color}
              iconBg={item.muted}
              title={item.title}
              body={item.body}
              isLast={index === timeline.length - 1}
              theme={theme}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.planRow}>
        {PLANS.map((plan) => {
          const selected = selectedPlan === plan.id;
          const showTrialBadge = plan.id === 'yearly' && !subscription?.trialUsed;
          return (
            <Pressable
              key={plan.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelectedPlan(plan.id)}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radii.md,
                },
                selected && styles.planCardSelected,
              ]}
            >
              {showTrialBadge || plan.badge ? (
                <View
                  style={[
                    styles.planBadge,
                    {
                      backgroundColor:
                        plan.badgeTone === 'warning' && !showTrialBadge
                          ? theme.colors.warning
                          : theme.colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.planBadgeText,
                      {
                        color:
                          plan.badgeTone === 'warning' && !showTrialBadge
                            ? theme.colors.text
                            : theme.colors.textInverse,
                      },
                    ]}
                  >
                    {showTrialBadge ? '3 DAYS FREE' : plan.badge}
                  </Text>
                </View>
              ) : (
                <View style={styles.planBadgeSpacer} />
              )}
              {selected ? (
                <View style={[styles.check, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="checkmark" size={13} color={theme.colors.textInverse} />
                </View>
              ) : null}
              <Text style={[styles.planLabel, { color: theme.colors.textSecondary }]}>
                {plan.label}
              </Text>
              <Text style={[styles.planPrice, { color: theme.colors.text }]}>{plan.price}</Text>
              <Text style={[styles.planPeriod, { color: theme.colors.textSecondary }]}>
                {plan.period.trim()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {trialAvailable ? (
        <View style={styles.noPayRow}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
          <Text style={[styles.noPayText, { color: theme.colors.text }]}>
            No payment due now.
          </Text>
        </View>
      ) : (
        <View style={styles.noPayRow}>
          <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.noPayText, { color: theme.colors.text }]}>
            You’ll pay securely with MoMo via Moolre.
          </Text>
        </View>
      )}

      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>
      ) : null}

      <Button label={ctaLabel} onPress={onContinue} loading={loading} style={styles.cta} />

      <Text style={[styles.finePrint, { color: theme.colors.textSecondary }]}>{finePrint}</Text>

      <View style={styles.footerLinks}>
        <Pressable
          onPress={() =>
            Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/').catch(
              () => {}
            )
          }
        >
          <Text style={[styles.link, { color: theme.colors.primary }]}>Terms of Service</Text>
        </Pressable>
        <Text style={{ color: theme.colors.textSecondary }}>·</Text>
        <Pressable onPress={() => navigation.navigate('PaywallPrivacy')}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>Privacy Policy</Text>
        </Pressable>
        <Text style={{ color: theme.colors.textSecondary }}>·</Text>
        <Pressable onPress={() => navigation.navigate('PaywallSupport')}>
          <Text style={[styles.link, { color: theme.colors.primary }]}>Crisis support</Text>
        </Pressable>
      </View>

      <MoolrePayment
        isVisible={showMoolre}
        authorizationUrl={moolreAuthUrl}
        callbackUrl={moolreRedirectUrl}
        paymentReference={moolreReference}
        onCancel={handleMoolreCancel}
        onSuccess={handleMoolreSuccess}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 22,
  },
  timeline: {
    marginBottom: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
  },
  timelineRail: {
    width: 34,
    alignItems: 'center',
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineBody: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 18,
    alignItems: 'center',
    minHeight: 158,
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  planBadgeSpacer: {
    height: 24,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },
  noPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  noPaySpacer: {
    height: 16,
    marginBottom: 8,
  },
  noPayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  cta: {
    marginBottom: 12,
  },
  finePrint: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  link: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
