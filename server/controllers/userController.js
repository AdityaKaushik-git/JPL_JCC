const pool = require('../config/db');

exports.getTeam = async (req, res) => {
    try {
        const [team] = await pool.query(`
            SELECT t.*, p.name as player_name, p.playing_role, p.course, p.year
            FROM teams t
            JOIN players p ON t.player_id = p.id
            WHERE t.user_id = ?
            ORDER BY t.purchased_at DESC
        `, [req.user.id]);
        res.json({ team });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBids = async (req, res) => {
    try {
        const [bids] = await pool.query(`
            SELECT b.*, p.name as player_name,
                   CASE WHEN ar.winning_user_id = b.user_id THEN 'Won' ELSE 'Outbid' END as status
            FROM bids b
            JOIN auctions a ON b.auction_id = a.id
            JOIN players p ON a.player_id = p.id
            LEFT JOIN auction_results ar ON ar.auction_id = b.auction_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [req.user.id]);
        res.json({ bids });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, full_name, enrollment_number, email, mobile, role, purse, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { full_name, mobile } = req.body;
        await pool.query(
            'UPDATE users SET full_name = ?, mobile = ? WHERE id = ?',
            [full_name, mobile, req.user.id]
        );
        const [users] = await pool.query(
            'SELECT id, full_name, enrollment_number, email, mobile, role, purse FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json({ user: users[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'user') {
            const [userRows] = await pool.query('SELECT purse FROM users WHERE id = ?', [userId]);
            const [teamRows] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(purchase_price), 0) as spent FROM teams WHERE user_id = ?', [userId]);
            const [recentBids] = await pool.query(`
                SELECT b.bid_amount, b.created_at, p.name as player_name,
                       CASE WHEN ar.winning_user_id = b.user_id THEN 'Won' ELSE 'Outbid' END as status
                FROM bids b
                JOIN auctions a ON b.auction_id = a.id
                JOIN players p ON a.player_id = p.id
                LEFT JOIN auction_results ar ON ar.auction_id = b.auction_id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC LIMIT 5
            `, [userId]);

            res.json({
                purse: userRows[0].purse,
                playersBought: teamRows[0].count,
                totalSpent: teamRows[0].spent,
                recentBids
            });
        } else if (role === 'player') {
            const [userRows] = await pool.query('SELECT enrollment_number FROM users WHERE id = ?', [userId]);
            const [playerRows] = await pool.query(`
                SELECT p.*, ar.status as auction_status, u.full_name as bought_by_name, ar.winning_bid
                FROM players p
                LEFT JOIN auction_results ar ON ar.player_id = p.id AND ar.status = 'Sold'
                LEFT JOIN users u ON u.id = ar.winning_user_id
                WHERE p.enrollment_number = ?
            `, [userRows[0].enrollment_number]);
            res.json({ player: playerRows[0] || null });
        } else {
            res.json({});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlayerProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT enrollment_number FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        const [players] = await pool.query('SELECT * FROM players WHERE enrollment_number = ?', [users[0].enrollment_number]);
        if (players.length === 0) return res.status(404).json({ message: 'Player not found' });
        res.json({ player: players[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePlayerProfile = async (req, res) => {
    try {
        const { base_price } = req.body;
        if (Number(base_price) > 5000000) {
            return res.status(400).json({ message: 'Base price cannot exceed 50 Lakhs' });
        }
        const [users] = await pool.query('SELECT enrollment_number FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        await pool.query('UPDATE players SET base_price = ? WHERE enrollment_number = ?', [base_price, users[0].enrollment_number]);
        res.json({ message: 'Base price updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
