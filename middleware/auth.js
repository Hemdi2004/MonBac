/**
 * Express middleware to enforce administrative privileges on protected routes.
 * Ensures state-based caching mechanisms are bypassed on unauthorized redirection.
 */
function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "admin") {
    return next();
  }

  // Prevent caching of administrative route data footprints during unauthorized access attempts
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  return res.redirect("/login");
}

module.exports = { requireAdmin };
