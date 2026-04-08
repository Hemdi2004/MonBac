const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin: list lessons for a chapter
router.get("/admin/chapters/:chapterId/lessons", requireAdmin, async (req, res) => {
  const chapterId = req.params.chapterId;

  const [[chapter]] = await pool.query(
    "SELECT chapters.*, courses.id AS course_id, courses.title AS course_title FROM chapters JOIN courses ON courses.id = chapters.course_id WHERE chapters.id = ?",
    [chapterId]
  );
  if (!chapter) return res.status(404).send("Chapter not found");

  const [lessons] = await pool.query(
    "SELECT * FROM lessons WHERE chapter_id = ? ORDER BY position ASC, created_at ASC",
    [chapterId]
  );

  res.render("admin/lessons", { chapter, lessons, error: null });
});

// Admin: create lesson
router.post("/admin/chapters/:chapterId/lessons", requireAdmin, async (req, res) => {
  const chapterId = req.params.chapterId;
  const { title, content, position, objective, exam_points, common_mistakes} = req.body;

  const [[chapter]] = await pool.query(
    "SELECT chapters.*, courses.id AS course_id, courses.title AS course_title FROM chapters JOIN courses ON courses.id = chapters.course_id WHERE chapters.id = ?",
    [chapterId]
  );
  if (!chapter) return res.status(404).send("Chapter not found");

  if (!title) {
    const [lessons] = await pool.query(
      "SELECT * FROM lessons WHERE chapter_id = ? ORDER BY position ASC, created_at ASC",
      [chapterId]
    );
    return res.render("lessons", { chapter, lessons, error: "Title is required." });
  }

  const pos = Number.isFinite(Number(position)) ? Number(position) : 0;

  await pool.query(
    "INSERT INTO lessons (chapter_id, title, content, position, objective, exam_points, common_mistakes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [chapterId, title, content || null, pos, objective || null, exam_points || null, common_mistakes || null]
  );

  res.redirect(`/admin/chapters/${chapterId}/lessons`);
});

// Admin: delete lesson
router.post("/admin/lessons/:id/delete", requireAdmin, async (req, res) => {
  const lessonId = req.params.id;

  const [[ls]] = await pool.query("SELECT chapter_id FROM lessons WHERE id = ?", [lessonId]);
  if (!ls) return res.status(404).send("Lesson not found");

  await pool.query("DELETE FROM lessons WHERE id = ?", [lessonId]);

  res.redirect(`/admin/chapters/${ls.chapter_id}/lessons`);
});

// SHOW edit form
router.get("/admin/lessons/:lessonId/edit", requireAdmin, async (req, res) => {
  const lessonId = req.params.lessonId;

  const [[lesson]] = await pool.query(
    `SELECT lessons.*, chapters.id AS chapter_id, chapters.title AS chapter_title,
            courses.id AS course_id, courses.title AS course_title
     FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     JOIN courses ON courses.id = chapters.course_id
     WHERE lessons.id = ?`,
    [lessonId]
  );

  if (!lesson) return res.status(404).send("Lesson not found");

  res.render("admin/lesson_edit", {
    lesson,
    error: null
  });
});

// HANDLE update
router.post("/admin/lessons/:lessonId/edit", requireAdmin, async (req, res) => {
  const lessonId = req.params.lessonId;

  const {
    title,
    position,
    content,
    objective,
    exam_points,
    common_mistakes
  } = req.body;

  // Get chapter_id for redirect
  const [[row]] = await pool.query("SELECT chapter_id FROM lessons WHERE id = ?", [lessonId]);
  if (!row) return res.status(404).send("Lesson not found");

  await pool.query(
    `UPDATE lessons
     SET title = ?,
         position = ?,
         content = ?,
         objective = ?,
         exam_points = ?,
         common_mistakes = ?
     WHERE id = ?`,
    [
      title,
      position || 0,
      content || null,
      objective || null,
      exam_points || null,
      common_mistakes || null,
      lessonId
    ]
  );

  res.redirect(`/admin/chapters/${row.chapter_id}/lessons`);
});


module.exports = router;
