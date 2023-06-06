const mongoose = require("mongoose");
const PostLike = require("./PostUpvote");
const PostReport = require("./PostReport");
const filter = require("../utils/filter");

const PostSchema = new mongoose.Schema(
  {
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    upvoteCount: {
      type: Number,
      default: 0,
    },
    downvoteCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    edited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

PostSchema.pre("save", function (next) {
  if (this.title.length > 0) {
    this.title = filter.clean(this.title);
  }

  if (this.content.length > 0) {
    this.content = filter.clean(this.content);
  }

  next();
});

PostSchema.pre("remove", async function (next) {
  await PostLike.deleteMany({ postId: this._id });
  await PostReport.deleteMany({ postId: this._id });
  next();
});

module.exports = mongoose.model("post", PostSchema);
