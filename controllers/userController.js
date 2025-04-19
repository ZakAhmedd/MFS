const User = require('./../models/userModel');
const Post = require('./../models/postModel');
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

  // === Search Posts ===
  if (!filter || filter === 'posts' || filter === 'top' || filter === 'latest') {
    let postQuery = Post.find({
      $or: [
        { text: regexQuery },
        { hashtags: regexQuery }
      ]
    });

    // Sorting
    if (filter === 'top') {
      postQuery = postQuery.sort({ likes: -1 });
    } else if (filter === 'latest') {
      postQuery = postQuery.sort({ createdAt: -1 });
    } else {
      postQuery = postQuery.sort({ createdAt: -1 }); // fallback for relevance
    }

    postQuery = postQuery.skip(skip).limit(limit);
    posts = await postQuery;

    // Optional: Composite scoring
    posts = posts.map(post => {
      const contentMatch = cleanedQuery && post.content?.toLowerCase().includes(cleanedQuery) ? 1 : 0;
      const hashtagMatch = post.hashtags?.some(tag => tag.toLowerCase().includes(cleanedQuery)) ? 1 : 0;
      const compositeScore = (post.likes || 0) * 0.4 + (contentMatch + hashtagMatch) * 0.6;

      return {
        ...post.toObject(),
        compositeScore
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }

  // === Search Users ===
  if (!filter || filter === 'accounts') {
    const userQuery = User.find({
      $or: [
        { username: regexQuery },
        { name: regexQuery },
        { bio: regexQuery }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    users = await userQuery;
  }

  // === Search Hashtags (explicit filter or if user types '#') ===
  if (filter === 'hashtags' || query.includes('#')) {
    const hashtags = cleanedQuery.split(',').map(tag => tag.trim());
    const hashtagPosts = await Post.find({
      hashtags: { $in: hashtags }
    }).sort({ createdAt: -1 }).limit(50);

    // Merge with main posts if not filtered strictly by hashtags
    if (filter === 'hashtags') {
      posts = hashtagPosts;
    } else {
      posts = [...posts, ...hashtagPosts];
    }
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

