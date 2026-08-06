const mongoose = require('mongoose');

const notificationJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'urge_followup',
      'buddy_request',
      'buddy_accepted',
      'buddy_checkin',
      'streak_milestone',
      'daily_checkin',
      'daily_encouragement',
    ],
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  sendAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'cancelled'],
    default: 'pending',
    index: true,
  },
  sentAt: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

notificationJobSchema.index({ status: 1, sendAt: 1 });

module.exports = mongoose.model('NotificationJob', notificationJobSchema);
