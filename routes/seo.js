const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../db'); // Database connection

// robots.txt
router.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.sendFile(path.join(__dirname, "../public", "robots.txt"));
});

// sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    res.type("application/xml");

    // 1) Set your base URL
    const BASE_URL = "http://localhost:3000"; // Update this to your real domain when you deploy

    // 2) Query URLs from DB - Added [rows] destructuring for mysql2/promise
    const [courses] = await db.query("SELECT slug FROM courses");
    const [lessons] = await db.query("SELECT id FROM lessons");

    // 3) Build sitemap XML
    const urls = [];

    // Static pages
    urls.push(`${BASE_URL}/`);
    urls.push(`${BASE_URL}/professeur`);

    // Course pages
    for (const c of courses) {
      urls.push(`${BASE_URL}/course/${c.slug}`);
    }

    // Lesson pages
    for (const l of lessons) {
      urls.push(`${BASE_URL}/lesson/${l.id}`);
    }

    // 4) Construct the XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;
