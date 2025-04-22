const express = require('express');
const fightController = require('../controllers/fightController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/', fightController.getAllFights);
router.post('/', authController.restrictTo('Trainer'), fightController.createFight);
router.get('/:id', fightController.getFightById);


module.exports = router;
