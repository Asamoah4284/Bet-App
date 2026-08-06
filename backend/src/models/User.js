const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'unknown'], default: 'unknown' },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const notificationPrefsSchema = new mongoose.Schema(
  {
    checkinEnabled: { type: Boolean, default: false },
    checkinHour: { type: Number, default: 20, min: 0, max: 23 },
    checkinMinute: { type: Number, default: 0, min: 0, max: 59 },
    encouragementEnabled: { type: Boolean, default: false },
    encouragementHour: { type: Number, default: 9, min: 0, max: 23 },
    encouragementMinute: { type: Number, default: 0, min: 0, max: 59 },
    buddyEventsEnabled: { type: Boolean, default: true },
    streakMilestonesEnabled: { type: Boolean, default: true },
    urgeFollowupEnabled: { type: Boolean, default: true },
    timezone: { type: String, default: 'Africa/Accra', trim: true },
    last_checkin_push_local_date: { type: String, default: null },
    last_encouragement_push_local_date: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  // Optional for Google-only accounts.
  password_hash: {
    type: String,
    required: function requiredWithoutGoogle() {
      return !this.google_id;
    },
  },
  google_id: { type: String, unique: true, sparse: true },
  display_name: { type: String, required: true, trim: true },
  bio: { type: String, trim: true, maxlength: 160, default: '' },
  leaderboard_opt_in: { type: Boolean, default: false },
  search_discoverable: { type: Boolean, default: false },
  recovery_stats: {
    streak_days: { type: Number, default: 0, min: 0 },
    money_kept: { type: Number, default: 0 },
    urges_logged: { type: Number, default: 0, min: 0 },
    journal_entries: { type: Number, default: 0, min: 0 },
    updated_at: { type: Date, default: null },
  },
  notification_prefs: { type: notificationPrefsSchema, default: () => ({}) },
  push_tokens: { type: [pushTokenSchema], default: [] },
  buddy_code: { type: String, required: true, unique: true },
  reset_code_hash: { type: String, default: null },
  reset_code_expires: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
