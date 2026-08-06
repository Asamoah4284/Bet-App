const cron = require('node-cron');
const User = require('../models/User');
const NotificationJob = require('../models/NotificationJob');
const {
  sendPushToUsers,
  pickEncouragement,
} = require('./pushService');
const {
  localTimeParts,
  matchesLocalMinute,
} = require('./notificationHelpers');

let started = false;

async function processDueJobs(now = new Date()) {
  const jobs = await NotificationJob.find({
    status: 'pending',
    sendAt: { $lte: now },
  })
    .sort({ sendAt: 1 })
    .limit(100);

  for (const job of jobs) {
    try {
      await sendPushToUsers(job.user, {
        title: job.title,
        body: job.body,
        data: job.data || { type: job.type },
        channelId: job.type === 'urge_followup' ? 'support' : undefined,
      });
      job.status = 'sent';
      job.sentAt = new Date();
      await job.save();
    } catch (err) {
      console.error('Notification job failed:', job._id, err.message);
    }
  }
}

async function processDailyReminders(now = new Date()) {
  const candidates = await User.find({
    'push_tokens.0': { $exists: true },
    $or: [
      { 'notification_prefs.checkinEnabled': true },
      { 'notification_prefs.encouragementEnabled': true },
    ],
  }).select('notification_prefs push_tokens');

  for (const user of candidates) {
    const prefs = user.notification_prefs || {};
    const parts = localTimeParts(now, prefs.timezone);

    if (
      prefs.checkinEnabled &&
      matchesLocalMinute(prefs.checkinHour, prefs.checkinMinute, parts) &&
      prefs.last_checkin_push_local_date !== parts.localDate
    ) {
      await sendPushToUsers(user._id, {
        title: 'Daily reflection',
        body: 'Did you stay gambling-free today? One honest answer keeps your streak meaningful.',
        data: { type: 'daily_checkin', screen: 'DailyReflection' },
        channelId: 'reminders',
      });
      prefs.last_checkin_push_local_date = parts.localDate;
      user.notification_prefs = prefs;
      user.markModified('notification_prefs');
      await user.save();
    }

    if (
      prefs.encouragementEnabled &&
      matchesLocalMinute(prefs.encouragementHour, prefs.encouragementMinute, parts) &&
      prefs.last_encouragement_push_local_date !== parts.localDate
    ) {
      await sendPushToUsers(user._id, {
        title: 'A note for you',
        body: pickEncouragement(),
        data: { type: 'daily_encouragement', screen: 'Home' },
        channelId: 'reminders',
      });
      prefs.last_encouragement_push_local_date = parts.localDate;
      user.notification_prefs = prefs;
      user.markModified('notification_prefs');
      await user.save();
    }
  }
}

async function tick() {
  const now = new Date();
  await processDueJobs(now);
  await processDailyReminders(now);
}

function startNotificationCron() {
  if (started) return;
  started = true;

  cron.schedule('* * * * *', () => {
    tick().catch((err) => console.error('Notification cron tick failed:', err.message));
  });

  console.log('Notification cron started (every minute)');
}

module.exports = {
  startNotificationCron,
  processDueJobs,
  processDailyReminders,
  tick,
};
