const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  created_at: { type: Date, default: Date.now, index: true },
  read_at: { type: Date, default: null },
});

messageSchema.index({ sender: 1, receiver: 1, created_at: -1 });

module.exports = mongoose.model('Message', messageSchema);
