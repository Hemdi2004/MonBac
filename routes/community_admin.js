const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// View requests
router.get("/admin/community", requireAdmin, async (req, res) => {
  const [requests] = await pool.query(
    "SELECT * FROM community_requests ORDER BY created_at DESC"
  );

  res.render("admin/community", { requests });
});

// Accept
router.get("/admin/community/accept/:id", requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE community_requests SET status='accepted' WHERE id=?",
    [req.params.id]
  );
  res.redirect("/admin/community");
});

// Reject
router.get("/admin/community/reject/:id", requireAdmin, async (req, res) => {
  await pool.query(
    "UPDATE community_requests SET status='rejected' WHERE id=?",
    [req.params.id]
  );
  res.redirect("/admin/community");
});

module.exports = router;
