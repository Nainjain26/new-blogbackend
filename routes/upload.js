const express = require("express");
const router = express.Router();
const { upload, cloudinary } = require("../lib/cloudinary");
const { verifyToken } = require("../middleware/auth");

// Upload single image
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
      });
    }

    // Get image edit parameters
    const { crop, brightness, contrast, saturation } = req.body;
    const transformations = [];

    // Apply crop if provided
    if (crop) {
      try {
        const cropData = JSON.parse(crop);
        transformations.push({
          crop: "crop",
          x: Math.round(cropData.x),
          y: Math.round(cropData.y),
          width: Math.round(cropData.width),
          height: Math.round(cropData.height),
        });
      } catch (error) {
        return res.status(400).json({
          message: "Invalid crop parameters",
        });
      }
    }

    // Apply other adjustments if provided
    if (brightness) {
      transformations.push({
        effect: `brightness:${brightness}`,
      });
    }

    if (contrast) {
      transformations.push({
        effect: `contrast:${contrast}`,
      });
    }

    if (saturation) {
      transformations.push({
        effect: `saturation:${saturation}`,
      });
    }

    // Upload to Cloudinary with transformations
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blog_images",
      transformation: transformations,
      resource_type: "image",
    });

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      message: "Error uploading image",
      details: error.message,
    });
  }
});

// Get image preview with transformations
router.post("/preview", verifyToken, async (req, res) => {
  try {
    const { url, crop, brightness, contrast, saturation } = req.body;

    if (!url) {
      return res.status(400).json({
        message: "Image URL is required",
        details: "Please provide an image URL",
      });
    }

    const transformations = [];

    if (crop) {
      transformations.push({
        crop: "crop",
        x: Math.round(crop.x),
        y: Math.round(crop.y),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
    }

    if (brightness) {
      transformations.push({
        effect: `brightness:${brightness}`,
      });
    }

    if (contrast) {
      transformations.push({
        effect: `contrast:${contrast}`,
      });
    }

    if (saturation) {
      transformations.push({
        effect: `saturation:${saturation}`,
      });
    }

    // Generate preview URL with transformations
    const previewUrl = cloudinary.url(url, {
      transformation: transformations,
      type: "fetch",
    });

    res.json({
      previewUrl,
      transformations,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      message: "Error generating preview",
      details: error.message,
    });
  }
});

// Delete uploaded image
router.delete("/:publicId", verifyToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "not found") {
      return res.status(404).json({
        message: "Image not found",
        details: "The requested image does not exist",
      });
    }

    res.json({
      message: "Image deleted successfully",
      result,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      message: "Error deleting image",
      details: error.message,
    });
  }
});

module.exports = router;
