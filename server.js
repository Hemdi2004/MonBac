require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const i18n = require("i18n");

// DB initialization verified (handled internally by the module)
require("./db"); 
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ==========================================
// 1. Internationalization (i18n) & Parsers
// ==========================================
i18n.configure({
  locales: ["fr", "ar", "en"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "fr",
  cookie: "lang",
  updateFiles: false
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(i18n.init);

// ==========================================
// 2. View Engine & Asset Settings
// ==========================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");
app.use(expressLayouts);
app.use("/public", express.static(path.join(__dirname, "public")));

// Global View Context Injection
app.use((req, res, next) => {
  res.locals.locale = req.getLocale ? req.getLocale() : "fr";
  res.locals.canonical = `https://monbac.ma${req.path}`;
  res.locals.title = "MonBac";
  res.locals.description = "Plateforme éducative MonBac";
  next();
});

// ==========================================
// 3. Session & Security Compliance
// ==========================================
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "development_fallback_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IS_PRODUCTION, 
      sameSite: IS_PRODUCTION ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    }
  })
);

// ==========================================
// 4. Core Routing Execution
// ==========================================
app.use(routes);

// ==========================================
// 5. Error Catchment & Resilience
// ==========================================

// 404 Catch-All Middleware
app.use((req, res, next) => {
  res.status(404).render("404", { title: "Page non trouvée - MonBac" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Critical Server Error:", err.stack);
  res.status(500).render("500", { title: "Erreur Serveur - MonBac" });
});

// ==========================================
// 6. Application Startup
// ==========================================
app.listen(PORT, () => {
  console.log(`[MonBac Engine] Server actively running on http://localhost:${PORT}`);
});
