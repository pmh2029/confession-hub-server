const mongoose = require("mongoose");

const Post = require("../models/Post");

const CategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: [String],
    },
  },
  { timestamps: true }
);

CategorySchema.pre("deleteOne", { document: true }, async function (next) {
  const categoryId = this._id;

  try {
    await Post.deleteMany({ category: categoryId });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("category", CategorySchema);
