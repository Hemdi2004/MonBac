const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");

const router = express.Router();

// GET Request: Render Login Page
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// POST Request: Handle Authentication Flow
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("login", { error: "Email and password are required." });
  }

  try {
    // Database query execution
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.render("login", { error: "Invalid credentials." });
    }

    // Cryptographic validation layer
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.render("login", { error: "Invalid credentials." });
    }

    // Establish persistent session state
    req.session.user = { id: user.id, email: user.email, role: user.role };
    return res.redirect("/admin");

  } catch (error) {
    // Prevent sensitive system data from leaking to front-end while preserving execution flow
    console.error("Database or Crypto processing error during auth sequence:", error);
    return res.render("login", { error: "An unexpected system error occurred. Please try again later." });
  }
});

// POST Request: Handle Session Expiration/Destruction
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Session destruction error:", error);
    }
    return res.redirect("/login");
  });
});

module.exports = router;
