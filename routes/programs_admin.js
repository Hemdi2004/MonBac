const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// Programs: List All Programs
// ==========================================
router.get("/admin/programs", requireAdmin, async (req, res, next) => {
  try {
    const [programs] = await pool.query("SELECT * FROM community_programs ORDER BY created_at DESC");
    res.render("admin/programs", { programs, error: req.query.error || null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Programs: Create New Program
// ==========================================
router.post("/admin/programs", requireAdmin, async (req, res, next) => {
  const { title, level, description } = req.body;

  try {
    await pool.query(
      "INSERT INTO community_programs (title, level, description) VALUES (?, ?, ?)",
      [title, level, description || null]
    );

    res.redirect("/admin/programs");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Programs: Edit View Form
// ==========================================
router.get("/admin/programs/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: programId } = req.params;

  try {
    const [[program]] = await pool.query("SELECT * FROM community_programs WHERE id = ?", [programId]);
    if (!program) return res.status(404).send("Program not found");
    
    res.render("admin/program_edit", { program, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Programs: Handle Update Execution
// ==========================================
router.post("/admin/programs/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: programId } = req.params;
  const { title, level, description } = req.body;
  
  try {
    await pool.query(
      "UPDATE community_programs SET title = ?, level = ?, description = ? WHERE id = ?",
      [title, level, description || null, programId]
    );
    
    res.redirect("/admin/programs");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Programs: Handle Delete with Safety Checks
// ==========================================
router.post("/admin/programs/:id/delete", requireAdmin, async (req, res, next) => {
  const { id: programId } = req.params;

  try {
    const [[dep]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM community_sessions WHERE program_id = ?",
      [programId]
    );

    if (dep.cnt > 0) {
      const errMsg = encodeURIComponent("Impossible de supprimer : ce programme contient des séances.");
      return res.redirect(`/admin/programs?error=${errMsg}`);
    }  

    await pool.query("DELETE FROM community_programs WHERE id = ?", [programId]);
    res.redirect("/admin/programs");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Sessions: List Sessions for a Specific Program
// ==========================================
router.get("/admin/programs/:id/sessions", requireAdmin, async (req, res, next) => {
  const { id: programId } = req.params;

  try {
    const [[program]] = await pool.query("SELECT * FROM community_programs WHERE id = ?", [programId]);
    if (!program) return res.status(404).send("Program not found");

    const [groups] = await pool.query("SELECT * FROM community_groups ORDER BY level, name");

    const [sessions] = await pool.query(
      `SELECT cs.*, cg.name AS group_name
       FROM community_sessions cs
       JOIN community_groups cg ON cg.id = cs.group_id
       WHERE cs.program_id = ?
       ORDER BY cs.session_date ASC, cs.session_time ASC`,
      [programId]
    );

    res.render("admin/sessions", { program, groups, sessions });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Sessions: Create Session inside a Program
// ==========================================
router.post("/admin/programs/:id/sessions", requireAdmin, async (req, res, next) => {
  const { id: programId } = req.params;
  const { group_id, title, session_date, session_time, meeting_link, notes } = req.body;

  try {
    await pool.query(
      `INSERT INTO community_sessions 
        (program_id, group_id, title, session_date, session_time, meeting_link, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [programId, group_id, title, session_date, session_time, meeting_link || null, notes || null]
    );

    res.redirect(`/admin/programs/${programId}/sessions`);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Sessions: Edit View Form
// ==========================================
router.get("/admin/sessions/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: sessionId } = req.params;

  try {
    const [[session]] = await pool.query("SELECT * FROM community_sessions WHERE id = ?", [sessionId]);
    if (!session) return res.status(404).send("Session not found");

    const [groups] = await pool.query("SELECT * FROM community_groups ORDER BY level, name");

    res.render("admin/session_edit", { session, groups, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Sessions: Handle Update Execution
// ==========================================
router.post("/admin/sessions/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: sessionId } = req.params;
  const { group_id, title, session_date, session_time, meeting_link, notes } = req.body;

  try {
    const [[current]] = await pool.query("SELECT program_id FROM community_sessions WHERE id = ?", [sessionId]);
    if (!current) return res.status(404).send("Session context not found");

    await pool.query(
      `UPDATE community_sessions 
       SET group_id = ?, title = ?, session_date = ?, session_time = ?, meeting_link = ?, notes = ? 
       WHERE id = ?`,
      [group_id, title, session_date, session_time, meeting_link || null, notes || null, sessionId]
    );

    res.redirect(`/admin/programs/${current.program_id}/sessions`);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Sessions: Handle Delete Execution
// ==========================================
router.post("/admin/sessions/:id/delete", requireAdmin, async (req, res, next) => {
  const { id: sessionId } = req.params;

  try {
    const [[current]] = await pool.query("SELECT program_id FROM community_sessions WHERE id = ?", [sessionId]);
    if (!current) return res.redirect("/admin/programs");

    await pool.query("DELETE FROM community_sessions WHERE id = ?", [sessionId]);
    
    res.redirect(`/admin/programs/${current.current.program_id || current.program_id}/sessions`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
