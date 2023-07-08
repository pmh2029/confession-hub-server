const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Types.ObjectId,
      ref: "post",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    commentId: {
      type: mongoose.Types.ObjectId,
      ref: "comment",
    },
    actionType: {
      type: String,
      enum: ["upvote", "comment", "downvote", "reply"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    postNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("notification", NotificationSchema);
