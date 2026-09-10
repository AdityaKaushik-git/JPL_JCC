require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            multipleStatements: true
        });

        console.log('Connected to MySQL. Creating database and tables...');
        
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await connection.query(schema);
        console.log('Database and tables created.');

        await connection.query('USE ' + process.env.DB_NAME);

        console.log('Inserting seed data...');
        const adminPass = await bcrypt.hash('admin123', 10);
        const userPass = await bcrypt.hash('user123', 10);

        await connection.query(`
            INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, purse) VALUES
            ('Admin User', 'ADMIN001', 'admin@jpl.com', '1234567890', ?, 'admin', 0)
            ON DUPLICATE KEY UPDATE id=id;
        `, [adminPass]);

        await connection.query(`
            INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, purse) VALUES
            ('John Doe', 'ENR001', 'john@jpl.com', '9876543210', ?, 'user', 30000000.00),
            ('Jane Smith', 'ENR002', 'jane@jpl.com', '9876543211', ?, 'user', 30000000.00),
            ('Alice Johnson', 'ENR003', 'alice@jpl.com', '9876543212', ?, 'user', 30000000.00)
            ON DUPLICATE KEY UPDATE id=id;
        `, [userPass, userPass, userPass]);

        await connection.query(`
            INSERT IGNORE INTO players (name, playing_role, course, year, enrollment_number, base_price, status) VALUES
            ('Rohit Sharma', 'Batsman', 'BTech', '4', 'P001', 10000.00, 'Available'),
            ('Virat Kohli', 'Batsman', 'BCA', '3', 'P002', 15000.00, 'Available'),
            ('Jasprit Bumrah', 'Bowler', 'BBA', '2', 'P003', 12000.00, 'Available'),
            ('Hardik Pandya', 'All-Rounder', 'BTech', '3', 'P004', 14000.00, 'Available'),
            ('MS Dhoni', 'Wicket Keeper', 'MBA', '2', 'P005', 20000.00, 'Available'),
            ('Ravindra Jadeja', 'All-Rounder', 'BSc', '3', 'P006', 11000.00, 'Available'),
            ('Rishabh Pant', 'Wicket Keeper', 'BTech', '2', 'P007', 10000.00, 'Available'),
            ('Mohammed Shami', 'Bowler', 'MCA', '2', 'P008', 9000.00, 'Available'),
            ('KL Rahul', 'Batsman', 'BTech', '4', 'P009', 11000.00, 'Available'),
            ('Suryakumar Yadav', 'Batsman', 'BBA', '3', 'P010', 13000.00, 'Available');
        `);

        console.log('Seed data inserted successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
