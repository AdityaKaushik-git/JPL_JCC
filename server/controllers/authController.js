const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { full_name, enrollment_number, email, mobile, password, role, player_data } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE enrollment_number = ? OR email = ?', [enrollment_number, email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User with this enrollment number or email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const finalRole = role === 'player' ? 'player' : 'user';
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.query(
                'INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
                [full_name, enrollment_number, email, mobile, password_hash, finalRole]
            );

            if (finalRole === 'player' && player_data) {
                // Insert into players table with default base price
                await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                    [full_name, player_data.playing_role, player_data.course, player_data.year, enrollment_number, 1000.00] // Default base price
                );
            }
            
            await connection.commit();
            res.status(201).json({ message: 'Registration successful' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { loginId, password } = req.body; // loginId can be email or enrollment_number
        
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? OR enrollment_number = ?', [loginId, loginId]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, role: user.role, enrollment_number: user.enrollment_number },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: user.role,
                purse: user.purse
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, enrollment_number, email, mobile, role, purse FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
