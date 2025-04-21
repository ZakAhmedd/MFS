const Message = require('../models/messageModel');
const catchAsync = require('./../utils/catchAsync');

// Send a message
exports.sendMessage = catchAsync(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });

  res.status(201).json({ status: 'success', data: message });
});

// Get conversation between two users
exports.getMessages = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId }
    ]
  }).sort({ createdAt: 1 }); // chronological

  res.status(200).json({ status: 'success', data: messages });
});

// Mark messages as read
exports.markAsRead = catchAsync(async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user._id;

  await Message.updateMany(
    { sender: senderId, receiver: receiverId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({ status: 'success', message: 'Messages marked as read' });
});
