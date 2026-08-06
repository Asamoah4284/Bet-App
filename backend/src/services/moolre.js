const https = require('https');

const MOOLRE_USERNAME = process.env.MOOLRE_USERNAME;
const MOOLRE_PUBLIC_KEY = process.env.MOOLRE_PUBLIC_KEY;
const MOOLRE_ACCOUNT_NUMBER = process.env.MOOLRE_ACCOUNT_NUMBER;

/** Plan prices charged via MoMo (GHS). Display labels on the client may still say USD. */
const PLAN_PRICES_GHS = {
  monthly: Number(process.env.PLAN_MONTHLY_GHS || 9.99),
  yearly: Number(process.env.PLAN_YEARLY_GHS || 22.99),
  lifetime: Number(process.env.PLAN_LIFETIME_GHS || 29.99),
};

function isMoolreConfigured() {
  return Boolean(MOOLRE_USERNAME && MOOLRE_PUBLIC_KEY && MOOLRE_ACCOUNT_NUMBER);
}

function planAmount(plan) {
  return PLAN_PRICES_GHS[plan] ?? null;
}

function createPaymentReference(plan) {
  return `QUIBET-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function httpsJson(hostname, path, body) {
  const postData = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method: 'POST',
        headers: {
          'X-API-USER': MOOLRE_USERNAME,
          'X-API-PUBKEY': MOOLRE_PUBLIC_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (httpRes) => {
        let data = '';
        httpRes.on('data', (chunk) => {
          data += chunk;
        });
        httpRes.on('end', () => {
          try {
            resolve({ statusCode: httpRes.statusCode, body: JSON.parse(data || '{}') });
          } catch {
            reject(new Error('Invalid Moolre response'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Moolre request timed out'));
    });
    req.write(postData);
    req.end();
  });
}

async function createMoolrePaymentLink({ amount, email, externalref, metadata }) {
  if (!isMoolreConfigured()) {
    const err = new Error('Payment gateway not configured. Please contact support.');
    err.status = 500;
    throw err;
  }

  const backendBase =
    process.env.BACKEND_URL || process.env.API_URL || 'https://bet-app-dgqz.onrender.com';
  const redirectBase =
    process.env.PAYMENT_REDIRECT_URL || process.env.FRONTEND_URL || 'https://quibet.app';

  const moolreData = {
    type: 1,
    amount: Number(amount).toFixed(2),
    email,
    externalref,
    callback: `${backendBase.replace(/\/$/, '')}/api/subscription/webhook/moolre`,
    redirect: `${redirectBase.replace(/\/$/, '')}/payment-success`,
    reusable: '0',
    currency: 'GHS',
    accountnumber: MOOLRE_ACCOUNT_NUMBER,
    metadata: metadata || {},
  };

  const response = await fetch('https://api.moolre.com/embed/link', {
    method: 'POST',
    headers: {
      'X-API-USER': MOOLRE_USERNAME,
      'X-API-PUBKEY': MOOLRE_PUBLIC_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moolreData),
  });

  const data = await response.json();

  if (!response.ok || (data.status !== undefined && data.status !== 1 && data.status !== 200)) {
    const err = new Error(data.message || 'Payment initialization failed');
    err.status = 400;
    err.details = data;
    throw err;
  }

  if (!data.data?.authorization_url) {
    const err = new Error('Payment gateway did not return authorization URL');
    err.status = 500;
    throw err;
  }

  return {
    authorizationUrl: data.data.authorization_url,
    reference: externalref,
    redirectUrl: moolreData.redirect,
  };
}

/**
 * Poll Moolre transaction status until success, failure, or retries exhausted.
 * txstatus: 0 pending, 1 success, 2 failed
 */
async function verifyMoolrePayment(paymentReference, expectedAmount) {
  if (!isMoolreConfigured()) {
    const err = new Error('Payment gateway not configured');
    err.status = 500;
    throw err;
  }

  const RETRY_DELAYS_MS = [0, 2000, 3000, 4000];
  let lastMessage = 'Payment verification failed';

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }

    const moolreRes = await httpsJson('api.moolre.com', '/open/transact/status', {
      type: 1,
      idtype: 1,
      id: paymentReference,
      accountnumber: MOOLRE_ACCOUNT_NUMBER,
    });

    const moolreData = moolreRes.body;
    if (moolreRes.statusCode !== 200 || moolreData.status !== 1) {
      lastMessage = moolreData.message || 'Moolre payment verification failed';
      continue;
    }

    const tx = moolreData.data || {};
    const txstatus = Number(tx.txstatus);
    if (txstatus === 0) {
      lastMessage = 'Payment is still pending';
      continue;
    }
    if (txstatus === 2) {
      const err = new Error(tx.message || 'Payment failed');
      err.status = 400;
      throw err;
    }
    if (txstatus !== 1) {
      lastMessage = 'Unexpected payment status';
      continue;
    }

    if (expectedAmount != null && tx.amount != null) {
      const paid = Number(tx.amount);
      if (Number.isFinite(paid) && Math.abs(paid - Number(expectedAmount)) >= 0.02) {
        const err = new Error(
          `Paid amount (GH₵${paid.toFixed(2)}) does not match plan price (GH₵${Number(expectedAmount).toFixed(2)})`
        );
        err.status = 400;
        throw err;
      }
    }

    return { verified: true, tx };
  }

  const err = new Error(lastMessage);
  err.status = 400;
  throw err;
}

module.exports = {
  PLAN_PRICES_GHS,
  isMoolreConfigured,
  planAmount,
  createPaymentReference,
  createMoolrePaymentLink,
  verifyMoolrePayment,
};
