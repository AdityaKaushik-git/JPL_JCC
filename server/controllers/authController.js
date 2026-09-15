const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { full_name, enrollment_number, email, mobile, password, role, player_data } = req.body;

        console.log('REGISTER ATTEMPT:', { full_name, enrollment_number, email, role });

        if (!full_name || !enrollment_number || !email || !mobile || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

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
                'INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, team_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [full_name, enrollment_number, email, mobile, password_hash, finalRole, req.body.team_name || null]
            );

            if (finalRole === 'player' && player_data) {
                await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                    [full_name, player_data.playing_role, player_data.course, player_data.year, enrollment_number, player_data.base_price ? Number(player_data.base_price) : 1000.00]
                );
            } else if (finalRole === 'user') {
                const [insertUserRes] = await connection.query('SELECT id FROM users WHERE enrollment_number = ?', [enrollment_number]);
                const newUserId = insertUserRes[0].id;
                const pData = player_data || { playing_role: 'All-Rounder', course: 'N/A', year: 'N/A' };
                const [insertPlayer] = await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [full_name, pData.playing_role, pData.course, pData.year, enrollment_number, 0, 'Sold']
                );
                await connection.query(
                    'INSERT INTO teams (user_id, player_id, purchase_price) VALUES (?, ?, ?)',
                    [newUserId, insertPlayer.insertId, 0]
                );
            }

            await connection.commit();
            console.log('REGISTER SUCCESS for:', email);
            res.status(201).json({ message: 'Registration successful' });
        } catch (err) {
            await connection.rollback();
            console.error('REGISTER TRANSACTION ERROR:', err.message, err.stack);
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('REGISTER ERROR:', error.message);
        console.error('REGISTER STACK:', error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { loginId, password } = req.body;

        console.log('LOGIN ATTEMPT:', loginId);

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

        console.log('LOGIN SUCCESS for:', loginId);
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
        console.error('LOGIN ERROR:', error.message);
        console.error('LOGIN STACK:', error.stack);
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            console.error('DATABASE CONNECTION FAILED â€” check environment variables on Render');
        }
        res.status(500).json({ message: 'Server error. Please try again later.' });
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
        console.error('GETME ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkEnrollment = async (req, res) => {
    try {
        const { enrollment_number } = req.query;
        if (!enrollment_number) return res.json({ taken: false });

        // Check both users table and players table
        const [userRows] = await pool.query('SELECT id FROM users WHERE enrollment_number = ?', [enrollment_number]);
        const [playerRows] = await pool.query('SELECT id FROM players WHERE enrollment_number = ?', [enrollment_number]);

        const taken = userRows.length > 0 || playerRows.length > 0;
        res.json({ taken });
    } catch (error) {
        console.error('CHECK ENROLLMENT ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

