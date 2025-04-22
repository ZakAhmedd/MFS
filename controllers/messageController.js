const Message = require('../models/messageModel');
const catchAsync = require('./../utils/catchAsync');

// Send a message
exports.sendMessage = catchAsync(async (req, res) => {
  const { receiver, content } = req.body;
  const senderId = req.user._id;

  const message = await Message.create({
    sender: senderId,
    receiver: receiver,
    content,
  });

// Emit to receiver
global.io.to(receiver).emit('newMessage', {
    message,
    from: senderId
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
      { sender: otherUserId, receiver: userId },
    ],
  }).sort({ createdAt: 1 }); // chronological

  res.status(200).json({ status: 'success', data: messages });
});

// Mark messages as read
exports.markAsRead = catchAsync(async (req, res) => {
  const { sender } = req.body;
  const receiver = req.user._id;

  await Message.updateMany(
    { sender: sender, receiver: receiver, read: false },
    { $set: { read: true } },
  );

  res
    .status(200)
    .json({ status: 'success', message: 'Messages marked as read' });
});
