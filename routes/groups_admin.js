const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// View groups
router.get("/admin/groups", requireAdmin, async (req, res) => {
  const [groups] = await pool.query(
    "SELECT * FROM community_groups ORDER BY level ASC, name ASC"
  );
  res.render("admin/groups", { groups, error: req.query.error || null });
});


// Create group
router.post("/admin/groups", requireAdmin, async (req, res) => {
  const { name, level, type, public_code } = req.body;

  await pool.query(
    "INSERT INTO community_groups (name, level, type, public_code) VALUES (?, ?, ?, ?)",
    [name, level, type || null, public_code || null]
  );

  res.redirect("/admin/groups");
});

// View group members
router.get("/admin/groups/:id/members", requireAdmin, async (req, res) => {
  const groupId = req.params.id;

  const [[group]] = await pool.query(
    "SELECT * FROM community_groups WHERE id=?",
    [groupId]
  );

  const [members] = await pool.query(
    `SELECT cr.*
     FROM community_members cm
     JOIN community_requests cr ON cr.id = cm.student_id
     WHERE cm.group_id = ?`,
    [groupId]
  );

  res.render("admin/group_members", { group, members });
});

// edit group

router.get("/admin/groups/:id/edit", requireAdmin, async (req, res) => {
  const groupId = req.params.id;

  const [[group]] = await pool.query(
    "SELECT * FROM community_groups WHERE id = ?",
    [groupId]
  );
  if (!group) return res.status(404).send("Group not found");

  res.render("admin/group_edit", { group, error: null });
});

// post update

router.post("/admin/groups/:id/edit", requireAdmin, async (req, res) => {
  const groupId = req.params.id;
  const { name, level, type, public_code } = req.body;

  await pool.query(
    "UPDATE community_groups SET name = ?, level = ?, type = ?, public_code = ? WHERE id = ?",
    [name, level, type || null, public_code || null, groupId]
  );

  res.redirect("/admin/groups");
});

// post delete groups

router.post("/admin/groups/:id/delete", requireAdmin, async (req, res) => {
  const groupId = req.params.id;

  const [[s1]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM community_sessions WHERE group_id = ?",
    [groupId]
  );
  if (s1.cnt > 0) {
    return res.redirect("/admin/groups?error=" + encodeURIComponent("Impossible de supprimer : ce groupe a des sessions."));
  }

  const [[s2]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM community_members WHERE group_id = ?",
    [groupId]
  );
  if (s2.cnt > 0) {
    return res.redirect("/admin/groups?error=" + encodeURIComponent("Impossible de supprimer : ce groupe contient des membres."));
  }

  await pool.query("DELETE FROM community_groups WHERE id = ?", [groupId]);
  res.redirect("/admin/groups");
});

// post delete memebers

router.post("/admin/groups/:groupId/members/:studentId/remove", requireAdmin, async (req, res) => {
  const { groupId, studentId } = req.params;

  await pool.query(
    "DELETE FROM community_members WHERE group_id = ? AND student_id = ?",
    [groupId, studentId]
  );

  res.redirect(`/admin/groups/${groupId}/members`);
});

// 1. SHOW THE EDIT FORM
router.get("/admin/members/:studentId/edit", requireAdmin, async (req, res) => {
  const studentId = req.params.studentId;

  // Student info (source of truth)
  const [[student]] = await pool.query(
    "SELECT * FROM community_requests WHERE id = ?",
    [studentId]
  );
  if (!student) return res.status(404).send("Élève non trouvé");

  // Membership (which group is he in?)
  const [[membership]] = await pool.query(
    "SELECT * FROM community_members WHERE student_id = ?",
    [studentId]
  );
  if (!membership) return res.status(404).send("Cet élève n’est affecté à aucun groupe");

  // All groups for dropdown
  const [groups] = await pool.query(
    "SELECT * FROM community_groups ORDER BY level ASC, name ASC"
  );

  res.render("admin/member_edit", { student, membership, groups, error: null });
});

// 2. HANDLE THE UPDATE
router.post("/admin/members/:studentId/edit", requireAdmin, async (req, res) => {
  const studentId = req.params.studentId;
  const { name, whatsapp, group_id } = req.body;

  // Update student info
  await pool.query(
    "UPDATE community_requests SET name = ?, whatsapp = ? WHERE id = ?",
    [name, whatsapp, studentId]
  );

  // Update membership group
  await pool.query(
    "UPDATE community_members SET group_id = ? WHERE student_id = ?",
    [group_id, studentId]
  );

  res.redirect(`/admin/groups/${group_id}/members`);
});


module.exports = router;
