const Category = require("../models/Category");

const getAllCategories = async (_req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    if (!categoryName) {
      throw new Error("Input required");
    }

    const categoryInDb = await Category.findOne({ categoryName: categoryName });
    if (categoryInDb) {
      throw new Error("Category already exists");
    }

    const category = await Category.create({
      categoryName,
    });

    return res.status(201).json(category);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { categoryName } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.categoryName = categoryName;
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
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
