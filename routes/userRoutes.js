const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');



const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.post('/verifyEmail', authController.verifyEmail)

router.use(authController.protect);

router.post('/assignRole', userController.assignRole)

router.post('/followUser/:id', userController.followUser);
router.post('/unfollowUser/:id', authController.restrictTo('Fighter', 'Trainer'), userController.unfollowUser);

router.get('/search', userController.search)




module.exports = router;
