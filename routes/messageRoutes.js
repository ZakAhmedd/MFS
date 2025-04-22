const express = require('express');
const messageController = require('../controllers/messageController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect)

router.post('/send', messageController.sendMessage);

// Get conversation between logged-in user and another user
router.get('/:userId', messageController.getMessages);

// Mark messages from a sender as read
router.patch('/read', messageController.markAsRead);

router.post('/reportMessage', messageController.reportMessage);

router.delete('/:messageId', messageController.deleteMessage);
router.delete('/conversation/:userId', messageController.deleteConversation);


module.exports = router;
