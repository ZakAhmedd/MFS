const express = require('express');
const fightController = require('../controllers/fightController');

const router = express.Router();

router.get('/', fightController.getAllFights);
router.post('/', fightController.createFight);
router.get('/:id', fightController.getFightById);


module.exports = router;
