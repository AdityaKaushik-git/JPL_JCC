require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });
    try {
        await pool.query('ALTER TABLE users MODIFY COLUMN role ENUM("user", "admin", "player") DEFAULT "user"');
        console.log('Modified users table role ENUM');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
