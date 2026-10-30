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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isValidMimeType =
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/");

    if (!isValidMimeType) {
      return cb(new Error("Only PDF or image files allowed"));
    }
    cb(null, true);
  },
});

// Upload PDF/Image to course
router.post("/admin/courses/:id/upload", requireAdmin, upload.single("pdf"), async (req, res, next) => {
  const courseId = req.params.id;

  if (!req.file) {
    return res.status(400).send("No file payload attached to request.");
  }

  try {
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

    return res.redirect(`/admin/courses/${courseId}/files`);
  } catch (error) {
    console.error("Database persistence error during course file upload:", error);
    return next(error);
  }
});

// List files for course
router.get("/admin/courses/:id/files", requireAdmin, async (req, res, next) => {
  const courseId = req.params.id;

  try {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    if (!course) {
      return res.status(404).send("Course target execution context not found");
    }

    const [files] = await pool.query("SELECT * FROM files WHERE course_id = ?", [courseId]);
    return res.render("files", { course, files });
  } catch (error) {
    console.error("Query trace failure inside get course files layout:", error);
    return next(error);
  }
});

// Admin: list files for a lesson
router.get("/admin/lessons/:lessonId/files", requireAdmin, async (req, res, next) => {
  const lessonId = req.params.lessonId;

  try {
    const [[lesson]] = await pool.query(
      `SELECT lessons.*, chapters.title AS chapter_title, courses.title AS course_title
       FROM lessons
       JOIN chapters ON chapters.id = lessons.chapter_id
       JOIN courses ON courses.id = chapters.course_id
       WHERE lessons.id = ?`,
      [lessonId]
    );
    if (!lesson) {
      return res.status(404).send("Lesson not found");
    }

    const [files] = await pool.query(
      "SELECT * FROM files WHERE lesson_id = ? ORDER BY uploaded_at DESC",
      [lessonId]
    );

    return res.render("admin/lesson_files", { lesson, files, error: null });
  } catch (error) {
    console.error("Trace processing exception fetching lesson context maps:", error);
    return next(error);
  }
});

// Admin: upload file (pdf/image) to a lesson with category
router.post("/admin/lessons/:lessonId/upload", requireAdmin, upload.single("pdf"), async (req, res, next) => {
  const lessonId = req.params.lessonId;
  const category = req.body.category || "other";

  if (!req.file) {
    return res.status(400).send("No file payload attached to request.");
  }

  try {
    const [[lessonRow]] = await pool.query(
      `SELECT lessons.id, chapters.course_id
       FROM lessons
       JOIN chapters ON chapters.id = lessons.chapter_id
       WHERE lessons.id = ?`,
      [lessonId]
    );
    if (!lessonRow) {
      return res.status(404).send("Lesson reference not found");
    }

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

    return res.redirect(`/admin/lessons/${lessonId}/files`);
  } catch (error) {
    console.error("Runtime exception trying to process lesson upload assets:", error);
    return next(error);
  }
});

// Stream / Download Gateway
router.get("/files/:id", async (req, res, next) => {
  try {
    const [[file]] = await pool.query("SELECT * FROM files WHERE id = ?", [req.params.id]);
    if (!file) {
      return res.status(404).send("File instance not mapped inside database pool state");
    }

    // Normalized paths targeting application root directory map space safely
    const absoluteDiskPath = path.resolve("uploads", file.stored_name);
    return res.download(absoluteDiskPath, file.original_name);
  } catch (error) {
    console.error("Downstream stream pipeline failure downloading requested index object:", error);
    return next(error);
  }
});

module.exports = router;
