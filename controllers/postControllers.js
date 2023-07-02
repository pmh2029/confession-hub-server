const mongoose = require("mongoose");

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const PostUpvote = require("../models/PostUpvote");
const PostDownvote = require("../models/PostDownvote");
const PostReport = require("../models/PostReport");
const Category = require("../models/Category");
const paginate = require("../utils/paginate");
const convertContent = require("../utils/convert");

const createPost = async (req, res) => {
  try {
    const { title, category, content, userId } = req.body;
    if (!(title && category && content)) {
      throw new Error("All input required");
    }

    const categoryInDb = await Category.findOne({ categoryName: category });
    if (!categoryInDb) {
      throw new Error("Category does not exist");
    }

    const contentConverted = await convertContent(content);
    const post = await Post.create({
      title,
      category: categoryInDb._id,
      content: contentConverted,
      poster: userId,
    });
    return res.status(201).json(post);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Post does not exist");
    }
    const post = await Post.findById(postId)
      .populate("poster", "-password")
      .populate("category")
      .lean();
    if (!post) {
      throw new Error("Post does not exist");
    }
    if (userId) {
      await setUpvoted([post], userId);
      await setReported([post], userId);
      await setDownvoted([post], userId);
    }
    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, category, content, userId, isAdmin } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to update post");
    }

    const categoryInDb = await Category.findOne({ categoryName: category });
    if (!categoryInDb) {
      throw new Error("Category does not exist");
    }
    const contentConverted = await convertContent(content);

    post.title = title;
    post.category = categoryInDb._id;
    post.content = contentConverted;
    post.edited = true;
    post.editedAt = new Date();
    await post.save();
    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, isAdmin } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to delete post");
    }
    await post.deleteOne();
    await Comment.deleteMany({ post: post._id });
    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getUserUpvotedPosts = async (req, res) => {
  try {
    const upvoterId = req.params.id;
    const { userId } = req.body;
    let { page, sortBy } = req.query;
    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;
    let posts = await PostUpvote.find({ userId: upvoterId })
      .sort(sortBy)
      .populate({ path: "postId", populate: { path: "poster" } })
      .lean();
    posts = paginate(posts, 10, page);
    const count = posts.length;
    let responsePosts = [];
    posts.forEach((post) => {
      responsePosts.push(post.postId);
    });
    if (userId) {
      await setUpvoted(responsePosts, userId);
    }
    return res.json({ data: responsePosts, count });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { userId } = req.body;
    let { page, sortBy, author, search } = req.query;
    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;
    let posts = await Post.find()
      .populate("poster", "-password")
      .populate("category")
      .sort(sortBy)
      .lean();
    if (author) {
      posts = posts.filter((post) => post.poster.username == author);
    }
    if (search) {
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sortBy === "trending") {
      posts.forEach((post) => {
        post.score = calculateScore(post);
      });
      posts.sort((a, b) => b.score - a.score);
    }
    const count = posts.length;
    posts = paginate(posts, 10, page);
    if (userId) {
      await setUpvoted(posts, userId);
      await setDownvoted(posts, userId);
      await setReported(posts, userId);
    }
    return res.json({ data: posts, count });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const upvotePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostUpvote = await PostUpvote.findOne({ postId, userId });
    if (existingPostUpvote) {
      throw new Error("Post is already liked");
    }
    await PostUpvote.create({
      postId,
      userId,
    });
    post.upvoteCount = (await PostUpvote.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unUpvotePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostUpvote = await PostUpvote.findOne({ postId, userId });
    if (!existingPostUpvote) {
      throw new Error("Post is already not liked");
    }
    await existingPostUpvote.deleteOne();
    post.upvoteCount = (await PostUpvote.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const downvotePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostDownvote = await PostDownvote.findOne({ postId, userId });
    if (existingPostDownvote) {
      throw new Error("Post is already liked");
    }
    await PostDownvote.create({
      postId,
      userId,
    });
    post.downvoteCount = (await PostDownvote.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unDownvotePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostDownvote = await PostDownvote.findOne({ postId, userId });
    if (!existingPostDownvote) {
      throw new Error("Post is already not liked");
    }
    await existingPostDownvote.deleteOne();
    post.downvoteCount = (await PostDownvote.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const reportPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostReport = await PostReport.findOne({ postId, userId });
    if (existingPostReport) {
      throw new Error("Post is already reported");
    }
    await PostReport.create({
      postId,
      userId,
    });
    post.reportCount = (await PostReport.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unReportPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post does not exist");
    }
    const existingPostReport = await PostReport.findOne({ postId, userId });
    if (!existingPostReport) {
      throw new Error("Post is already not reported");
    }
    await existingPostReport.deleteOne();
    post.reportCount = (await PostReport.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getPostByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { userId } = req.body;
    console.log(categoryId);
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category does not exist");
    }

    const posts = await Post.find({ category: categoryId })
      .populate("poster", "-password")
      .populate("category")
      .lean();
    if (userId) {
      await setUpvoted(posts, userId);
      await setDownvoted(posts, userId);
      await setReported(posts, userId);
    }
    return res.json({ posts, count: posts.length });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const setUpvoted = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };
  const userPostUpvotes = await PostUpvote.find(searchCondition); //userId needed
  posts.forEach((post) => {
    userPostUpvotes.forEach((userPostUpvote) => {
      if (userPostUpvote.postId.equals(post._id)) {
        post.upvoted = true;
        return;
      }
    });
  });
};

const setDownvoted = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };
  const userPostDownvotes = await PostDownvote.find(searchCondition); //userId needed
  posts.forEach((post) => {
    userPostDownvotes.forEach((userPostDownvote) => {
      if (userPostDownvote.postId.equals(post._id)) {
        post.downvoted = true;
        return;
      }
    });
  });
};

const setReported = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };
  const userPostReports = await PostReport.find(searchCondition); //userId needed
  posts.forEach((post) => {
    userPostReports.forEach((userPortReport) => {
      if (userPortReport.postId.equals(post._id)) {
        post.reported = true;
        return;
      }
    });
  });
};

const calculateScore = (post) => {
  const { upvoteCount, downvoteCount, createdAt } = post;
  const releaseDate = new Date("4/5/2023 00:00:00Z").getTime();
  const seconds = (new Date(createdAt).getTime() - releaseDate) / 1000;
  const s = Math.sign(upvoteCount - downvoteCount);
  const n = Math.max(1, Math.abs(s));
  const score = Math.log10(n) + (s * seconds) / 43200;
  return score;
};

module.exports = {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getUserUpvotedPosts,
  getAllPosts,
  upvotePost,
  unUpvotePost,
  downvotePost,
  unDownvotePost,
  reportPost,
  unReportPost,
  getPostByCategory,
};
