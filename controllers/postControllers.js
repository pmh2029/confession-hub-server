const mongoose = require("mongoose");

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const PostUpvote = require("../models/PostUpvote");
const PostDownvote = require("../models/PostDownvote");
const PostReport = require("../models/PostReport");
const Category = require("../models/Category");
const convertContent = require("../utils/convert");

const cooldown = new Set();

const createPost = async (req, res) => {
  try {
    const { title, category, content, userId } = req.body;
    if (!(title && category && content)) {
      throw new Error("All input required");
    }
    if (cooldown.has(userId)) {
      throw new Error(
        "You are posting too frequently. Please try again shortly."
      );
    }
    cooldown.add(userId);
    setTimeout(() => {
      cooldown.delete(userId);
    }, 60000);

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
    res.status(201).json(post);
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
      .lean();
    if (!post) {
      throw new Error("Post does not exist");
    }
    if (userId) {
      await setLiked([post], userId);
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
    await post.remove();
    await Comment.deleteMany({ post: post._id });
    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getUserUpvotedPosts = async (req, res) => {
  try {
    const upvoteId = req.params.id;
    const { userId } = req.body;
    let { page, sortBy } = req.query;
    if (!sortBy) sortBy = "-createdAt";
    if (!page) page = 1;
    let posts = await PostUpvote.find({ userId: upvoteId })
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
      await setLiked(posts, userId);
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
    await existingPostUpvote.remove();
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
    await existingPostDownvote.remove();
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
    await existingPostReport.remove();
    post.reportCount = (await PostReport.find({ postId })).length;
    await post.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const setUpvoted = async (posts, userId) => {
  let searchCondition = {};
  if (userId) searchCondition = { userId };
  const userPostUpvotes = await PostLike.find(searchCondition); //userId needed
  posts.forEach((post) => {
    userPostUpvotes.forEach((userPostUpvote) => {
      if (userPostUpvote.postId.equals(post._id)) {
        post.upvoted = true;
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
};
