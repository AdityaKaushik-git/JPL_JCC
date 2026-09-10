const pool = require('../config/db');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, full_name, enrollment_number, email, mobile, role, purse FROM users WHERE role != "admin"');
        res.json({ users });
    } catch (error) {
        console.error('GET USERS ERROR:', error.message);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
};

exports.addPlayer = async (req, res) => {
    try {
        const { name, playing_role, course, year, enrollment_number, base_price } = req.body;

        console.log('ADD PLAYER BODY:', req.body);

        if (!name || !playing_role || !course || !year || !enrollment_number || !base_price) {
            return res.status(400).json({ message: 'All fields are required', received: req.body });
        }

        // Check duplicate enrollment
        const [existing] = await pool.query('SELECT id FROM players WHERE enrollment_number = ?', [enrollment_number]);
        if (existing.length > 0) {
            return res.status(400).json({ message: `Player with enrollment number "${enrollment_number}" already exists.` });
        }

        await pool.query(
            'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
            [name, playing_role, course, year, enrollment_number, Number(base_price)]
        );
        res.status(201).json({ message: 'Player added successfully' });
    } catch (error) {
        console.error('ADD PLAYER ERROR:', error.message);
        console.error('ADD PLAYER STACK:', error.stack);
        res.status(500).json({ message: 'Server error', detail: error.message });
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
        console.error('UPDATE PLAYER ERROR:', error.message);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
};

exports.deletePlayer = async (req, res) => {
    try {
        await pool.query('DELETE FROM players WHERE id=?', [req.params.id]);
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('DELETE PLAYER ERROR:', error.message);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
};

exports.getAuctionState = async (req, res) => {
    res.json({ message: 'Use sockets for real-time state' });
};
