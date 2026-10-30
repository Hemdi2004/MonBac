const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// View Groups
// ==========================================
router.get("/admin/groups", requireAdmin, async (req, res, next) => {
  try {
    const [groups] = await pool.query(
      "SELECT * FROM community_groups ORDER BY level ASC, name ASC"
    );
    res.render("admin/groups", { groups, error: req.query.error || null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Create Group
// ==========================================
router.post("/admin/groups", requireAdmin, async (req, res, next) => {
  const { name, level, type, public_code } = req.body;

  try {
    await pool.query(
      "INSERT INTO community_groups (name, level, type, public_code) VALUES (?, ?, ?, ?)",
      [name, level, type || null, public_code || null]
    );

    res.redirect("/admin/groups");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// View Group Members
// ==========================================
router.get("/admin/groups/:id/members", requireAdmin, async (req, res, next) => {
  const { id: groupId } = req.params;

  try {
    const [[group]] = await pool.query(
      "SELECT * FROM community_groups WHERE id = ?",
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
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Edit Group: View Form
// ==========================================
router.get("/admin/groups/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: groupId } = req.params;

  try {
    const [[group]] = await pool.query(
      "SELECT * FROM community_groups WHERE id = ?",
      [groupId]
    );
    if (!group) return res.status(404).send("Group not found");

    res.render("admin/group_edit", { group, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Edit Group: Handle Update
// ==========================================
router.post("/admin/groups/:id/edit", requireAdmin, async (req, res, next) => {
  const { id: groupId } = req.params;
  const { name, level, type, public_code } = req.body;

  try {
    await pool.query(
      "UPDATE community_groups SET name = ?, level = ?, type = ?, public_code = ? WHERE id = ?",
      [name, level, type || null, public_code || null, groupId]
    );

    res.redirect("/admin/groups");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Delete Group
// ==========================================
router.post("/admin/groups/:id/delete", requireAdmin, async (req, res, next) => {
  const { id: groupId } = req.params;

  try {
    const [[s1]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM community_sessions WHERE group_id = ?",
      [groupId]
    );
    if (s1.cnt > 0) {
      const errMsg = encodeURIComponent("Impossible de supprimer : ce groupe a des sessions.");
      return res.redirect(`/admin/groups?error=${errMsg}`);
    }

    const [[s2]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM community_members WHERE group_id = ?",
      [groupId]
    );
    if (s2.cnt > 0) {
      const errMsg = encodeURIComponent("Impossible de supprimer : ce groupe contient des membres.");
      return res.redirect(`/admin/groups?error=${errMsg}`);
    }

    await pool.query("DELETE FROM community_groups WHERE id = ?", [groupId]);
    res.redirect("/admin/groups");
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Remove Group Member
// ==========================================
router.post("/admin/groups/:groupId/members/:studentId/remove", requireAdmin, async (req, res, next) => {
  const { groupId, studentId } = req.params;

  try {
    await pool.query(
      "DELETE FROM community_members WHERE group_id = ? AND student_id = ?",
      [groupId, studentId]
    );

    res.redirect(`/admin/groups/${groupId}/members`);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Edit Individual Member: View Form
// ==========================================
router.get("/admin/members/:studentId/edit", requireAdmin, async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const [[student]] = await pool.query(
      "SELECT * FROM community_requests WHERE id = ?",
      [studentId]
    );
    if (!student) return res.status(404).send("Élève non trouvé");

    const [[membership]] = await pool.query(
      "SELECT * FROM community_members WHERE student_id = ?",
      [studentId]
    );
    if (!membership) return res.status(404).send("Cet élève n’est affecté à aucun groupe");

    const [groups] = await pool.query(
      "SELECT * FROM community_groups ORDER BY level ASC, name ASC"
    );

    res.render("admin/member_edit", { student, membership, groups, error: null });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// Edit Individual Member: Handle Update
// ==========================================
router.post("/admin/members/:studentId/edit", requireAdmin, async (req, res, next) => {
  const { studentId } = req.params;
  const { name, whatsapp, group_id } = req.body;

  try {
    await pool.query(
      "UPDATE community_requests SET name = ?, whatsapp = ? WHERE id = ?",
      [name, whatsapp, studentId]
    );

    await pool.query(
      "UPDATE community_members SET group_id = ? WHERE student_id = ?",
      [group_id, studentId]
    );

    res.redirect(`/admin/groups/${group_id}/members`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
