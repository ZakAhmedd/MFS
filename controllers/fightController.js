const Fight = require('../models/Fight');
const catchAsync = require('./../utils/catchAsync');

exports.getAllFights = catcbAsync(async (req, res) => {
    const fights = await Fight.find().populate('participants', 'username profilePicture');
    res.status(200).json(fights);
});

exports.createFight = catchAsync(async (req, res) => {
    const { title, description, date, participants } = req.body;

    if (!title || !participants || participants.length < 2) {
      return res.status(400).json({ message: 'Title and participants are required' });
    }

    const newFight = new Fight({
      title,
      description,
      date,
      participants,
    });

    await newFight.save();

    res.status(201).json(newFight);
});

exports.getFightById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const fight = await Fight.findById(id).populate('participants', 'username profilePicture');

    if (!fight) {
        return res.status(404).json({ message: 'Fight not found' });
    }

    res.status(200).json(fight);
});
