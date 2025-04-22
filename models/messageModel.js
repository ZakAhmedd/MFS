const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound Indexing
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

messageSchema.index({ content: 'text' });

module.exports = mongoose.model('Message', messageSchema);
