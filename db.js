const mysql = require("mysql2/promise");

// Fail fast during initialization if critical environment variables are missing
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME", "DB_PORT"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required database environment variable: ${envVar}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // Custom port required by Aiven
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
      rejectUnauthorized: false // REQUIRED by Aiven to accept the connection
  }
});

module.exports = pool;