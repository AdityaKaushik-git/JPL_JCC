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
        await pool.query('ALTER TABLE users MODIFY COLUMN purse DECIMAL(15,2) DEFAULT 30000000.00');
        await pool.query('UPDATE users SET purse = 30000000.00 WHERE role = "user"');
        console.log('Modified users table purse');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
