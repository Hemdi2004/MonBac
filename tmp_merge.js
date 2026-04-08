const fs = require('fs');
const frPath = './locales/fr.json';
const arPath = './locales/ar.json';

const frData = JSON.parse(fs.readFileSync(frPath));
const arData = JSON.parse(fs.readFileSync(arPath));

const newFr = {
  "admin_title": "Dashboard Admin",
  "admin_connected": "Connecté en tant que : ",
  "admin_logout": "Logout",
  "admin_courses_t": "Cours",
  "admin_courses_p": "Créer, publier, organiser chapitres/leçons.",
  "admin_courses_btn": "Gérer les cours",
  "admin_comm_t": "Communauté",
  "admin_comm_p": "Accepter/refuser les demandes.",
  "admin_comm_btn": "Gestion communauté",
  "admin_groups_t": "Groupes",
  "admin_groups_p": "Créer des groupes, voir membres, organiser.",
  "admin_groups_btn": "Gestion des groupes",
  "admin_assign_t": "Affectation",
  "admin_assign_p": "Affecter les élèves acceptés à un groupe.",
  "admin_assign_btn": "Affectation élèves",
  "admin_prog_t": "Programmes & Sessions",
  "admin_prog_p": "Créer des programmes et planifier des séances.",
  "admin_prog_btn": "Programmes",
  "admin_tips_t": "Raccourcis",
  "admin_tips_p": "Astuce : commence par <strong>Cours → Chapitres → Leçons → Ressources</strong>."
};

const newAr = {
  "admin_title": "لوحة تحكم المسؤول",
  "admin_connected": "متصل كـ : ",
  "admin_logout": "تسجيل الخروج",
  "admin_courses_t": "الدروس",
  "admin_courses_p": "إنشاء، نشر، وتنظيم الفصول/الدروس.",
  "admin_courses_btn": "إدارة الدروس",
  "admin_comm_t": "المجتمع",
  "admin_comm_p": "قبول/رفض الطلبات.",
  "admin_comm_btn": "إدارة المجتمع",
  "admin_groups_t": "المجموعات",
  "admin_groups_p": "إنشاء مجموعات، رؤية الأعضاء، التنظيم.",
  "admin_groups_btn": "إدارة المجموعات",
  "admin_assign_t": "التعيين",
  "admin_assign_p": "تعيين التلاميذ المقبولين في مجموعة.",
  "admin_assign_btn": "تعيين التلاميذ",
  "admin_prog_t": "البرامج والحصص",
  "admin_prog_p": "إنشاء برامج وجدولة حصص.",
  "admin_prog_btn": "البرامج",
  "admin_tips_t": "اختصارات",
  "admin_tips_p": "نصيحة: ابدأ بـ <strong>الدروس ← الفصول ← الدروس ← الموارد</strong>."
};

Object.assign(frData, newFr);
Object.assign(arData, newAr);

fs.writeFileSync(frPath, JSON.stringify(frData, null, 2));
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));
console.log("Done");
