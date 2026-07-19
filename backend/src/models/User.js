const mongoose = require('mongoose');

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
  buddy_code: { type: String, required: true, unique: true },
  reset_code_hash: { type: String, default: null },
  reset_code_expires: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
