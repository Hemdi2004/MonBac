const express = require('express');
const router = express.Router();

router.get("/lang/:locale", (req, res) => {
  const locale = req.params.locale;
  const backURL = req.header('Referer') || '/';
  
  if (['fr', 'ar'].includes(locale)) {
    // Save the selected language in a cookie for 1 year
    res.cookie('lang', locale, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  }
  
  res.redirect(backURL);
});

module.exports = router;
