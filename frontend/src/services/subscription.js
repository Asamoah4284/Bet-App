export const EMPTY_SUBSCRIPTION = {
  plan: 'free',
  status: 'none',
  trialEndsAt: null,
  currentPeriodEndsAt: null,
  trialUsed: false,
  isPremium: false,
  package: 'free',
};

export function normalizeSubscription(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_SUBSCRIPTION };
  }

  return {
    plan: raw.plan || 'free',
    status: raw.status || 'none',
    trialEndsAt: raw.trialEndsAt || null,
    currentPeriodEndsAt: raw.currentPeriodEndsAt || null,
    trialUsed: Boolean(raw.trialUsed),
    isPremium: Boolean(raw.isPremium),
    package: raw.package || (raw.isPremium ? 'premium' : 'free'),
  };
}

export function hasPremiumAccess(subscription) {
  return Boolean(normalizeSubscription(subscription).isPremium);
}

export function canAccess(subscription, pkg = 'premium') {
  const sub = normalizeSubscription(subscription);
  if (pkg === 'free') return true;
  if (pkg === 'premium') return sub.isPremium;
  return sub.package === pkg;
}

export function trialDaysRemaining(subscription, now = new Date()) {
  const sub = normalizeSubscription(subscription);
  if (sub.status !== 'trialing' || !sub.trialEndsAt) {
    return 0;
  }
  const ends = new Date(sub.trialEndsAt).getTime();
  const ms = ends - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function planLabel(plan) {
  switch (plan) {
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    case 'lifetime':
      return 'Lifetime';
    default:
      return 'Free';
  }
}

export function planPriceLabel(plan) {
  switch (plan) {
    case 'monthly':
      return 'GH₵9.99 / month';
    case 'yearly':
      return 'GH₵22.99 / year';
    case 'lifetime':
      return 'GH₵29.99 one-time';
    default:
      return null;
  }
}

export function formatSubscriptionDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Human-readable package title + supporting line for Profile. */
export function subscriptionPackageCopy(subscription, now = new Date()) {
  const sub = normalizeSubscription(subscription);
  const name = planLabel(sub.plan);
  const price = planPriceLabel(sub.plan);
  const daysLeft = trialDaysRemaining(sub, now);
  const periodEnd = formatSubscriptionDate(sub.currentPeriodEndsAt);
  const trialEnd = formatSubscriptionDate(sub.trialEndsAt);

  if (sub.status === 'trialing') {
    return {
      title: `${name} Premium`,
      badge: 'Free trial',
      detail:
        daysLeft > 0
          ? `Trial ends ${trialEnd || 'soon'} · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
          : 'Trial ending soon',
      priceLine: price ? `Then ${price}` : null,
      isPremium: true,
    };
  }

  if (sub.status === 'active' && sub.isPremium) {
    if (sub.plan === 'lifetime') {
      return {
        title: 'Lifetime Premium',
        badge: 'Active',
        detail: 'One-time purchase · full Premium access',
        priceLine: price,
        isPremium: true,
      };
    }
    return {
      title: `${name} Premium`,
      badge: 'Active',
      detail: periodEnd ? `Renews ${periodEnd}` : `${name} plan active`,
      priceLine: price,
      isPremium: true,
    };
  }

  if (sub.status === 'expired') {
    return {
      title: 'No active plan',
      badge: 'Expired',
      detail: 'Your Premium access has ended',
      priceLine: null,
      isPremium: false,
    };
  }

  return {
    title: 'No active plan',
    badge: null,
    detail: 'Start a free trial or subscribe with MoMo',
    priceLine: null,
    isPremium: false,
  };
}
