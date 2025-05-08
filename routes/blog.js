const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const { verifyToken, isAdmin, isAuthorOrAdmin } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Create a new blog post
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([{ name: "section_images", maxCount: 10 }]),
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

      // Validate required fields
      if (!title || !description || !category || !meta) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Process sections with images
      const processedSections = sections.map((section, index) => {
        const sectionImage = req.files.section_images?.[index];
        return {
          section_img: sectionImage ? sectionImage.path : "",
          section_title: section.section_title,
          section_description: section.section_description,
          section_list: section.section_list || [],
          order: index,
        };
      });

      const blog = new Blog({
        title,
        description,
        tags: JSON.parse(tags || "[]"),
        category,
        featured: featured === "true",
        status: status || "draft",
        sections: processedSections,
        meta: {
          meta_title: meta.meta_title,
          meta_description: meta.meta_description,
          meta_keywords: JSON.parse(meta.meta_keywords || "[]"),
        },
        author: req.user.id,
      });

      await blog.save();
      res.status(201).json(blog);
    } catch (error) {
      console.error("Error creating blog:", error);
      res.status(500).json({ message: "Error creating blog post" });
    }
  }
);

// Get all blog posts
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blog posts" });
  }
});

// Get blog post by slug
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate(
      "author",
      "name email"
    );
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
  upload.fields([{ name: "section_images", maxCount: 10 }]),
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

      // Process sections with images
      const processedSections = sections.map((section, index) => {
        const sectionImage = req.files.section_images?.[index];
        return {
          section_img: sectionImage ? sectionImage.path : section.section_img,
          section_title: section.section_title,
          section_description: section.section_description,
          section_list: section.section_list || [],
          order: index,
        };
      });

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

    await blog.deleteOne();
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog post" });
  }
});

module.exports = router;
