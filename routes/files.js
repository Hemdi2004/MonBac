const express = require("express");
const multer = require("multer");
const path = require("path");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/");

    if (!ok) return cb(new Error("Only PDF or image files allowed"));
    cb(null, true);
  },
});


// Upload PDF to course
router.post("/admin/courses/:id/upload", requireAdmin, upload.single("pdf"), async (req, res) => {
  const courseId = req.params.id;

  await pool.query(
    `INSERT INTO files (course_id, original_name, stored_name, mime_type, size)
     VALUES (?, ?, ?, ?, ?)`,
    [
      courseId,
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
    ]
  );

  res.redirect(`/admin/courses/${courseId}/files`);
});

// List files for course
router.get("/admin/courses/:id/files", requireAdmin, async (req, res) => {
  const courseId = req.params.id;

  const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
  const [files] = await pool.query("SELECT * FROM files WHERE course_id = ?", [courseId]);

  res.render("files", { course, files });
});

// Admin: list files for a lesson
router.get("/admin/lessons/:lessonId/files", requireAdmin, async (req, res) => {
  const lessonId = req.params.lessonId;

  const [[lesson]] = await pool.query(
    `SELECT lessons.*, chapters.title AS chapter_title, courses.title AS course_title
     FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     JOIN courses ON courses.id = chapters.course_id
     WHERE lessons.id = ?`,
    [lessonId]
  );
  if (!lesson) return res.status(404).send("Lesson not found");

  const [files] = await pool.query(
    "SELECT * FROM files WHERE lesson_id = ? ORDER BY uploaded_at DESC",
    [lessonId]
  );

  res.render("admin/lesson_files", { lesson, files, error: null });
});

// Admin: upload file (pdf/image) to a lesson with category
router.post("/admin/lessons/:lessonId/upload", requireAdmin, upload.single("pdf"), async (req, res) => {
  const lessonId = req.params.lessonId;
  const category = req.body.category || "other";

  const [[lessonRow]] = await pool.query(
    `SELECT lessons.id, chapters.course_id
     FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     WHERE lessons.id = ?`,
    [lessonId]
  );
  if (!lessonRow) return res.status(404).send("Lesson not found");

  await pool.query(
    `INSERT INTO files (course_id, lesson_id, original_name, stored_name, mime_type, size, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      lessonRow.course_id,
      lessonId,
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      category,
    ]
  );

  res.redirect(`/admin/lessons/${lessonId}/files`);
});


// Download
router.get("/files/:id", async (req, res) => {
  const [[file]] = await pool.query("SELECT * FROM files WHERE id = ?", [req.params.id]);

  if (!file) return res.status(404).send("Not found");

  res.download(path.join(__dirname, "../uploads", file.stored_name), file.original_name);
});

module.exports = router;
