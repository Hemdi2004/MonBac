const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET Request: Generate WhatsApp message context mapping page for a session
router.get("/admin/sessions/:id/message", requireAdmin, async (req, res, next) => {
  const sessionId = req.params.id;

  try {
    const [[session]] = await pool.query(
      "SELECT * FROM community_sessions WHERE id = ?",
      [sessionId]
    );
    if (!session) return res.status(404).send("Session not found");

    // Optimized payload tracking: Execute independent entity records in parallel
    const [groupResult, programResult] = await Promise.all([
      pool.query("SELECT * FROM community_groups WHERE id = ?", [session.group_id]),
      pool.query("SELECT * FROM community_programs WHERE id = ?", [session.program_id])
    ]);

    const group = groupResult[0][0];
    const program = programResult[0][0];

    return res.render("admin/session_message", { session, group, program });
  } catch (error) {
    console.error("Database tracking error constructing session messages map context:", error);
    return next(error);
  }
});

// POST Request: Mark session message as sent (Restructured from GET to respect idempotency)
router.post("/admin/sessions/:id/mark-sent", requireAdmin, async (req, res, next) => {
  const sessionId = req.params.id;

  try {
    await pool.query(
      "UPDATE community_sessions SET message_sent = 1 WHERE id = ?",
      [sessionId]
    );

    // Retrieve programmatic index for correct target execution redirect path
    const [[session]] = await pool.query(
      "SELECT program_id FROM community_sessions WHERE id = ?",
      [sessionId]
    );

    if (!session) {
      return res.status(404).send("Session target reference missing post-mutation state");
    }

    return res.redirect(`/admin/programs/${session.program_id}/sessions`);
  } catch (error) {
    console.error("Database exception updating transaction sent logs state:", error);
    return next(error);
  }
});

module.exports = router;
