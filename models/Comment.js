const mongoose = require("mongoose");
const Post = require("./Post");
const filter = require("../utils/filter");

const CommentSchema = new mongoose.Schema(
  {
    commenter: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    post: {
      type: mongoose.Types.ObjectId,
      ref: "post",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Types.ObjectId,
      ref: "comment",
    },
    children: [
      {
        type: mongoose.Types.ObjectId,
        ref: "comment",
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

CommentSchema.pre("deleteOne", { document: true }, async function (next) {
  const postIDs = await this.model("comment").distinct("post", { commenter: this.commenter });
  for (const postID of postIDs) {
    const commentCount = await this.model("comment").countDocuments({
      post: postID,
      commenter: this.commenter,
    });
    await Post.findByIdAndUpdate(postID, {
      $inc: { commentCount: -commentCount },
    });
  }

  const comments = await this.model("comment").find({ parent: this._id });

  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    await comment.deleteOne();
  }
  next();
});

CommentSchema.pre("save", function (next) {
  if (this.content.length > 0) {
    this.content = filter.clean(this.content);
  }

  next();
});

// const Comment = mongoose.model("comment", CommentSchema);

// module.exports = Comment;

module.exports = mongoose.model("comment", CommentSchema);
