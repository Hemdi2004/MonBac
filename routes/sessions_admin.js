const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Generate WhatsApp message page for a session
router.get("/admin/sessions/:id/message", requireAdmin, async (req, res) => {
  const sessionId = req.params.id;

  const [[session]] = await pool.query(
    "SELECT * FROM community_sessions WHERE id=?",
    [sessionId]
  );
  if (!session) return res.status(404).send("Session not found");

  const [[group]] = await pool.query(
    "SELECT * FROM community_groups WHERE id=?",
    [session.group_id]
  );

  const [[program]] = await pool.query(
    "SELECT * FROM community_programs WHERE id=?",
    [session.program_id]
  );

  res.render("admin/session_message", { session, group, program });
});

// Mark session message as sent
router.get("/admin/sessions/:id/mark-sent", requireAdmin, async (req, res) => {
  const sessionId = req.params.id;

  await pool.query(
    "UPDATE community_sessions SET message_sent=1 WHERE id=?",
    [sessionId]
  );

  // Redirect back to that program's sessions page
  const [[session]] = await pool.query(
    "SELECT program_id FROM community_sessions WHERE id=?",
    [sessionId]
  );

  res.redirect(`/admin/programs/${session.program_id}/sessions`);
});

module.exports = router;
