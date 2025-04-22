const User = require('./../models/userModel');
const Post = require('./../models/postModel');
const Fight = require('./../models/fightModel');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

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

exports.search = catchAsync(async (req, res, next) => {
  const { query = '', filter = '', page = 1, limit = 10 } = req.query;
  const cleanedQuery = query.toLowerCase().replace('#', '').trim();
  const regexQuery = new RegExp(cleanedQuery, 'i');

  let posts = [];
  let users = [];

  const skip = (page - 1) * limit;

  // === Predictive Suggestions ===
  if (query) {
    let suggestions = [];

    // 1. Predictive Search for Posts
    if (!filter || filter === 'posts' || filter === 'top' || filter === 'latest') {
      let postQuery = Post.find({
        $or: [
          { text: regexQuery },
          { hashtags: regexQuery }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5); // Limit results for predictive suggestions

      suggestions.push({
        type: 'posts',
        results: await postQuery
      });
    }

    // 2. Predictive Search for Users
    if (!filter || filter === 'accounts') {
      let userQuery = User.find({
        $or: [
          { username: regexQuery },
          { name: regexQuery },
          { bio: regexQuery }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5); // Limit results for predictive suggestions

      suggestions.push({
        type: 'users',
        results: await userQuery
      });
    }

    // 3. Predictive Search for Hashtags
    if (filter === 'hashtags' || query.includes('#')) {
      const hashtags = cleanedQuery.split(',').map(tag => tag.trim());
      const hashtagPosts = await Post.find({
        hashtags: { $in: hashtags }
      }).sort({ createdAt: -1 }).limit(5); // Limit results for predictive suggestions

      suggestions.push({
        type: 'hashtags',
        results: hashtagPosts
      });
    }

    // Return suggestions before hitting the full search
    return res.status(200).json({
      status: 'success',
      data: suggestions
    });
  }

  // === Full Search === (only if query is fully typed)
  let postQuery = Post.find({
    $or: [
      { text: regexQuery },
      { hashtags: regexQuery }
    ]
  });

  // Sorting options
  if (filter === 'top') {
    postQuery = postQuery.sort({ likes: -1 });
  } else if (filter === 'latest') {
    postQuery = postQuery.sort({ createdAt: -1 });
  } else {
    postQuery = postQuery.sort({ createdAt: -1 }); // Default fallback sorting
  }

  postQuery = postQuery.skip(skip).limit(limit);
  posts = await postQuery;

  // === Users Search ===
  let userQuery = User.find({
    $or: [
      { username: regexQuery },
      { name: regexQuery },
      { bio: regexQuery }
    ]
  })
    .skip(skip)
    .limit(limit);
  users = await userQuery;

  // === Hashtags Search ===
  if (filter === 'hashtags' || query.includes('#')) {
    const hashtags = cleanedQuery.split(',').map(tag => tag.trim());
    posts = await Post.find({
      hashtags: { $in: hashtags }
    }).sort({ createdAt: -1 }).limit(50); // Show top 50 posts for hashtags
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

exports.blockUser = catchAsync(async (req, res) => {
  const { blockedUserId } = req.body;

  if (!blockedUserId) {
    return res.status(400).json({ message: 'Blocked user ID is required.' });
  }

  const user = await User.findById(req.user.id);  // Get the logged-in user

  // Check if the user is trying to block themself
  if (req.user.id === blockedUserId) {
    return res.status(400).json({ message: 'You cannot block yourself.' });
  }

  // Check if the user has already blocked the other user
  if (user.blockedUsers.includes(blockedUserId)) {
    return res.status(400).json({ message: 'User is already blocked.' });
  }

  // Add the blocked user to the blockedUsers array
  user.blockedUsers.push(blockedUserId);
  await user.save();

  res.status(201).json({ message: 'User blocked successfully.' });

});

exports.unblockUser = catchAsync(async (req, res) => {
  const { blockedUserId } = req.body;

  if (!blockedUserId) {
    return res.status(400).json({ message: 'Blocked user ID is required.' });
  }

  const user = await User.findById(req.user.id);  // Get the logged-in user

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Check if the user has blocked the other user
  if (!user.blockedUsers.includes(blockedUserId)) {
    return res.status(400).json({ message: 'User is not blocked.' });
  }

  // Remove the blocked user from the blockedUsers array
  user.blockedUsers.pull(blockedUserId);
  await user.save();

  res.status(200).json({ message: 'User unblocked successfully.' });
});

exports.getUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const posts = await Post.find({ user: userId });
  const fights = await Fight.find({ participants: userId }); 
  
  res.status(200).json({
    user,
    posts,
    fights,
  })
})
  

exports.updateProfile = async (req, res) => {
  const userId = req.user._id;
  const { bio, profilePicture } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { bio, profilePicture },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
};