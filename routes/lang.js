const express = require('express');
const router = express.Router();

/**
 * @route   GET /lang/:locale
 * @desc    Set application localization locale cookie and redirect back safely
 * @access  Public
 */
router.get("/lang/:locale", (req, res) => {
  const { locale } = req.params;
  const refererHeader = req.header('Referer') || '/';
  
  // Production Security: Validate and sanitize the target URL to prevent Open Redirect vulnerabilities
  let safeRedirectUrl = '/';
  try {
    const parsedUrl = new URL(refererHeader, `${req.protocol}://${req.get('host')}`);
    
    // Ensure the redirect remains internal to our app's domain platform
    if (parsedUrl.host === req.get('host')) {
      safeRedirectUrl = parsedUrl.pathname + parsedUrl.search;
    }
  } catch (error) {
    // Fall back gracefully to home directory if URL structural parsing encounters errors
    safeRedirectUrl = '/';
  }

  // Validate supported language locales
  const supportedLocales = ['fr', 'ar', "en"];
  if (supportedLocales.includes(locale)) {
    // Production Cookie Security: Added httpOnly, secure flags, and sameSite configuration
    res.cookie('lang', locale, { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 Year longevity
      httpOnly: true,                    // Mitigates client-side XSS cookie theft
      secure: process.env.NODE_ENV === 'production', // Enforce HTTPS transmission in prod environments
      sameSite: 'lax'                    // Provides structural CSRF security protection
    });
  }
  
  res.redirect(safeRedirectUrl);
});

module.exports = router;
