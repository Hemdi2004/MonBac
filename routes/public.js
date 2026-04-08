const express = require("express");
const pool = require("../db");

const router = express.Router();

// Home page: list published courses
router.get("/", async (req, res) => {

  const title = "MonBac — Cours, Exercices & Corrigés (Bac Maroc)";
  const description = "Cours gratuits, exercices et corrigés pour le Bac au Maroc. Leçons claires, structurées et orientées examens.";

  const [courses] = await pool.query(
    "SELECT id, title, description, slug, level FROM courses WHERE is_published = 1 ORDER BY created_at DESC"
  );
    //initialize the groups
  const groupedCourses = { "2bac": [], "1bac": [], "college": [] };

  // sort them into groups 

  for (const c of courses) {
    // This checks if the level exists in our object, if so, it pushes the course into it
    if (groupedCourses[c.level]) {
      groupedCourses[c.level].push(c);
    } else {
      // Handle cases where a level might not match our predefined keys
      groupedCourses["other"] = groupedCourses["other"] || [];
      groupedCourses["other"].push(c);
    }
  }
  res.render("home", {title, description, courses, groupedCourses});
});

// Course page: show course + PDFs
router.get("/course/:slug", async (req, res) => {
  const slug = req.params.slug;
  const canonical = `https://monbac.ma/course/${slug}`;
  const [[course]] = await pool.query(
    "SELECT * FROM courses WHERE slug = ? AND is_published = 1",
    [slug]
  );

   if (!course) return res.status(404).send("Course not found");

   const courseTitle = course.title; // from DB
   const title = `${courseTitle} — Cours, Chapitres & PDF | MonBac`;
   const description = `Cours ${courseTitle} : chapitres, leçons, ressources PDF (cours, exercices, corrigés). Préparation Bac Maroc.`;

  const [chapters] = await pool.query(
  "SELECT * FROM chapters WHERE course_id = ? ORDER BY position ASC, created_at ASC",
  [course.id]
  );
  const [lessons] = await pool.query(
  `SELECT lessons.*, chapters.title AS chapter_title, chapters.id AS chapter_id
   FROM lessons
   JOIN chapters ON chapters.id = lessons.chapter_id
   WHERE chapters.course_id = ?
   ORDER BY chapters.position ASC, lessons.position ASC`,
  [course.id]
);

  const [files] = await pool.query(
    "SELECT id, original_name FROM files WHERE course_id = ? ORDER BY uploaded_at DESC",
    [course.id]
  );

  res.render("course_public", {title, description, canonical, course, files, chapters, lessons });
});

router.get("/lesson/:id", async (req, res) => {
  const lessonId = req.params.id;
 const canonical = `https://monbac.ma/lesson/${lessonId}`;
  const [[lesson]] = await pool.query(
    `SELECT lessons.*, chapters.title AS chapter_title, chapters.id AS chapter_id,
            courses.title AS course_title, courses.slug AS course_slug
     FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     JOIN courses ON courses.id = chapters.course_id
     WHERE lessons.id = ? AND courses.is_published = 1`,
    [lessonId]
  );

  if (!lesson) return res.status(404).send("Lesson not found");

  // All lessons in same course ordered
  const [allLessons] = await pool.query(
    `SELECT lessons.id, lessons.title, lessons.position, chapters.position AS chapter_position
     FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     WHERE chapters.course_id = (
       SELECT chapters.course_id FROM lessons
       JOIN chapters ON chapters.id = lessons.chapter_id
       WHERE lessons.id = ?
     )
     ORDER BY chapters.position ASC, lessons.position ASC`,
    [lessonId]
  );

   //  TOC

   const [toc] = await pool.query(
  `SELECT chapters.id AS chapter_id,
          chapters.title AS chapter_title,
          chapters.position AS chapter_position,
          lessons.id AS lesson_id,
          lessons.title AS lesson_title,
          lessons.position AS lesson_position
   FROM chapters
   LEFT JOIN lessons ON lessons.chapter_id = chapters.id
   WHERE chapters.course_id = (
     SELECT chapters.course_id FROM lessons
     JOIN chapters ON chapters.id = lessons.chapter_id
     WHERE lessons.id = ?
   )
   ORDER BY chapters.position ASC, lessons.position ASC`,
  [lessonId]
);


  // Find index
  const index = allLessons.findIndex(l => l.id == lessonId);

  const prevLesson = index > 0 ? allLessons[index - 1] : null;
  const nextLesson = index < allLessons.length - 1 ? allLessons[index + 1] : null;

  const [files] = await pool.query(
    "SELECT id, original_name, category FROM files WHERE lesson_id = ? ORDER BY uploaded_at DESC",
    [lessonId]
  );

  // ---------- SEO fields for layout.ejs ----------
const clean = (s = "") => String(s).replace(/\s+/g, " ").trim();
const stripHtml = (s = "") => clean(String(s).replace(/<[^>]*>/g, ""));
const truncate = (s = "", n = 160) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const lessonTitle = clean(lesson.title);
const courseTitle = clean(lesson.course_title);
const chapterTitle = clean(lesson.chapter_title);

const title = `${lessonTitle} — Cours, Exercices & Corrigé | ${courseTitle} | MonBac`;

let baseDesc = `Leçon: ${lessonTitle}. Chapitre: ${chapterTitle}. Ressources PDF (cours, exercices, corrigé) pour ${courseTitle}.`;
if (lesson.content) baseDesc += " " + truncate(stripHtml(lesson.content), 120);

const description = truncate(baseDesc, 160);

//whatsapp link whatsapp display 

const WHATSAPP_NUMBER = "212676567566"; // digits only, no +
const whatsappText = `Bonjour Professeur, j’ai besoin d’aide pour cette leçon.

Niveau: (1ère/2ème Bac)
Cours: ${lesson.course_title}
Chapitre: ${lesson.chapter_title}
Leçon: ${lesson.title}

Mon objectif: (examen national / contrôle / compréhension)
Ma difficulté: ...`;

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  res.render("lesson_public", {
  title,
  description,
  canonical,
  lesson,
  toc,
  files,
  prevLesson,
  nextLesson,
  whatsappLink,
  whatsappTextDisplay: whatsappText
});

});

