const express = require("express");
const { verifyToken, isAdmin } = require("../middleware/auth");
const router = express.Router();

// Admin dashboard route
router.get("/", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard", user: req.user });
});

module.exports = router;
