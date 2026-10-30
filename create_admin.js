require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./db");

(async () => {
  // Read credentials from environment variables with safe, transparent fallbacks for local dev
  const adminEmail = process.env.ADMIN_EMAIL || "admin@teacher.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    await pool.query( 
      `INSERT INTO users (email, password_hash, role)
       VALUES (?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = 'admin'`,
      [adminEmail, passwordHash]
    );

    console.log(`Successfully seeded admin user: ${adminEmail}`);
  } catch (error) {
    console.error("Failed to seed admin user:", error.message);
    process.exitCode = 1;
  } finally {
    // Cleanly close the pool connection so Node can exit naturally without forcing process.exit()
    await pool.end();
  }
})();
