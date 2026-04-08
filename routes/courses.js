const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin list courses
router.get("/admin/courses", requireAdmin, async (req, res) => {
  const [courses] = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
  res.render("admin/courses", { courses });
});

// Admin create form
router.get("/admin/courses/new", requireAdmin, (req, res) => {
  res.render("admin/course_new");
});

// Create course
router.post("/admin/courses", requireAdmin, async (req, res) => {
  const { title, description, level } = req.body;
  const slug = title.toLowerCase().replace(/\s+/g, "-");

  await pool.query(
    "INSERT INTO courses (title, description, slug, level) VALUES (?, ?, ?, ?)",
    [title, description, slug, level]
  );

  res.redirect("/admin/courses");
});

// Delete course
// router.post("/admin/courses/:id/delete", requireAdmin, async (req, res) => {
//   await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
//   res.redirect("/admin/courses");
// });

router.post("/admin/courses/:courseId/delete", requireAdmin, async (req, res) => {
  const courseId = req.params.courseId;

  // Safety: prevent deleting courses that still have chapters
  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM chapters WHERE course_id = ?",
    [courseId]
  );

  if (row.cnt > 0) {
    // You can render error instead of sending plain text
    return res.status(400).send("Cannot delete: course has chapters. Delete chapters first.");
  }

  await pool.query("DELETE FROM courses WHERE id = ?", [courseId]);
  res.redirect("/admin/courses");
});


// edit course
router.get("/admin/courses/:courseId/edit", requireAdmin, async (req, res) => {
  const courseId = req.params.courseId;

  const [[course]] = await pool.query(
    "SELECT * FROM courses WHERE id = ?",
    [courseId]
  );
  if (!course) return res.status(404).send("Course not found");

  res.render("admin/course_edit", { course, error: null });
});

// update course
router.post("/admin/courses/:courseId/edit", requireAdmin, async (req, res) => {
  const courseId = req.params.courseId;
  const { title, slug, description, level } = req.body;

  await pool.query(
    `UPDATE courses
     SET title = ?, slug = ?, description = ?, level = ?
     WHERE id = ?`,
    [title, slug, description || null, level, courseId]
  );

  res.redirect("/admin/courses");
});
// publish / unpublish course

router.post("/admin/courses/:id/toggle", requireAdmin, async (req, res) => {
  const courseId = req.params.id;
  await pool.query(
    "UPDATE courses SET is_published = NOT is_published WHERE id = ?",
    [courseId]
  );
  res.redirect("/admin/courses");
});

module.exports = router;

//publish / unpublish course


