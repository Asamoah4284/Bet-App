const BlockTarget = require('../models/BlockTarget');

const DEFAULT_TARGETS = [
  { kind: 'domain', value: 'sportybet.com', label: 'SportyBet', region: 'GH' },
  { kind: 'domain', value: 'www.sportybet.com', label: 'SportyBet (www)', region: 'GH' },
  { kind: 'domain', value: 'betway.com.gh', label: 'Betway Ghana', region: 'GH' },
  { kind: 'domain', value: 'www.betway.com.gh', label: 'Betway Ghana (www)', region: 'GH' },
  { kind: 'domain', value: 'msport.com', label: 'MSport', region: 'GH' },
  { kind: 'domain', value: 'www.msport.com', label: 'MSport (www)', region: 'GH' },
  { kind: 'domain', value: 'football.com.gh', label: 'Football.com.gh', region: 'GH' },
  { kind: 'domain', value: 'www.football.com.gh', label: 'Football.com.gh (www)', region: 'GH' },
  { kind: 'domain', value: 'betghana.com', label: 'BetGhana', region: 'GH' },
  { kind: 'domain', value: 'premierbet.com', label: 'Premier Bet', region: 'GH' },
  { kind: 'domain', value: 'www.premierbet.com', label: 'Premier Bet (www)', region: 'GH' },
  { kind: 'domain', value: 'melbet.com', label: 'Melbet', region: 'GH' },
  { kind: 'domain', value: '1xbet.com', label: '1xBet', region: 'GH' },
  { kind: 'domain', value: 'bet365.com', label: 'Bet365', region: 'GH' },
  { kind: 'domain', value: 'sportsbet.io', label: 'Sportsbet.io', region: 'GH' },
  {
    kind: 'androidPackage',
    value: 'com.sportybet.android',
    label: 'SportyBet app',
    region: 'GH',
  },
  {
    kind: 'androidPackage',
    value: 'com.betway.android',
    label: 'Betway app',
    region: 'GH',
  },
  {
    kind: 'androidPackage',
    value: 'com.msport.android',
    label: 'MSport app',
    region: 'GH',
  },
];

function serializeTarget(target) {
  return {
    id: String(target._id),
    kind: target.kind,
    value: target.value,
    label: target.label,
    region: target.region || null,
  };
}

async function ensureSeeded() {
  const count = await BlockTarget.countDocuments();
  if (count > 0) return;

  await BlockTarget.insertMany(
    DEFAULT_TARGETS.map((item) => ({ ...item, active: true })),
    { ordered: false }
  ).catch(() => {
    // Ignore duplicate-key races if multiple instances seed at once.
  });
}

async function listTargets(req, res, next) {
  try {
    await ensureSeeded();

    const kind = req.query.kind;
    const query = { active: true };
    if (kind === 'domain' || kind === 'androidPackage') {
      query.kind = kind;
    }

    const targets = await BlockTarget.find(query).sort({ kind: 1, label: 1 });
    res.json({
      targets: targets.map(serializeTarget),
      domains: targets.filter((t) => t.kind === 'domain').map((t) => t.value),
      androidPackages: targets
        .filter((t) => t.kind === 'androidPackage')
        .map((t) => t.value),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTargets, ensureSeeded, DEFAULT_TARGETS };
