require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./db");

(async () => {
  const email = "admin@teacher.com";
  const password = "ChangeMe123!";

  const hash = await bcrypt.hash(password, 12);
  await pool.query( 
  `INSERT INTO users (email, password_hash, role)
   VALUES (?, ?, 'admin')
   ON DUPLICATE KEY UPDATE
     password_hash = VALUES(password_hash),
     role = 'admin'`,
  [email, hash]
);


  console.log("Admin created:", email, password);
  process.exit(0);
})();
