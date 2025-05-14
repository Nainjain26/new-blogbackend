const mongoose = require("mongoose");
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    mainImage: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    sections: [
      {
        section_img: {
          type: String,
          required: true,
        },
        section_title: {
          type: String,
          required: true,
          trim: true,
        },
        section_description: {
          type: String,
          required: true,
        },
        section_list: [
          {
            type: String,
            trim: true,
          },
        ],
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    meta: {
      meta_title: {
        type: String,
        required: true,
        trim: true,
      },
      meta_description: {
        type: String,
        required: true,
      },
      meta_keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);
// Generate slug before saving
blogSchema.pre("save", function (next) {
  if (!this.isModified("title")) return next();

  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  next();
});

module.exports = mongoose.model("Blog", blogSchema);
