const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /admin/courses
 * @desc    Fetch and list all courses ordered by creation date
 * @access  Private (Admin Only)
 */
router.get("/admin/courses", requireAdmin, async (req, res, next) => {
  try {
    const [courses] = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
    res.render("admin/courses", { courses });
  } catch (error) {
    console.error("Failed to fetch courses index:", error);
    next(error);
  }
});

/**
 * @route   GET /admin/courses/new
 * @desc    Render the course creation form
 * @access  Private (Admin Only)
 */
router.get("/admin/courses/new", requireAdmin, (req, res) => {
  res.render("admin/course_new");
});

/**
 * @route   POST /admin/courses
 * @desc    Create a new course and automatically generate its URI slug
 * @access  Private (Admin Only)
 */
router.post("/admin/courses", requireAdmin, async (req, res, next) => {
  const { title, description, level } = req.body;

  if (!title || !level) {
    return res.status(400).send("Bad Request: Title and Level fields are required.");
  }

  // Sanitize title string to generate a clean URI-safe slug
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters to secure URLs
    .replace(/\s+/g, "-");

  try {
    await pool.query(
      "INSERT INTO courses (title, description, slug, level) VALUES (?, ?, ?, ?)",
      [title, description || null, slug, level]
    );
    res.redirect("/admin/courses");
  } catch (error) {
    console.error("Failed to create course profile:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).send("Conflict: A course with this title or slug already exists.");
    }
    next(error);
  }
});

/**
 * @route   POST /admin/courses/:courseId/delete
 * @desc    Remove a course if it has zero active dependencies (chapters)
 * @access  Private (Admin Only)
 */
router.post("/admin/courses/:courseId/delete", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;

  try {
    // Assert safe deletion integrity check
    const [[dependencyCheck]] = await pool.query(
      "SELECT COUNT(*) AS chapterCount FROM chapters WHERE course_id = ?",
      [courseId]
    );

    if (dependencyCheck.chapterCount > 0) {
      return res.status(400).send("Cannot delete: course has chapters. Delete chapters first.");
    }

    await pool.query("DELETE FROM courses WHERE id = ?", [courseId]);
    res.redirect("/admin/courses");
  } catch (error) {
    console.error(`Failed to delete course ID ${courseId}:`, error);
    next(error);
  }
});

/**
 * @route   GET /admin/courses/:courseId/edit
 * @desc    Render the editing form for an existing course
 * @access  Private (Admin Only)
 */
router.get("/admin/courses/:courseId/edit", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [courseId]);
    
    if (!course) {
      return res.status(404).send("Course not found");
    }

    res.render("admin/course_edit", { course, error: null });
  } catch (error) {
    console.error(`Failed to fetch course ID ${courseId} for editing:`, error);
    next(error);
  }
});

/**
 * @route   POST /admin/courses/:courseId/edit
 * @desc    Update course attributes and specifications
 * @access  Private (Admin Only)
 */
router.post("/admin/courses/:courseId/edit", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;
  const { title, slug, description, level } = req.body;

  if (!title || !slug || !level) {
    return res.status(400).send("Bad Request: Title, Slug, and Level are required.");
  }

  try {
    await pool.query(
      `UPDATE courses 
       SET title = ?, slug = ?, description = ?, level = ? 
       WHERE id = ?`,
      [title, slug, description || null, level, courseId]
    );
    res.redirect("/admin/courses");
  } catch (error) {
    console.error(`Failed to update course ID ${courseId}:`, error);
    next(error);
  }
});

/**
 * @route   POST /admin/courses/:courseId/toggle
 * @desc    Toggle publication visibility state between Published and Unpublished
 * @access  Private (Admin Only)
 */
router.post("/admin/courses/:courseId/toggle", requireAdmin, async (req, res, next) => {
  const { courseId } = req.params;

  try {
    await pool.query(
      "UPDATE courses SET is_published = NOT is_published WHERE id = ?",
      [courseId]
    );
    res.redirect("/admin/courses");
  } catch (error) {
    console.error(`Failed to toggle visibility state for course ID ${courseId}:`, error);
    next(error);
  }
});

module.exports = router;
