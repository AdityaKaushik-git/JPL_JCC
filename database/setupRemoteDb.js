require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function run() {
    console.log('Connecting to remote database at:', process.env.DB_HOST);
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        // 1. Run Schema
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        console.log('Executing schema on remote DB...');
        await pool.query(schema);
        console.log('Schema executed successfully!');

        // 2. Insert Base Admin and Users
        console.log('Inserting default Admin and Users...');
        const adminPass = await bcrypt.hash('admin123', 10);
        const userPass = await bcrypt.hash('user123', 10);
        
        // Ignore duplicate key errors if run multiple times
        await pool.query(`
            INSERT IGNORE INTO users (full_name, enrollment_number, email, mobile, password_hash, role) VALUES
            ('Admin', 'ADMIN001', 'admin@jpl.com', '0000000000', ?, 'admin')
        `, [adminPass]);

        await pool.query(`
            INSERT IGNORE INTO users (full_name, enrollment_number, email, mobile, password_hash, role, purse) VALUES
            ('John Doe', 'ENR001', 'john@jpl.com', '9876543210', ?, 'user', 30000000.00),
            ('Jane Smith', 'ENR002', 'jane@jpl.com', '9876543211', ?, 'user', 30000000.00),
            ('Alice Johnson', 'ENR003', 'alice@jpl.com', '9876543212', ?, 'user', 30000000.00)
        `, [userPass, userPass, userPass]);

        // 3. Insert Players
        console.log('Inserting sample players...');
        await pool.query(`
            INSERT IGNORE INTO players (name, playing_role, course, year, enrollment_number, base_price, status) VALUES
            ('Virat Kohli', 'Batsman', 'BTech', '3rd', 'PLY001', 50000.00, 'Available'),
            ('Jasprit Bumrah', 'Bowler', 'BCA', '2nd', 'PLY002', 40000.00, 'Available'),
            ('MS Dhoni', 'Wicket Keeper', 'BTech', '4th', 'PLY003', 45000.00, 'Available'),
            ('Hardik Pandya', 'All-Rounder', 'BBA', '3rd', 'PLY004', 60000.00, 'Available')
        `);

        console.log('✅ Remote Database Setup Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

run();
