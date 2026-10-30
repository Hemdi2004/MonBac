const express = require("express");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Protected admin dashboard route
router.get("/admin", requireAdmin, (req, res, next) => {
  try {
    // Explicitly pass the user context from the session to the template engine
    res.render("admin/admin", { user: req.session.user });
  } catch (error) {
    // Pass view rendering errors safely to your global Express error-handling middleware
    next(error);
  }
});

module.exports = router;
