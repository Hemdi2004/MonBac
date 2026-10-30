require("dotenv").config();
const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const cookieParser = require("cookie-parser");
const i18n = require("i18n");
const db = require("./db"); 

const routes = require("./routes");

const app = express();
app.use(express.json());

i18n.configure({
  locales: ['fr', 'ar'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'fr',
  cookie: 'lang'
});

app.use(cookieParser());
app.use(i18n.init);

app.use((req, res, next) => {
  res.locals.locale = req.getLocale ? req.getLocale() : 'fr';
  // This creates a canonical URL for EVERY page automatically
  res.locals.canonical = `https://monbac.ma${req.path}`;
  next();
});

app.use("/public", express.static("public"));



app.set("view engine", "ejs");

app.use(expressLayouts);
app.use((req, res, next) => {
  res.locals.title = "MonBac";
  res.locals.description = "Plateforme éducative MonBac";
  next();
});
app.set("layout", "layout");

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(routes);



// app.get("/", (req, res) => res.redirect("/admin"));

// 404 Catch-All Middleware
app.use((req, res, next) => {
  res.status(404).render("404", { title: "Page non trouvée - MonBac" });
});

// Global Error Handler (Must have 4 arguments so Express knows it's an error handler)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack); // Logs the error to your terminal silently
  res.status(500).render("500", { title: "Erreur Serveur - MonBac" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});
