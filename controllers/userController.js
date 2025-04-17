const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.assignRole = catchAsync(async (req, res, next) => {
  const { wantsToFight, wantsToTrain } = req.body;
  const email = req.user.email

  const user = await User.findOne({ email });

  if (!user || !user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'User not found or not verified',
    });
  }

  let assignedrole = ['Member'];

  if (wantsToFight) assignedrole.push('Fighter');
  if (wantsToTrain) assignedrole.push('Trainer');

  user.role = assignedrole;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'role assigned successfully',
    data: {
      role: user.role,
    },
  });
});
