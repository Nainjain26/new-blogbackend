const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  // Check if category with same name exists
  const existingCategory = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (existingCategory) {
    res.status(400);
    throw new Error("Category with this name already exists");
  }

  const category = await Category.create({
    name,
    description,
    status: status || "published",
    blogCount: 0,
  });

  res.status(201).json(category);
});

// Get all categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: "published" })
    .sort({ name: 1 })
    .select("_id name slug description blogCount status");
  res.status(200).json(categories);
});

// Get single category
const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Get blog count for this category
  const blogCount = await mongoose
    .model("Blog")
    .countDocuments({ category: id, status: "published" });

  res.status(200).json({
    ...category.toObject(),
    blogCount,
  });
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // If name is being updated, check for duplicates
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      _id: { $ne: id },
    });
    if (existingCategory) {
      res.status(400);
      throw new Error("Category with this name already exists");
    }
  }

  category.name = name || category.name;
  category.description = description || category.description;
  category.status = status || category.status;

  const updatedCategory = await category.save();
  res.status(200).json(updatedCategory);
});

// Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid category ID format");
  }

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if category has any blogs
  const blogCount = await mongoose
    .model("Blog")
    .countDocuments({ category: id });
  if (blogCount > 0) {
    res.status(400);
    throw new Error("Cannot delete category with existing blog posts");
  }

  await category.deleteOne();
  res.status(200).json({ message: "Category deleted successfully" });
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
