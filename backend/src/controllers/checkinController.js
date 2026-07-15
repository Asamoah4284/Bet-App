const Checkin = require('../models/Checkin');
const User = require('../models/User');
const { isBuddyWith } = require('./buddyController');

function serializeCheckin(checkin) {
  return {
    id: String(checkin._id),
    user_id: String(checkin.user),
    mood: checkin.mood,
    urge_level: checkin.urge_level,
    note: checkin.note,
    streak_days: checkin.streak_days,
    money_saved: checkin.money_saved,
    created_at: checkin.created_at,
  };
}

// Post a daily check-in (shared with buddies)
async function createCheckin(req, res, next) {
  try {
    const { mood, urgeLevel, note, streakDays, moneySaved } = req.body;

    const checkin = await Checkin.create({
      user: req.userId,
      mood: mood || null,
      urge_level: Number.isFinite(urgeLevel) ? urgeLevel : null,
      note: note || null,
      streak_days: Number.isFinite(streakDays) ? streakDays : 0,
      money_saved: Number.isFinite(moneySaved) ? moneySaved : 0,
    });

    res.status(201).json({ checkin: serializeCheckin(checkin) });
  } catch (err) {
    next(err);
  }
}

// List the current user's own check-ins
async function myCheckins(req, res, next) {
  try {
    const checkins = await Checkin.find({ user: req.userId })
      .sort({ created_at: -1 })
      .limit(60);
    res.json({ checkins: checkins.map(serializeCheckin) });
  } catch (err) {
    next(err);
  }
}

// View a buddy's check-ins (only if linked)
async function buddyCheckins(req, res, next) {
  try {
    const buddyId = req.params.userId;

    if (!(await isBuddyWith(req.userId, buddyId))) {
      return res.status(403).json({ error: 'You are not buddies with this user' });
    }

    const buddy = await User.findById(buddyId);
    const checkins = await Checkin.find({ user: buddyId })
      .sort({ created_at: -1 })
      .limit(60);

    res.json({
      buddy: { id: String(buddy._id), displayName: buddy.display_name },
      checkins: checkins.map(serializeCheckin),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCheckin, myCheckins, buddyCheckins };
