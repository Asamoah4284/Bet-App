const TRIAL_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ALLOWED_PLANS = new Set(['monthly', 'yearly', 'lifetime']);
const TRIAL_PLANS = new Set(['yearly']);

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date, years) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

/**
 * Recompute expiry on read. Mutates user.subscription when status should change.
 * Returns a public subscription payload including isPremium.
 */
function resolveSubscription(user) {
  const raw = user.subscription || {};
  const now = new Date();
  let plan = raw.plan || 'free';
  let status = raw.status || 'none';
  let trialEndsAt = raw.trialEndsAt || null;
  let currentPeriodEndsAt = raw.currentPeriodEndsAt || null;
  const trialUsed = Boolean(raw.trialUsed);
  let dirty = false;

  if (status === 'trialing' && trialEndsAt && new Date(trialEndsAt) <= now) {
    status = 'expired';
    plan = 'free';
    dirty = true;
  }

  if (
    status === 'active' &&
    plan !== 'lifetime' &&
    currentPeriodEndsAt &&
    new Date(currentPeriodEndsAt) <= now
  ) {
    status = 'expired';
    plan = 'free';
    dirty = true;
  }

  if (dirty) {
    user.subscription = {
      ...(user.subscription?.toObject?.() || user.subscription || {}),
      plan,
      status,
      trialEndsAt,
      currentPeriodEndsAt,
      trialUsed,
      updatedAt: now,
    };
  }

  const isPremium = status === 'trialing' || status === 'active';

  return {
    plan: isPremium ? plan : plan === 'free' ? 'free' : plan,
    status: isPremium ? status : status === 'none' ? 'none' : status === 'expired' ? 'expired' : 'none',
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
    currentPeriodEndsAt: currentPeriodEndsAt
      ? new Date(currentPeriodEndsAt).toISOString()
      : null,
    trialUsed,
    isPremium,
    package: isPremium ? 'premium' : 'free',
  };
}

async function persistResolvedSubscription(user) {
  const before = JSON.stringify(user.subscription || {});
  const resolved = resolveSubscription(user);
  if (before !== JSON.stringify(user.subscription || {})) {
    if (typeof user.markModified === 'function') {
      user.markModified('subscription');
    }
    await user.save();
  }
  return resolved;
}

function publicSubscription(user) {
  return resolveSubscription(user);
}

module.exports = {
  TRIAL_DAYS,
  ALLOWED_PLANS,
  TRIAL_PLANS,
  addDays,
  addMonths,
  addYears,
  resolveSubscription,
  persistResolvedSubscription,
  publicSubscription,
};
