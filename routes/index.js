const express = require('express');
const router = express.Router();

router.use(require("./auth"));
router.use(require("./admin"));
router.use(require("./courses"));
router.use(require("./files"));
router.use(require("./public"));
router.use(require("./chapters"));
router.use(require("./lessons"));
router.use(require("./community_admin"));
router.use(require("./groups_admin"));
router.use(require("./assign_admin"));
router.use(require("./programs_admin"));
router.use(require("./sessions_admin"));
router.use(require("./seo"));
router.use(require("./lang"));
router.use(require("./ai_tutor")); // Added AI Tutor route

module.exports = router;
