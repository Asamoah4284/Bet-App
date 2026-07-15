const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mood: { type: String, default: null },
  urge_level: { type: Number, default: null },
  note: { type: String, default: null },
  streak_days: { type: Number, default: 0 },
  money_saved: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Checkin', checkinSchema);
