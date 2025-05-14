const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    blogCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
categorySchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();

  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  next();
});

// Update blogCount when blogs are added or removed
categorySchema.statics.updateBlogCount = async function (categoryId) {
  const Blog = mongoose.model("Blog");
  const count = await Blog.countDocuments({ category: categoryId });
  await this.findByIdAndUpdate(categoryId, { blogCount: count });
};

module.exports = mongoose.model("Category", categorySchema);
