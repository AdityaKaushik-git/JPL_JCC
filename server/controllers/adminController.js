const pool = require('../config/db');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, enrollment_number, email, mobile, role, purse FROM users WHERE role = "user"');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addPlayer = async (req, res) => {
    try {
        const { name, playing_role, course, year, enrollment_number, base_price } = req.body;
        await pool.query(
            'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
            [name, playing_role, course, year, enrollment_number, base_price]
        );
        res.status(201).json({ message: 'Player added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePlayer = async (req, res) => {
    try {
        const { name, playing_role, course, year, enrollment_number, base_price } = req.body;
        await pool.query(
            'UPDATE players SET name=?, playing_role=?, course=?, year=?, enrollment_number=?, base_price=? WHERE id=?',
            [name, playing_role, course, year, enrollment_number, base_price, req.params.id]
        );
        res.json({ message: 'Player updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePlayer = async (req, res) => {
    try {
        await pool.query('DELETE FROM players WHERE id=?', [req.params.id]);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAuctionState = async (req, res) => {
    // Basic state for admin
    res.json({ message: 'Use sockets for real-time state' });
};
