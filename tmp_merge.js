const fs = require('fs');
const path = require('path');

const frPath = path.resolve('./locales/fr.json');
const arPath = path.resolve('./locales/ar.json');

const newFrKeys = {
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

const newArKeys = {
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

function safeMergeLocalization(filePath, payloadKeys) {
  try {
    let currentData = {};

    if (fs.existsSync(filePath)) {
      const parsedFileContent = fs.readFileSync(filePath, 'utf8');
      currentData = parsedFileContent.trim() ? JSON.parse(parsedFileContent) : {};
    } else {
      console.log(`[Initialization] Targeting new dictionary instance file initialization at: ${filePath}`);
    }

    // Inspect trace loops for colliding namespace flags
    Object.keys(payloadKeys).forEach(key => {
      if (currentData[key] !== undefined && currentData[key] !== payloadKeys[key]) {
        console.warn(`[Collision Warning] Key "${key}" value overwritten inside target dataset path map.`);
      }
    });

    const updatedData = Object.assign({}, currentData, payloadKeys);
    
    // Ensure target folder maps exist safely before file write execution
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    
    console.log(`[Success] Successfully compiled and merged entries to target mapping space: ${filePath}`);
  } catch (error) {
    console.error(`[Fatal Error] System failed to compile dictionary mapping context safely at: ${filePath}`, error);
    process.exit(1);
  }
}

// Fire transactional safe merge executions
safeMergeLocalization(frPath, newFrKeys);
safeMergeLocalization(arPath, newArKeys);

console.log("Compilation tasks complete.");