// Professeur page

router.get("/professeur", (req, res) => {
  const canonical = `https://monbac.ma/professeur`;
  const title = "Prof de Mathématiques (Bac Maroc) — Soutien & Préparation Examens | MonBac";
  const description = "Accompagnement en mathématiques (1ère Bac / 2ème Bac). Méthode structurée, exercices corrigés, suivi et préparation aux examens.";
//whatsapp link whatsapp display
const WHATSAPP_NUMBER = "212676567566";
const whatsappText = `Bonjour Professeur, je viens de voir votre profil sur MonBac. Je suis intéressé(e) par vos cours. Pourriez-vous m'envoyer vos disponibilités ? Merci !`;
 const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  res.render("professeur", { 
    canonical, 
    title, 
    description, 
    whatsappLink
  });
});


// communaute page

router.get("/communaute", (req, res) => {
    const canonical = `https://monbac.ma/communaute`;
    const title = "Communauté MonBac — Rejoignez Nos Groupes d'Étude & Sessions | MonBac";
    const description = "Rejoignez la communauté MonBac : groupes d'étude, sessions interactives, ressources partagées. Préparez le Bac avec vos pairs et nos experts.";
  res.render("communaute", { canonical, title, description });
});

// Onboarding form
router.get("/inscription", (req, res) => {
    const canonical = `https://monbac.ma/inscription`;
  res.render("inscription", { canonical });
});

// Onboarding submission
// Onboarding submission
router.post("/inscription", async (req, res) => {
  const { name, level, objective, whatsapp } = req.body;

  await pool.query(
    `INSERT INTO community_requests (name, level, objective, whatsapp)
     VALUES (?, ?, ?, ?)`,
    [name, level, objective, whatsapp]
  );

  res.render("inscription_success");
});

router.get("/emploi-du-temps", (req, res) => {
  res.render("schedule_lookup", { error: null });
});

router.post("/emploi-du-temps", async (req, res) => {
  const code = (req.body.code || "").trim();

  if (!code) return res.render("schedule_lookup", { error: "Veuillez entrer le code du groupe." });

  const [[group]] = await pool.query(
    "SELECT * FROM community_groups WHERE public_code = ?",
    [code]
  );

  if (!group) return res.render("schedule_lookup", { error: "Code invalide. Vérifiez avec votre professeur." });

  res.redirect(`/g/${group.public_code}`);
});

router.get("/g/:code", async (req, res) => {
  const code = req.params.code;
  const canonical = `https://monbac.ma/g/${code}`;
  const [[group]] = await pool.query(
    "SELECT * FROM community_groups WHERE public_code = ?",
    [code]
  );
  if (!group) return res.status(404).send("Groupe introuvable");

  const [sessions] = await pool.query(
    `SELECT cs.*, cp.title AS program_title
     FROM community_sessions cs
     JOIN community_programs cp ON cp.id = cs.program_id
     WHERE cs.group_id = ?
       AND (cs.session_date > CURDATE()
            OR (cs.session_date = CURDATE() AND cs.session_time >= CURTIME()))
     ORDER BY cs.session_date ASC, cs.session_time ASC`,
    [group.id]
  );

  res.render("group_schedule", { group, canonical, sessions });
});


module.exports = router;