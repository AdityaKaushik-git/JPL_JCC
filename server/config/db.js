const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'jpl_auction',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Aiven and many cloud providers require SSL
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')) {
    dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
