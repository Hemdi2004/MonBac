const express = require("express");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/admin", requireAdmin, (req, res) => {
  res.render("admin/admin", { user: req.session.user });
});

module.exports = router;
