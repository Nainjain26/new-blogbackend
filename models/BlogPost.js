const mongoose = require("mongoose");
const slugify = require("slugify");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A blog post must have a title"],
      trim: true,
      maxlength: [
        100,
        "A blog post title must have less or equal than 100 characters",
      ],
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "A blog post must have content"],
    },
    summary: {
      type: String,
      required: [true, "A blog post must have a summary"],
      trim: true,
      maxlength: [
        200,
        "A blog post summary must have less or equal than 200 characters",
      ],
    },
    coverImage: {
      type: String,
      required: [true, "A blog post must have a cover image"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A blog post must belong to an author"],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "A blog post must belong to a category"],
    },
    tags: [String],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create slug from title before saving
blogPostSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
  });

  next();
});

// Virtual populate for comments
blogPostSchema.virtual("commentsCount", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
  count: true,
});

// Index for better search performance
blogPostSchema.index({ title: "text", content: "text" });

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = BlogPost;
