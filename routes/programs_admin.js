const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// List + create programs
router.get("/admin/programs", requireAdmin, async (req, res) => {
  const [programs] = await pool.query("SELECT * FROM community_programs ORDER BY created_at DESC");
  res.render("admin/programs", { programs, error: req.query.error || null});
});

router.post("/admin/programs", requireAdmin, async (req, res) => {
  const { title, level, description } = req.body;

  await pool.query(
    "INSERT INTO community_programs (title, level, description) VALUES (?, ?, ?)",
    [title, level, description || null]
  );

  res.redirect("/admin/programs");
});

// 1. GET THE EDIT PAGE
router.get("/admin/programs/:id/edit", requireAdmin, async (req, res) => {
  // We use [ [row] ] to get the first result of the array
  const [[program]] = await pool.query("SELECT * FROM community_programs WHERE id = ?", [req.params.id]);
  
  if (!program) return res.status(404).send("Program not found");
  
  // Note: I renamed 'row' to 'program' for clarity in your EJS
  res.render("admin/program_edit", { program, error: null });
});

// 2. HANDLE THE UPDATE
router.post("/admin/programs/:id/edit", requireAdmin, async (req, res) => {
  const { title, level, description } = req.body;
  
  await pool.query(
    "UPDATE community_programs SET title = ?, level = ?, description = ? WHERE id = ?",
    [title, level, description || null, req.params.id]
  );
  
  res.redirect("/admin/programs");
});

// 3. HANDLE DELETE (With Safety Check)
router.post("/admin/programs/:id/delete", requireAdmin, async (req, res) => {
  const programId = req.params.id;

  // Check if there are sessions linked to this program
  const [[dep]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM community_sessions WHERE program_id = ?",
    [programId]
  );

  if (dep.cnt > 0) {
  return res.redirect("/admin/programs?error=" + encodeURIComponent("Impossible de supprimer : ce programme contient des séances."));
  }  

  await pool.query("DELETE FROM community_programs WHERE id = ?", [programId]);
  res.redirect("/admin/programs");
});

// Sessions page for a program
router.get("/admin/programs/:id/sessions", requireAdmin, async (req, res) => {
  const programId = req.params.id;

  const [[program]] = await pool.query("SELECT * FROM community_programs WHERE id=?", [programId]);
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
});

router.post("/admin/programs/:id/sessions", requireAdmin, async (req, res) => {
  const programId = req.params.id;
  const { group_id, title, session_date, session_time, meeting_link, notes } = req.body;

  await pool.query(
    `INSERT INTO community_sessions 
      (program_id, group_id, title, session_date, session_time, meeting_link, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [programId, group_id, title, session_date, session_time, meeting_link || null, notes || null]
  );

  res.redirect(`/admin/programs/${programId}/sessions`);
});

// 1. GET THE EDIT PAGE
router.get("/admin/sessions/:id/edit", requireAdmin, async (req, res) => {
  const sessionId = req.params.id;

  // Fetch the session
  const [[session]] = await pool.query("SELECT * FROM community_sessions WHERE id = ?", [sessionId]);
  if (!session) return res.status(404).send("Session not found");

  // Fetch groups so the admin can change the group if needed
  const [groups] = await pool.query("SELECT * FROM community_groups ORDER BY level, name");

  res.render("admin/session_edit", { session, groups, error: null });
});

// 2. HANDLE THE UPDATE
router.post("/admin/sessions/:id/edit", requireAdmin, async (req, res) => {
  const sessionId = req.params.id;
  const { group_id, title, session_date, session_time, meeting_link, notes } = req.body;

  // We need the program_id to redirect back to the correct list after saving
  const [[current]] = await pool.query("SELECT program_id FROM community_sessions WHERE id = ?", [sessionId]);

  await pool.query(
    `UPDATE community_sessions 
     SET group_id = ?, title = ?, session_date = ?, session_time = ?, meeting_link = ?, notes = ? 
     WHERE id = ?`,
    [group_id, title, session_date, session_time, meeting_link || null, notes || null, sessionId]
  );

  res.redirect(`/admin/programs/${current.program_id}/sessions`);
});

// 3. HANDLE DELETE
router.post("/admin/sessions/:id/delete", requireAdmin, async (req, res) => {
  const sessionId = req.params.id;

  // Get program_id before deleting so we know where to redirect
  const [[current]] = await pool.query("SELECT program_id FROM community_sessions WHERE id = ?", [sessionId]);
  if (!current) return res.redirect("/admin/programs");

  await pool.query("DELETE FROM community_sessions WHERE id = ?", [sessionId]);
  
  res.redirect(`/admin/programs/${current.program_id}/sessions`);
});
module.exports = router;
