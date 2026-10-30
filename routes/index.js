const express = require("express");
const router = express.Router();

// Core & Authentication Core Routes
router.use(require("./auth"));
router.use(require("./public"));

// Admin Control Panel Routes
router.use(require("./admin"));
router.use(require("./assign_admin"));
router.use(require("./community_admin"));
router.use(require("./groups_admin"));
router.use(require("./programs_admin"));
router.use(require("./sessions_admin"));

// Educational Content Management Routes
router.use(require("./courses"));
router.use(require("./chapters"));
router.use(require("./lessons"));
router.use(require("./files"));

// System Utilities & AI Integrations
router.use(require("./ai_tutor"));
router.use(require("./lang"));
router.use(require("./seo"));

module.exports = router;
