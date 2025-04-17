const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A post must have a userId']
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    media: [
        {
          url: {
            type: String,
            required: [true, 'Media URL is required'],
          },
          type: {
            type: String,
            enum: {
              values: ['image', 'video'],
              message: 'Media type must be either image or video',
            },
            required: [true, 'Media type is required'],
          }
        }
    ],
    likes: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        },
      ],
    comments: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          replies: [
            {
              userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
              content: { type: String, required: true },
              createdAt: { type: Date, default: Date.now },
            },
          ],
        },
      ],
    shares: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ]
  },
  {
    timestamps: true // Automatically adds createdAt & updatedAt
  }
);

postSchema.index({ 'likes.userId': 1 });
postSchema.index({ 'comments.userId': 1 });
postSchema.index({ 'comments.replies.userId': 1 });


const Post = mongoose.model('Post', postSchema);

module.exports = Post;
