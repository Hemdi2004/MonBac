const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /admin/assign
 * @desc    Render the administrative assignment control panel
 * @access  Private (Admin Only)
 */
router.get("/admin/assign", requireAdmin, async (req, res, next) => {
  try {
    // Execute database queries concurrently to optimize performance
    const [studentsPromise, groupsPromise] = await Promise.all([
      pool.query("SELECT * FROM community_requests WHERE status = 'accepted' ORDER BY created_at DESC"),
      pool.query("SELECT * FROM community_groups ORDER BY level, type, name")
    ]);

    const students = studentsPromise[0];
    const groups = groupsPromise[0];

    res.render("admin/assign", { students, groups });
  } catch (error) {
    console.error("Database fetch failed on GET /admin/assign:", error);
    next(error); // Forward error to central Express error handler
  }
});

/**
 * @route   POST /admin/assign
 * @desc    Assign a validated student profile to an active community group
 * @access  Private (Admin Only)
 */
router.post("/admin/assign", requireAdmin, async (req, res, next) => {
  const { student_id, group_id } = req.body;

  // Fail-fast validation check
  if (!student_id || !group_id) {
    return res.status(400).send("Bad Request: Missing student_id or group_id.");
  }

  try {
    // Inject parameters via safe parameterized binding array
    await pool.query(
      "INSERT INTO community_members (student_id, group_id) VALUES (?, ?)",
      [student_id, group_id]
    );

    res.redirect("/admin/assign");
  } catch (error) {
    console.error(`Assignment transaction failed for Student: ${student_id}, Group: ${group_id}:`, error);
    
    // Graceful recovery for duplicate entries instead of standard 500 crash
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send("Conflict: Student is already assigned to this group.");
    }
    
    next(error);
  }
});

module.exports = router;
