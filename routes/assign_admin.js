const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Assignment page
router.get("/admin/assign", requireAdmin, async (req, res) => {
  const [students] = await pool.query(
    "SELECT * FROM community_requests WHERE status='accepted' ORDER BY created_at DESC"
  );

  const [groups] = await pool.query(
    "SELECT * FROM community_groups ORDER BY level, type, name"
  );

  res.render("admin/assign", { students, groups });
});

// Assign student to group
router.post("/admin/assign", requireAdmin, async (req, res) => {
  const { student_id, group_id } = req.body;

  await pool.query(
    "INSERT INTO community_members (student_id, group_id) VALUES (?, ?)",
    [student_id, group_id]
  );

  res.redirect("/admin/assign");
});

module.exports = router;
