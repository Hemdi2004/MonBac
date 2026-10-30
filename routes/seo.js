const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db');

/**
 * @route   GET /robots.txt
 * @desc    Serve the static robots instructions mapping crawler rules
 * @access  Public
 */
router.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.sendFile(path.join(__dirname, "../public", "robots.txt"));
});

/**
 * @route   GET /sitemap.xml
 * @desc    Dynamically generate search engine sitemap indexes from live database paths
 * @access  Public
 */
router.get("/sitemap.xml", async (req, res, next) => {
  try {
    res.type("application/xml");

    // DevOps Best Practice: Inject production domain using environment variables with a local fallback
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    // Performance Optimization: Run database IO requests concurrently
    const [[courses], [lessons]] = await Promise.all([
      db.query("SELECT slug FROM courses"),
      db.query("SELECT id FROM lessons")
    ]);

    // Build standard index records
    const staticUrls = [
      `${baseUrl}/`,
      `${baseUrl}/professeur`
    ];

    // Map dynamic entities efficiently
    const courseUrls = courses.map(course => `${baseUrl}/course/${course.slug}`);
    const lessonUrls = lessons.map(lesson => `${baseUrl}/lesson/${lesson.id}`);

    // Flatten structural elements into unified sitemap target collection
    const allUrls = [...staticUrls, ...courseUrls, ...lessonUrls];

    // Construct valid sitemap payload markup strings
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

    res.send(xmlPayload);
  } catch (error) {
    console.error("Sitemap generation failure:", error);
    
    // Instead of raw string dumps, cleanly leverage standard fallback routing
    if (!res.headersSent) {
      res.status(500).send("Error generating sitemap");
    }
  }
});

module.exports = router;
