const Post = require('./../models/postModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const applyQuery = require('../utils/applyQuery');


exports.createPost = catchAsync(async (req, res, next) => {
    req.body.user = req.user._id;
  
    // Create the post and save it to the database
    const post = await Post.create(req.body);
  
    res.status(201).json({
      status: 'success',
      data: {
        data: post,
      },
    });
});
  

exports.likePost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // If the user has already liked the post then unlike post
  const alreadyLiked = post.likes.some(
    (like) => like.userId.toString() === userId.toString(),
  );

  let message = '';

  if (alreadyLiked) {
    post.likes = post.likes.filter((like) => {
      const id = like.userId._id || like.userId;
      return id.toString() !== userId.toString();
    });
    message = 'Post unliked';
  } else {
    post.likes.push({ userId });
    message = 'Post liked';
  }

  await post.save();

  res.status(200).json({
    status: 'success',
    message,
    data: {
      likes: post.likes.length,
    },
  });
});

// Comment on a post
exports.commentOnPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Add comment to post
  post.comments.push({ userId, content });
  await post.save();

  res.status(201).json({
    status: 'success',
    data: {
      comment: post.comments[post.comments.length - 1],
    },
  });
});

// Reply to a comment
exports.replyToComment = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const commentId = req.params.commentId;
  const { content } = req.body;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  // Add reply to the comment
  comment.replies.push({ userId, content });
  await post.save();

  res.status(201).json({
    status: 'success',
    data: {
      reply: comment.replies[comment.replies.length - 1],
    },
  });
});

// Share a post
exports.sharePost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError('Post not found', 404));
  }

  // Add user to shares array
  post.shares.push({ userId });
  await post.save();

  res.status(200).json({
    status: 'success',
    data: {
      shares: post.shares.length,
    },
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const post = await Post.findById(postId);

  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: post,
    },
  });
});

exports.getAllPosts = catchAsync(async (req, res, next) => {
  const posts = await applyQuery(req.query);


  res.status(200).json({
    status: 'success',
    results: posts.length,
    data: {
      data: posts
    }
  })
})

exports.getPostsByUser = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;
  
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  
    // Base query: all posts from this user
    let query = Post.find({ user: userId });

    const posts = await applyQuery(req.query);
  
    if (!posts.length) {
      return next(new AppError('No posts found by this user', 404));
    }
  
    res.status(200).json({
      status: 'success',
      results: posts.length,
      data: {
        data: posts,
      },
    });
});

exports.getFollowingPosts = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  console.log(user)
  console.log('💥 Following:', user.following);

   if (!Array.isArray(user.following)) {
    return next(new AppError('Invalid following list', 400));
  }

  let query = Post.find({ user: { $in: user.following } });

  const posts = await applyQuery(query, req.query);

  if (!posts.length) {
    return next(new AppError('No posts found by users that are followed', 404));
  }

  res.status(200).json({
    status: 'success',
    results: posts.length,
    data: {
      data: posts,
    },
  });
});
  

exports.updatePost = catchAsync(async (req, res, next) => {
  const post = await Post.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, // only allow editing own post
    req.body,
    { new: true, runValidators: true },
  );

  if (!post) {
    return next(new AppError('Post not found or unauthorized', 404));
  }

  res.status(200).json({
    status: 'success',
    data: post,
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!post) {
    return next(new AppError('Post not found or unauthorized', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.followUser = catchAsync(async (req, res, next) => {
//   const targetUser = await User.findById(req.params.id);
//   const currentUser = req.user;

//   if (!targetUser) return next(new AppError('User not found', 404));

//   if (targetUser._id.equals(currentUser._id)) {
//     return next(new AppError('You cannot follow yourself', 400));
//   }

//   if (!targetUser.followers.includes(currentUser._id)) {
//     targetUser.followers.push(currentUser._id);
//     await targetUser.save();

//     currentUser.following.push(targetUser._id);
//     await currentUser.save();
//   }

//   res.status(200).json({ status: 'success', message: 'Followed user' });
// });

// exports.unfollowUser = catchAsync(async (req, res, next) => {
//   const targetUser = await User.findById(req.params.id);
//   const currentUser = req.user;

//   if (!targetUser) return next(new AppError('User not found', 404));

//   targetUser.followers = targetUser.followers.filter(
//     (id) => !id.equals(currentUser._id),
//   );
//   await targetUser.save();

//   currentUser.following = currentUser.following.filter(
//     (id) => !id.equals(targetUser._id),
//   );
//   await currentUser.save();

//   res.status(200).json({ status: 'success', message: 'Unfollowed user' });
// });

exports.followUserFromPost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.postId).populate('user');
  
    if (!post) return next(new AppError('Post not found', 404));
  
    const targetUser = post.user;
    const currentUser = req.user;
  
    if (targetUser._id.equals(currentUser._id)) {
      return next(new AppError('You cannot follow yourself', 400));
    }
  
    if (!targetUser.followers.includes(currentUser._id)) {
      targetUser.followers.push(currentUser._id);
      await targetUser.save();
  
      currentUser.following.push(targetUser._id);
      await currentUser.save();
    }
  
    res.status(200).json({
      status: 'success',
      message: `You are now following ${targetUser.username} (author of the post)`,
    });
});

exports.unfollowUserFromPost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.postId).populate('user')
  
    if (!post) return next(new AppError('Post not found', 404));
  
    const targetUser = post.user;
    const currentUser = req.user;
  
    if (targetUser._id.equals(currentUser._id)) {
      return next(new AppError('You cannot unfollow yourself', 400));
    }
  
    // Only proceed if the user is actually following the target
    if (targetUser.followers.includes(currentUser._id)) {
      // Remove currentUser from targetUser's followers
      targetUser.followers = targetUser.followers.filter(
        (followerId) => !followerId.equals(currentUser._id)
      );
      await targetUser.save();
  
      // Remove targetUser from currentUser's following
      currentUser.following = currentUser.following.filter(
        (followingId) => !followingId.equals(targetUser._id)
      );
      await currentUser.save();
    }
  
    res.status(200).json({
      status: 'success',
      message: `You have unfollowed ${targetUser.username} (author of the post)`,
    });
});


// exports.createPost = catchAsync(async (req, res, next) => {
//   // Attach the user ID from the authenticated user (req.user._id)
//   req.body.user = req.user._id;

//   // Create the post with text (no media at this point)
//   const post = await Post.create(req.body);

//   // Check if media URL and type are provided in the request body
//   if (req.body.mediaUrl && req.body.mediaType) {
//     // Validate media type
//     if (!['image', 'video'].includes(req.body.mediaType)) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Invalid media type. It must be either "image" or "video".'
//       });
//     }

//     // Add the media to the newly created post
//     post.media.push({
//       url: req.body.mediaUrl,
//       type: req.body.mediaType,
//     });

//     // Save the post with the new media
//     await post.save();

//     // Emit a Socket.IO event to notify the user that media was added to their post
//     io.to(req.user._id).emit('uploadComplete', {
//       postId: post._id,
//       mediaUrl: req.body.mediaUrl,
//       mediaType: req.body.mediaType,
//       message: 'Your media has been successfully added to your post!',
//     });
//   }

//   // Respond with the created post
//   res.status(201).json({
//     status: 'success',
//     data: {
//       data: post,
//     },
//   });
// });

  
  
  
