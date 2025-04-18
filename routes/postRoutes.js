const express = require('express');
const authController = require('./../controllers/authController');
const postController = require('./../controllers/postController');

const router = express.Router();

router.use(authController.protect);

router.post(
  '/createPost',
  authController.restrictTo('Fighter', 'Trainer'),
  postController.createPost,
);

router.post('/like/:id', postController.likePost);
router.post('/comment/:id', postController.commentOnPost);
router.post('/comment/:id/reply/:commentId', postController.replyToComment);
router.post('/share/:id', postController.sharePost);

router.get('/:userId', postController.getPostsByUser);
router.get('/getPost/:id', postController.getPost);

router.patch(
  '/updatePost/:id',
  authController.restrictTo('Fighter', 'Trainer'),
  postController.updatePost,
);
router.delete(
  '/deletePost/:id',
  authController.restrictTo('Fighter', 'Trainer'),
  postController.deletePost,
);

// router.post('/followUser/:id', postController.followUser);
// router.post('/unfollowUser/:id', authController.restrictTo('Fighter', 'Trainer'), postController.unfollowUser);
router.post('/:postId/followUserFromPost', postController.followUserFromPost);
router.post('/:postId/unfollowUserFromPost', authController.restrictTo('Fighter', 'Trainer'), postController.unfollowUserFromPost);

module.exports = router;
