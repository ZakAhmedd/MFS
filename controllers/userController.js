const User = require('./../models/userModel');
const Post = require('./../models/postModel');
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

exports.followUser = catchAsync(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  const currentUser = req.user;

  if (!targetUser) return next(new AppError('User not found', 404));

  if (targetUser._id.equals(currentUser._id)) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  if (!targetUser.followers.includes(currentUser._id)) {
    targetUser.followers.push(currentUser._id);
    await targetUser.save();

    currentUser.following.push(targetUser._id);
    await currentUser.save();
  }

  res.status(200).json({ status: 'success', message: 'Followed user' });
});

exports.unfollowUser = catchAsync(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  const currentUser = req.user;

  if (!targetUser) return next(new AppError('User not found', 404));

  targetUser.followers = targetUser.followers.filter(
    (id) => !id.equals(currentUser._id),
  );
  await targetUser.save();

  currentUser.following = currentUser.following.filter(
    (id) => !id.equals(targetUser._id),
  );
  await currentUser.save();

  res.status(200).json({ status: 'success', message: 'Unfollowed user' });
});

// Search Functionality for Posts, Accounts, and Hashtags
exports.search = catchAsync(async (req, res, next) => {
    const { query = '', filter = '', page = 1, limit = 10 } = req.query;
    const cleanedQuery = query.toLowerCase().replace('#', '').trim();
  
    let posts = [];
    let users = [];
  
    // === SEARCH BY FILTER ===
    if (!filter || filter === 'posts' || filter === 'top' || filter === 'latest') {
      let postQuery = Post.find({
        $or: [
          { text: { $regex: cleanedQuery, $options: 'i' } },
          { hashtags: { $in: [cleanedQuery] } }
        ]
      });
  
      const sortBy = filter === 'top' ? '-likes' : '-createdAt';
  
      const postFeatures = new APIFeatures(postQuery, req.query)
        .sort(sortBy)
        .limitFields()
        .paginate();
  
      posts = await postFeatures.query;
    }
  
    if (!filter || filter === 'accounts') {
      let userQuery = User.find({
        $or: [
          { username: { $regex: cleanedQuery, $options: 'i' } },
          { firstName: { $regex: cleanedQuery, $options: 'i' } },
          { lastName: { $regex: cleanedQuery, $options: 'i' } }
        ]
      });
  
      const userFeatures = new APIFeatures(userQuery, req.query).paginate();
      users = await userFeatures.query;
    }
  
    if (filter === 'hashtags') {
        const hashtags = cleanedQuery.split(',').map(tag => tag.trim());
        posts = await Post.find({ hashtags: { $in: hashtags } }).sort('-createdAt').limit(50);
      }
      
  
    res.status(200).json({
      status: 'success',
      results: {
        posts: posts.length,
        users: users.length
      },
      data: {
        posts,
        users
      }
    });
});
