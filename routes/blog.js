const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const { verifyToken, isAdmin, isAuthorOrAdmin } = require("../middleware/auth");
const { upload, cloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");

// Create a new blog post
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "section_images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        tags,
        category,
        featured,
        status,
        sections,
        meta,
        mainImageEdit,
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !description ||
        !category ||
        !meta ||
        !req.files.mainImage
      ) {
        return res.status(400).json({
          message: "Missing required fields",
          details: {
            title: !title ? "Title is required" : null,
            description: !description ? "Description is required" : null,
            category: !category ? "Category is required" : null,
            meta: !meta ? "Meta information is required" : null,
            mainImage: !req.files.mainImage ? "Main image is required" : null,
          },
        });
      }

      // Validate meta format
      let parsedMeta;
      try {
        parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;
        if (!parsedMeta.meta_title || !parsedMeta.meta_description) {
          return res.status(400).json({
            message: "Invalid meta format",
            details: "Meta must include meta_title and meta_description",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid meta format",
          details: "Meta must be a valid JSON object",
        });
      }

      // Validate category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Process main image with edits if provided
      let mainImageUrl = null;
      if (req.files.mainImage && req.files.mainImage[0]) {
        const mainImageEditState = mainImageEdit
          ? JSON.parse(mainImageEdit)
          : {};
        const transformations = [];

        if (mainImageEditState.crop) {
          transformations.push({
            crop: "crop",
            x: Math.round(mainImageEditState.crop.x),
            y: Math.round(mainImageEditState.crop.y),
            width: Math.round(mainImageEditState.crop.width),
            height: Math.round(mainImageEditState.crop.height),
          });
        }

        if (mainImageEditState.brightness) {
          transformations.push({
            effect: `brightness:${mainImageEditState.brightness}`,
          });
        }

        if (mainImageEditState.contrast) {
          transformations.push({
            effect: `contrast:${mainImageEditState.contrast}`,
          });
        }

        if (mainImageEditState.saturation) {
          transformations.push({
            effect: `saturation:${mainImageEditState.saturation}`,
          });
        }

        const result = await cloudinary.uploader.upload(
          req.files.mainImage[0].path,
          {
            folder: "blog_images",
            transformation: transformations,
            resource_type: "image",
          }
        );

        mainImageUrl = result.secure_url;
      }

      // Validate sections format
      let parsedSections;
      try {
        parsedSections = sections
          ? typeof sections === "string"
            ? JSON.parse(sections)
            : sections
          : [];
        if (!Array.isArray(parsedSections)) {
          return res.status(400).json({
            message: "Invalid sections format",
            details: "Sections must be an array",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid sections format",
          details: "Sections must be a valid JSON array",
        });
      }

      // Process sections with images
      const processedSections = await Promise.all(
        parsedSections.map(async (section, index) => {
          const sectionImage = req.files.section_images?.[index];
          if (!sectionImage && !section.section_img) {
            throw new Error(`Missing image for section ${index + 1}`);
          }

          let sectionImageUrl;
          if (sectionImage) {
            const result = await cloudinary.uploader.upload(sectionImage.path, {
              folder: "blog_images/sections",
              resource_type: "image",
            });
            sectionImageUrl = result.secure_url;
          } else {
            sectionImageUrl = section.section_img;
          }

          return {
            section_img: sectionImageUrl,
            section_title: section.section_title,
            section_description: section.section_description,
            section_list: section.section_list || [],
            order: index,
          };
        })
      );

      // Validate tags format
      let parsedTags;
      try {
        parsedTags = tags
          ? typeof tags === "string"
            ? JSON.parse(tags)
            : tags
          : [];
        if (!Array.isArray(parsedTags)) {
          return res.status(400).json({
            message: "Invalid tags format",
            details: "Tags must be an array",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid tags format",
          details: "Tags must be a valid JSON array",
        });
      }

      const blog = new Blog({
        title,
        description,
        tags: parsedTags,
        category,
        featured: featured === "true",
        status: status || "draft",
        mainImage: mainImageUrl,
        sections: processedSections,
        meta: {
          meta_title: parsedMeta.meta_title,
          meta_description: parsedMeta.meta_description,
          meta_keywords: parsedMeta.meta_keywords || [],
        },
        author: req.user.id,
      });

      await blog.save();
      res.status(201).json(blog);
    } catch (error) {
      console.error("Error creating blog:", error);
      res.status(500).json({
        message: "Error creating blog post",
        details: error.message,
      });
    }
  }
);

// Get all blog posts with category population
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blog posts" });
  }
});

// Get blog posts by category ID with pagination
router.get("/category/id/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID format",
        details: "Please provide a valid category ID",
      });
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        details: "The requested category does not exist",
      });
    }

    // Get total count for pagination
    const total = await Blog.countDocuments({
      category: categoryId,
      status: "published",
    });

    const blogs = await Blog.find({
      category: categoryId,
      status: "published",
    })
      .populate("author", "name email")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    res.status(500).json({
      message: "Error fetching blog posts by category",
      details: error.message,
    });
  }
});

// Get blog posts by category slug with pagination
router.get("/category/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate category exists by slug
    const category = await Category.findOne({ slug, status: "published" });
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        details: "The requested category does not exist",
      });
    }

    // Get total count for pagination
    const total = await Blog.countDocuments({
      category: category._id,
      status: "published",
    });

    const blogs = await Blog.find({
      category: category._id,
      status: "published",
    })
      .populate("author", "name email")
      .populate("category", "name slug description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        blogCount: total,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs by category slug:", error);
    res.status(500).json({
      message: "Error fetching blog posts by category",
      details: error.message,
    });
  }
});

// Get blog post by slug with category population
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "name email")
      .populate("category", "name slug");
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Error fetching blog post" });
  }
});

// Update blog post
router.put(
  "/:id",
  verifyToken,
  isAuthorOrAdmin,
  upload.array("section_images", 10),
  async (req, res) => {
    try {
      const {
        title,
        description,
        tags,
        category,
        featured,
        status,
        sections,
        meta,
      } = req.body;

      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Validate category if it's being updated
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Invalid category ID" });
        }
      }

      // Process sections with images
      const processedSections = sections
        ? JSON.parse(sections).map((section, index) => {
            const sectionImage = req.files?.[index];
            return {
              section_img: sectionImage
                ? sectionImage.path
                : section.section_img,
              section_title: section.section_title,
              section_description: section.section_description,
              section_list: section.section_list || [],
              order: index,
            };
          })
        : blog.sections;

      blog.title = title || blog.title;
      blog.description = description || blog.description;
      blog.tags = JSON.parse(tags || JSON.stringify(blog.tags));
      blog.category = category || blog.category;
      blog.featured = featured === "true";
      blog.status = status || blog.status;
      blog.sections = processedSections;
      blog.meta = {
        meta_title: meta.meta_title || blog.meta.meta_title,
        meta_description: meta.meta_description || blog.meta.meta_description,
        meta_keywords: JSON.parse(
          meta.meta_keywords || JSON.stringify(blog.meta.meta_keywords)
        ),
      };

      await blog.save();
      res.json(blog);
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({ message: "Error updating blog post" });
    }
  }
);

// Delete blog post
router.delete("/:id", verifyToken, isAuthorOrAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Delete images from Cloudinary
    const { cloudinary } = require("../config/cloudinary");
    for (const section of blog.sections) {
      if (section.section_img) {
        const publicId = section.section_img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await blog.deleteOne();
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog post" });
  }
});

module.exports = router;
