const Message = require('../models/messageModel');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const { getIo } = require('../socket')

// Send a message
exports.sendMessage = catchAsync(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  // Fetch both sender and receiver
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  // Check if either user has blocked the other
  const isBlocked =
    sender.blockedUsers.includes(receiverId) ||
    receiver.blockedUsers.includes(senderId);

  if (isBlocked) {
    return res.status(403).json({ message: 'Unable to send message as one of the users has the other one blocked.' });
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });

// Emit to receiver
global.io.to(receiverId).emit('newMessage', {
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


exports.reportMessage = catchAsync(async (req, res, next) => {
  const { messageId, reason } = req.body;

  if (!reason || !messageId) {
    return res.status(400).json({ message: 'Message ID and reason are required.' });
  }

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ message: 'Message not found.' });
  }

  // Prevent duplicate reports by same user
  const alreadyReported = message.reports.some(
    (report) => report.reportedBy.toString() === req.user.id
  );
  if (alreadyReported) {
    return res.status(400).json({ message: 'You have already reported this message.' });
  }

  message.reports.push({
    reportedBy: req.user.id,
    reason,
  });

  await message.save();

  const io = getIO();

  io.to('moderators').emit('reportNotification', {
    messageId: message._id,
    reportedBy: req.user.id,
    reason,
    reportedAt: new Date(),
  });

  res.status(200).json({ status: 'success', message: 'Message reported successfully.' });
});