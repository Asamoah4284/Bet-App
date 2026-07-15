const mongoose = require('mongoose');

const buddyLinkSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});

// One link per pair of users (in either direction we check in code)
buddyLinkSchema.index({ requester: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('BuddyLink', buddyLinkSchema);
