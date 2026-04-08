const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin: list chapters for a course
router.get("/admin/courses/:courseId/chapters", requireAdmin, async (req, res) => {
  const courseId = req.params.courseId;

  const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
  if (!course) return res.status(404).send("Course not found");

  const [chapters] = await pool.query(
    "SELECT * FROM chapters WHERE course_id = ? ORDER BY position ASC, created_at ASC",
    [courseId]
  );

  res.render("admin/chapters", { course, chapters, error: null });
});

// Admin: create chapter
router.post("/admin/courses/:courseId/chapters", requireAdmin, async (req, res) => {
  const courseId = req.params.courseId;
  const { title, position } = req.body;

  if (!title) {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    const [chapters] = await pool.query(
      "SELECT * FROM chapters WHERE course_id = ? ORDER BY position ASC, created_at ASC",
      [courseId]
    );
    return res.render("admin/chapters", { course, chapters, error: "Title is required." });
  }

  const pos = Number.isFinite(Number(position)) ? Number(position) : 0;

  await pool.query(
    "INSERT INTO chapters (course_id, title, position) VALUES (?, ?, ?)",
    [courseId, title, pos]
  );

  res.redirect(`/admin/courses/${courseId}/chapters`);
});

// Admin: delete chapter
router.post("/admin/chapters/:id/delete", requireAdmin, async (req, res) => {
  const chapterId = req.params.id;

  const [[ch]] = await pool.query("SELECT course_id FROM chapters WHERE id = ?", [chapterId]);
  if (!ch) return res.status(404).send("Chapter not found");

  await pool.query("DELETE FROM chapters WHERE id = ?", [chapterId]);

  res.redirect(`/admin/courses/${ch.course_id}/chapters`);
});

// SHOW EDIT CHAPTER FORM
router.get("/admin/chapters/:id/edit", requireAdmin, async (req, res) => {
  const chapterId = req.params.id;

  const [[chapter]] = await pool.query(
    `SELECT ch.*, c.id AS course_id, c.title AS course_title
     FROM chapters ch
     JOIN courses c ON c.id = ch.course_id
     WHERE ch.id = ?`,
    [chapterId]
  );

  if (!chapter) return res.status(404).send("Chapter not found");

  res.render("admin/chapter_edit", { chapter, error: null });
});

// HANDLE UPDATE
router.post("/admin/chapters/:id/edit", requireAdmin, async (req, res) => {
  const chapterId = req.params.id;
  const { title, position } = req.body;

  // Keep course_id for redirect
  const [[current]] = await pool.query(
    "SELECT course_id FROM chapters WHERE id = ?",
    [chapterId]
  );
  if (!current) return res.status(404).send("Chapter not found");

  await pool.query(
    "UPDATE chapters SET title = ?, position = ? WHERE id = ?",
    [title, Number(position) || 0, chapterId]
  );

  res.redirect(`/admin/courses/${current.course_id}/chapters`);
});

module.exports = router;
