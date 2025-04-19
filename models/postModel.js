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
      ],
    hashtags: [{ type: String }]
  },
  {
    timestamps: true // Automatically adds createdAt & updatedAt
  }
);

postSchema.index({
  'likes.userId': 1,
  'comments.userId': 1,
  'comments.replies.userId': 1,
  user: 1,
  hashtags: 1,
  createdAt: -1,
  text: "text"
});

postSchema.pre('save', function (next) {
  if (!this.hashtags) this.hashtags = [];

  const regex = /#\w+/g;
  const matches = this.text?.match(regex) || [];

  const cleaned = matches.map(tag => tag.toLowerCase().replace(/^#/, '')); // remove #
  this.hashtags = [...new Set([...this.hashtags, ...cleaned])]; // avoid duplicates

  next();
});


const Post = mongoose.model('Post', postSchema);

module.exports = Post;
