const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// Admin: List chapters for a course
// ==========================================
router.get("/admin/courses/:courseId/chapters", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (!course) return res.status(404).send("Course not found");

    const [chapters] = await pool.query(
      "SELECT * FROM chapters WHERE course_id = ? ORDER BY position ASC, created_at ASC",
      [courseId]
    );

    res.render("admin/chapters", { course, chapters, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Admin: Create chapter
// ==========================================
router.post("/admin/courses/:courseId/chapters", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;
  const { title, position } = req.body;

  try {
    if (!title) {
      const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
      const [chapters] = await pool.query(
        "SELECT * FROM chapters WHERE course_id = ? ORDER BY position ASC, created_at ASC",
        [courseId]
      );
      return res.render("admin/chapters", { course, chapters, error: "Title is required." });
    }

    const cleanPosition = parseInt(position, 10) || 0;

    await pool.query(
      "INSERT INTO chapters (course_id, title, position) VALUES (?, ?, ?)",
      [courseId, title, cleanPosition]
    );

    res.redirect(`/admin/courses/${courseId}/chapters`);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Admin: Delete chapter
// ==========================================
router.post("/admin/chapters/:id/delete", requireAdmin, async (req, res, next) => {
  const { id: chapterId } = req.params;

  try {
    const [[chapter]] = await pool.query("SELECT course_id FROM chapters WHERE id = ?", [chapterId]);
    if (!chapter) return res.status(404).send("Chapter not found");

    await pool.query("DELETE FROM chapters WHERE id = ?", [chapterId]);

    res.redirect(`/admin/courses/${chapter.course_id}/chapters`);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Admin: Show edit chapter form
// ==========================================
router.get("/admin/chapters/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: chapterId } = req.params;

  try {
    const [[chapter]] = await pool.query(
      `SELECT ch.*, c.id AS course_id, c.title AS course_title
       FROM chapters ch
       JOIN courses c ON c.id = ch.course_id
       WHERE ch.id = ?`,
      [chapterId]
    );

    if (!chapter) return res.status(404).send("Chapter not found");

    res.render("admin/chapter_edit", { chapter, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Admin: Handle update
// ==========================================
router.post("/admin/chapters/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: chapterId } = req.params;
  const { title, position } = req.body;

  try {
    const [[currentChapter]] = await pool.query(
      "SELECT course_id FROM chapters WHERE id = ?",
      [chapterId]
    );
    if (!currentChapter) return res.status(404).send("Chapter not found");

    const cleanPosition = parseInt(position, 10) || 0;

    await pool.query(
      "UPDATE chapters SET title = ?, position = ? WHERE id = ?",
      [title, cleanPosition, chapterId]
    );

    res.redirect(`/admin/courses/${currentChapter.course_id}/chapters`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
