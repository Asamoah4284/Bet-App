const User = require('../models/User');
const {
  TRIAL_DAYS,
  ALLOWED_PLANS,
  TRIAL_PLANS,
  addDays,
  addMonths,
  addYears,
  resolveSubscription,
  publicSubscription,
} = require('../services/subscription');
const {
  planAmount,
  createPaymentReference,
  createMoolrePaymentLink,
  verifyMoolrePayment,
  isMoolreConfigured,
} = require('../services/moolre');

function activatePlanOnUser(user, plan, paymentReference) {
  const now = new Date();
  let currentPeriodEndsAt = null;
  if (plan === 'monthly') {
    currentPeriodEndsAt = addMonths(now, 1);
  } else if (plan === 'yearly') {
    currentPeriodEndsAt = addYears(now, 1);
  }

  user.subscription = {
    plan,
    status: 'active',
    trialEndsAt: user.subscription?.trialEndsAt || null,
    currentPeriodEndsAt,
    trialUsed: Boolean(user.subscription?.trialUsed) || plan === 'yearly',
    storeProductId: paymentReference || `moolre.${plan}`,
    updatedAt: now,
  };
  user.markModified('subscription');
}

async function getSubscription(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const before = JSON.stringify(user.subscription || {});
    const subscription = resolveSubscription(user);
    if (before !== JSON.stringify(user.subscription || {})) {
      user.markModified('subscription');
      await user.save();
    }

    res.json({ subscription });
  } catch (err) {
    next(err);
  }
}

async function startTrial(req, res, next) {
  try {
    const plan = String(req.body?.plan || 'yearly').toLowerCase();
    if (!TRIAL_PLANS.has(plan)) {
      return res.status(400).json({ error: 'Free trial is only available on the yearly plan' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = resolveSubscription(user);
    if (current.isPremium) {
      return res.status(400).json({ error: 'You already have Premium access' });
    }
    if (user.subscription?.trialUsed || current.trialUsed) {
      return res.status(400).json({
        error: 'Free trial has already been used. Choose a plan to pay now.',
      });
    }

    const now = new Date();
    user.subscription = {
      plan,
      status: 'trialing',
      trialEndsAt: addDays(now, TRIAL_DAYS),
      currentPeriodEndsAt: addYears(addDays(now, TRIAL_DAYS), 1),
      trialUsed: true,
      storeProductId: null,
      updatedAt: now,
    };
    user.markModified('subscription');
    await user.save();

    res.json({ subscription: publicSubscription(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * Stub activate kept only for legacy clients — prefers Moolre confirm-payment.
 * Disabled unless ALLOW_STUB_PURCHASE=true.
 */
async function activate(req, res, next) {
  try {
    if (process.env.ALLOW_STUB_PURCHASE !== 'true') {
      return res.status(400).json({
        error: 'Use Moolre payment to unlock Premium',
      });
    }

    const plan = String(req.body?.plan || '').toLowerCase();
    if (!ALLOWED_PLANS.has(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    activatePlanOnUser(user, plan, `stub.${plan}`);
    await user.save();

    res.json({ subscription: publicSubscription(user) });
  } catch (err) {
    next(err);
  }
}

async function initializePayment(req, res, next) {
  try {
    const plan = String(req.body?.plan || '').toLowerCase();
    if (!ALLOWED_PLANS.has(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    if (plan === 'yearly' && !req.body?.forcePaid) {
      // Yearly without forcePaid should use start-trial when available.
    }

    const amount = planAmount(plan);
    if (amount == null) {
      return res.status(400).json({ error: 'Unknown plan price' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = resolveSubscription(user);
    if (current.isPremium) {
      return res.status(400).json({ error: 'You already have Premium access' });
    }

    if (!isMoolreConfigured()) {
      return res.status(500).json({ error: 'Payment gateway not configured. Please contact support.' });
    }

    const email = String(user.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid account email is required for payment' });
    }

    const reference = createPaymentReference(plan);
    const link = await createMoolrePaymentLink({
      amount,
      email,
      externalref: reference,
      metadata: {
        userId: String(user._id),
        plan,
        product: 'quibet-premium',
      },
    });

    // Same response contract as As-market initialize-moolre-payment
    res.json({
      success: true,
      data: {
        authorization_url: link.authorizationUrl,
        reference: link.reference,
        redirect: link.redirectUrl,
        amount,
        currency: 'GHS',
        plan,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        error: err.message,
      });
    }
    next(err);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const plan = String(req.body?.plan || '').toLowerCase();
    const paymentReference = String(req.body?.paymentReference || req.body?.reference || '').trim();

    if (!ALLOWED_PLANS.has(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!paymentReference.startsWith('QUIBET-')) {
      return res.status(400).json({ error: 'Invalid payment reference' });
    }
    if (!paymentReference.toUpperCase().includes(`-${plan.toUpperCase()}-`)) {
      return res.status(400).json({ error: 'Payment reference does not match selected plan' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = resolveSubscription(user);
    if (current.isPremium) {
      return res.json({ subscription: publicSubscription(user) });
    }

    // Idempotency: same reference already applied
    if (user.subscription?.storeProductId === paymentReference) {
      return res.json({ subscription: publicSubscription(user) });
    }

    const amount = planAmount(plan);
    await verifyMoolrePayment(paymentReference, amount);

    activatePlanOnUser(user, plan, paymentReference);
    await user.save();

    res.json({ subscription: publicSubscription(user) });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

/** Soft webhook — unlock still verified via confirm-payment + /open/transact/status. */
async function moolreWebhook(req, res) {
  const payload = req.body || {};
  const headers = req.headers || {};
  const externalRef = payload.data?.externalref ?? payload.externalref ?? null;
  const txStatus = payload.data?.txstatus ?? payload.txstatus ?? null;

  const webhookSecret =
    payload?.data?.secret ??
    payload?.secret ??
    payload?.data?.webhookSecret ??
    headers['x-moolre-secret'] ??
    headers['x-moolre-webhook-secret'] ??
    headers['x-webhook-secret'] ??
    null;

  console.log('[MOOLRE-WEBHOOK] received', {
    externalRef,
    txStatus,
    hasSecret: Boolean(webhookSecret),
  });

  const configuredSecret = process.env.MOOLRE_WEBHOOK_SECRET;
  if (configuredSecret) {
    if (!webhookSecret) {
      const allowMissing =
        String(process.env.MOOLRE_WEBHOOK_ALLOW_MISSING_SECRET || '').toLowerCase() === 'true';
      if (!allowMissing) {
        console.error('[MOOLRE-WEBHOOK] rejected: missing secret');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else if (webhookSecret !== configuredSecret) {
      console.error('[MOOLRE-WEBHOOK] rejected: secret mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('[MOOLRE-WEBHOOK] MOOLRE_WEBHOOK_SECRET not configured; accepting (testing only)');
  }

  // Client confirm-payment is authoritative for Premium unlock (same as As-market status poll).
  return res.status(200).json({ received: true, externalRef });
}

module.exports = {
  getSubscription,
  startTrial,
  activate,
  initializePayment,
  confirmPayment,
  moolreWebhook,
};
