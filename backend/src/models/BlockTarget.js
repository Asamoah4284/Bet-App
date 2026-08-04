const mongoose = require('mongoose');

const blockTargetSchema = new mongoose.Schema({
  kind: {
    type: String,
    required: true,
    enum: ['domain', 'androidPackage'],
  },
  value: { type: String, required: true, trim: true, lowercase: true },
  label: { type: String, required: true, trim: true },
  region: { type: String, trim: true, default: 'GH' },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

blockTargetSchema.index({ kind: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('BlockTarget', blockTargetSchema);
