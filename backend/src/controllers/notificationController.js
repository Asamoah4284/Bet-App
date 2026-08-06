const User = require('../models/User');
const NotificationJob = require('../models/NotificationJob');
const {
  serializePrefs,
  upsertPushToken,
  removePushToken,
  sendPushToUsers,
} = require('../services/pushService');
const { clampHour, clampMinute, isValidTimezone } = require('../services/notificationHelpers');

const URGE_FOLLOWUP_MS = 2 * 60 * 60 * 1000;

async function getPrefs(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('notification_prefs push_tokens');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      prefs: serializePrefs(user.notification_prefs),
      hasPushToken: (user.push_tokens || []).length > 0,
    });
  } catch (err) {
    next(err);
  }
}

async function updatePrefs(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const body = req.body || {};
    const prefs = user.notification_prefs || {};

    if (body.checkinEnabled !== undefined) prefs.checkinEnabled = Boolean(body.checkinEnabled);
    if (body.checkinHour !== undefined) {
      prefs.checkinHour = clampHour(Number(body.checkinHour), prefs.checkinHour ?? 20);
    }
    if (body.checkinMinute !== undefined) {
      prefs.checkinMinute = clampMinute(Number(body.checkinMinute), prefs.checkinMinute ?? 0);
    }
    if (body.encouragementEnabled !== undefined) {
      prefs.encouragementEnabled = Boolean(body.encouragementEnabled);
    }
    if (body.encouragementHour !== undefined) {
      prefs.encouragementHour = clampHour(
        Number(body.encouragementHour),
        prefs.encouragementHour ?? 9
      );
    }
    if (body.encouragementMinute !== undefined) {
      prefs.encouragementMinute = clampMinute(
        Number(body.encouragementMinute),
        prefs.encouragementMinute ?? 0
      );
    }
    if (body.buddyEventsEnabled !== undefined) {
      prefs.buddyEventsEnabled = Boolean(body.buddyEventsEnabled);
    }
    if (body.streakMilestonesEnabled !== undefined) {
      prefs.streakMilestonesEnabled = Boolean(body.streakMilestonesEnabled);
    }
    if (body.urgeFollowupEnabled !== undefined) {
      prefs.urgeFollowupEnabled = Boolean(body.urgeFollowupEnabled);
    }
    if (body.timezone !== undefined) {
      const zone = String(body.timezone).trim();
      prefs.timezone = isValidTimezone(zone) ? zone : prefs.timezone || 'Africa/Accra';
    }

    user.notification_prefs = prefs;
    user.markModified('notification_prefs');
    await user.save();

    res.json({
      prefs: serializePrefs(user.notification_prefs),
      hasPushToken: (user.push_tokens || []).length > 0,
    });
  } catch (err) {
    next(err);
  }
}

async function registerDevice(req, res, next) {
  try {
    const token = String(req.body?.token || '').trim();
    const platform = String(req.body?.platform || 'unknown').toLowerCase();
    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    await upsertPushToken(req.userId, token, platform);
    res.status(201).json({ message: 'Device registered' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function unregisterDevice(req, res, next) {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    await removePushToken(req.userId, token);
    res.json({ message: 'Device unregistered' });
  } catch (err) {
    next(err);
  }
}

async function scheduleUrgeFollowup(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('notification_prefs');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.notification_prefs?.urgeFollowupEnabled === false) {
      return res.json({ scheduled: false, reason: 'disabled' });
    }

    await NotificationJob.updateMany(
      { user: req.userId, type: 'urge_followup', status: 'pending' },
      { status: 'cancelled' }
    );

    const job = await NotificationJob.create({
      user: req.userId,
      type: 'urge_followup',
      title: 'Still with you',
      body: 'Checking in gently — how are you feeling after that urge?',
      data: { type: 'urge_followup', screen: 'Home' },
      sendAt: new Date(Date.now() + URGE_FOLLOWUP_MS),
      status: 'pending',
    });

    res.status(201).json({ scheduled: true, sendAt: job.sendAt });
  } catch (err) {
    next(err);
  }
}

/** Fire-and-forget helper used by other controllers. */
async function notifyUser(userId, { title, body, data, channelId, requireBuddyEvents }) {
  try {
    if (requireBuddyEvents) {
      const user = await User.findById(userId).select('notification_prefs');
      if (!user || user.notification_prefs?.buddyEventsEnabled === false) {
        return;
      }
    }
    await sendPushToUsers(userId, { title, body, data, channelId });
  } catch (err) {
    console.error('notifyUser failed:', err.message);
  }
}

module.exports = {
  getPrefs,
  updatePrefs,
  registerDevice,
  unregisterDevice,
  scheduleUrgeFollowup,
  notifyUser,
  URGE_FOLLOWUP_MS,
};
