const mongoose = require("mongoose");
const PostReport = require("./PostReport");
const filter = require("../utils/filter");
const PostUpvote = require("./PostUpvote");
const PostDownvote = require("./PostDownvote");

const PostSchema = new mongoose.Schema(
  {
    postNumber: {
      type: Number,
    },
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

PostSchema.pre("save", async function (next) {
  if (!this.postNumber) {
    this.postNumber = await getNextPostOrder();
  }

  if (this.title.length > 0) {
    this.title = filter.clean(this.title);
  }

  if (this.content.length > 0) {
    this.content = filter.clean(this.content);
  }

  next();
});

async function getNextPostOrder() {
  const lastPost = await mongoose.model("post")
    .findOne({}, {}, { sort: { postNumber: -1 } })
    .lean();

  if (lastPost) {
    return lastPost.postNumber + 1;
  } else {
    return 1;
  }
}

PostSchema.pre("remove", async function (next) {
  await PostUpvote.deleteMany({ postId: this._id });
  await PostReport.deleteMany({ postId: this._id });
  await PostDownvote.deleteMany({ postId: this._id });
  next();
});

module.exports = mongoose.model("post", PostSchema);
