const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Fetch and view pending community requests
router.get("/admin/community", requireAdmin, async (req, res, next) => {
  try {
    const [communityRequests] = await pool.query(
      "SELECT * FROM community_requests ORDER BY created_at DESC"
    );

    res.render("admin/community", { requests: communityRequests });
  } catch (error) {
    next(error);
  }
});

// Update request status to 'accepted'
router.post("/admin/community/accept/:id", requireAdmin, async (req, res, next) => {
  try {
    const requestId = req.params.id;
    
    await pool.query(
      "UPDATE community_requests SET status = 'accepted' WHERE id = ?",
      [requestId]
    );
    
    res.redirect("/admin/community");
  } catch (error) {
    next(error);
  }
});

// Update request status to 'rejected'
router.post("/admin/community/reject/:id", requireAdmin, async (req, res, next) => {
  try {
    const requestId = req.params.id;
    
    await pool.query(
      "UPDATE community_requests SET status = 'rejected' WHERE id = ?",
      [requestId]
    );
    
    res.redirect("/admin/community");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
