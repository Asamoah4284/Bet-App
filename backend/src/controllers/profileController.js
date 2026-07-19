const User = require('../models/User');
const BuddyLink = require('../models/BuddyLink');

const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

function profileUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    username: user.username || null,
    displayName: user.display_name,
    bio: user.bio || '',
    buddyCode: user.buddy_code,
    leaderboardOptIn: Boolean(user.leaderboard_opt_in),
    searchDiscoverable: Boolean(user.search_discoverable),
    hasPassword: Boolean(user.password_hash),
  };
}

function leaderboardUser(user) {
  return {
    id: String(user._id),
    displayName: user.display_name,
    username: user.username || null,
    streakDays: user.recovery_stats?.streak_days || 0,
  };
}

async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { displayName, username, bio, leaderboardOptIn, searchDiscoverable } = req.body;

    if (displayName !== undefined) {
      const value = String(displayName).trim();
      if (value.length < 2 || value.length > 40) {
        return res.status(400).json({ error: 'Display name must be 2-40 characters' });
      }
      user.display_name = value;
    }

    if (username !== undefined) {
      const value = String(username).trim().toLowerCase();
      if (value && !USERNAME_PATTERN.test(value)) {
        return res.status(400).json({
          error: 'Username must be 3-20 characters using letters, numbers, dots or underscores',
        });
      }
      if (value) {
        const taken = await User.findOne({ username: value, _id: { $ne: user._id } });
        if (taken) return res.status(409).json({ error: 'This username is already taken' });
        user.username = value;
      } else {
        user.username = undefined;
      }
    }

    if (bio !== undefined) {
      const value = String(bio).trim();
      if (value.length > 160) {
        return res.status(400).json({ error: 'Bio must be 160 characters or fewer' });
      }
      user.bio = value;
    }

    if (leaderboardOptIn !== undefined) {
      user.leaderboard_opt_in = Boolean(leaderboardOptIn);
    }

    if (searchDiscoverable !== undefined) {
      user.search_discoverable = Boolean(searchDiscoverable);
    }

    await user.save();
    res.json({ user: profileUser(user) });
  } catch (err) {
    next(err);
  }
}

async function syncRecoveryStats(req, res, next) {
  try {
    const number = (value, minimum = 0) => Math.max(minimum, Number(value) || 0);
    const stats = {
      streak_days: Math.floor(number(req.body.streakDays)),
      money_kept: number(req.body.moneyKept, -Number.MAX_SAFE_INTEGER),
      urges_logged: Math.floor(number(req.body.urgesLogged)),
      journal_entries: Math.floor(number(req.body.journalEntries)),
      updated_at: new Date(),
    };

    await User.findByIdAndUpdate(req.userId, { recovery_stats: stats });
    res.json({ message: 'Recovery stats synced' });
  } catch (err) {
    next(err);
  }
}

async function sharedProfile(req, res, next) {
  try {
    const user = await User.findOne({ buddy_code: req.params.buddyCode.toUpperCase() });
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    res.json({
      profile: {
        displayName: user.display_name,
        username: user.username || null,
        bio: user.bio || '',
        buddyCode: user.buddy_code,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function leaderboard(req, res, next) {
  try {
    const scope = req.query.scope === 'friends' ? 'friends' : 'global';
    let allowedIds = null;

    if (scope === 'friends') {
      const links = await BuddyLink.find({
        status: 'accepted',
        $or: [{ requester: req.userId }, { receiver: req.userId }],
      });
      allowedIds = [req.userId];
      for (const link of links) {
        allowedIds.push(
          String(link.requester) === req.userId ? link.receiver : link.requester
        );
      }
    }

    const query = { leaderboard_opt_in: true };
    if (allowedIds) query._id = { $in: allowedIds };

    const users = await User.find(query)
      .sort({ 'recovery_stats.streak_days': -1, 'recovery_stats.updated_at': 1 })
      .limit(100);

    res.json({
      scope,
      entries: users.map((user, index) => ({
        rank: index + 1,
        ...leaderboardUser(user),
        isMe: String(user._id) === req.userId,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, syncRecoveryStats, sharedProfile, leaderboard };
