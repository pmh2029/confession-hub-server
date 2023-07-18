const Category = require("../models/Category");
const Post = require("../models/Post");

const getCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find();

    const categoriesWithPostCount = await Promise.all(
      categories.map(async (category) => {
        const postCount = await Post.countDocuments({ category: category._id });
        return { ...category.toJSON(), postCount };
      })
    );

    return res.status(200).json(categoriesWithPostCount);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { categoryName, url } = req.body;

    if (!categoryName || !url) {
      throw new Error("Input required");
    }

    const categoryInDb = await Category.findOne({ categoryName: categoryName });
    if (categoryInDb) {
      throw new Error("Category already exists");
    }

    const category = await Category.create({
      categoryName,
      url,
    });

    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName, url } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (categoryName) {
      category.categoryName = categoryName;
    }
    if (url) {
      category.url = url;
    }
    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.deleteOne();
    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCategory,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
