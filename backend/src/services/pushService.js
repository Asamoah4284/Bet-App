const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

const expo = new Expo();

const MAX_TOKENS_PER_USER = 5;

const ENCOURAGEMENTS = [
  'Every hour you stay the course is a quiet win.',
  'You are more than one urge. Keep going.',
  'Progress, not perfection. You are doing the work.',
  'The calm you build today compounds tomorrow.',
  'You have gotten through 100% of your hardest days.',
];

function pickEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

function serializePrefs(prefs = {}) {
  return {
    checkinEnabled: Boolean(prefs.checkinEnabled),
    checkinHour: Number.isInteger(prefs.checkinHour) ? prefs.checkinHour : 20,
    checkinMinute: Number.isInteger(prefs.checkinMinute) ? prefs.checkinMinute : 0,
    encouragementEnabled: Boolean(prefs.encouragementEnabled),
    encouragementHour: Number.isInteger(prefs.encouragementHour) ? prefs.encouragementHour : 9,
    encouragementMinute: Number.isInteger(prefs.encouragementMinute)
      ? prefs.encouragementMinute
      : 0,
    buddyEventsEnabled: prefs.buddyEventsEnabled !== false,
    streakMilestonesEnabled: prefs.streakMilestonesEnabled !== false,
    urgeFollowupEnabled: prefs.urgeFollowupEnabled !== false,
    timezone: prefs.timezone || 'Africa/Accra',
  };
}

async function removeInvalidToken(token) {
  await User.updateMany({}, { $pull: { push_tokens: { token } } });
}

/**
 * Send Expo push messages to one or more users.
 * @param {string|string[]} userIds
 * @param {{ title: string, body: string, data?: object, channelId?: string }} payload
 */
async function sendPushToUsers(userIds, payload) {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String);
  if (ids.length === 0) return { sent: 0 };

  const users = await User.find({ _id: { $in: ids } }).select('push_tokens');
  const messages = [];

  for (const user of users) {
    for (const entry of user.push_tokens || []) {
      if (!Expo.isExpoPushToken(entry.token)) continue;
      messages.push({
        to: entry.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        channelId: payload.channelId,
      });
    }
  }

  if (messages.length === 0) return { sent: 0 };

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i += 1) {
        const ticket = tickets[i];
        if (ticket.status === 'ok') {
          sent += 1;
        } else if (
          ticket.status === 'error' &&
          ticket.details?.error === 'DeviceNotRegistered'
        ) {
          await removeInvalidToken(chunk[i].to);
        }
      }
    } catch (err) {
      console.error('Expo push chunk failed:', err.message);
    }
  }

  return { sent };
}

async function upsertPushToken(userId, token, platform = 'unknown') {
  if (!Expo.isExpoPushToken(token)) {
    const error = new Error('Invalid Expo push token');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const existing = (user.push_tokens || []).filter((entry) => entry.token !== token);
  existing.unshift({
    token,
    platform: ['ios', 'android'].includes(platform) ? platform : 'unknown',
    updated_at: new Date(),
  });
  user.push_tokens = existing.slice(0, MAX_TOKENS_PER_USER);
  await user.save();
  return user.push_tokens;
}

async function removePushToken(userId, token) {
  await User.findByIdAndUpdate(userId, { $pull: { push_tokens: { token } } });
}

module.exports = {
  ENCOURAGEMENTS,
  pickEncouragement,
  serializePrefs,
  sendPushToUsers,
  upsertPushToken,
  removePushToken,
  MAX_TOKENS_PER_USER,
};
