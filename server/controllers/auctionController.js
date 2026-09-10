const pool = require('../config/db');

exports.getStatus = async (req, res) => {
    try {
        const [auctions] = await pool.query('SELECT * FROM auctions WHERE status IN ("Live", "Paused") ORDER BY id DESC LIMIT 1');
        if (auctions.length === 0) {
            return res.json({ status: 'Pending' });
        }
        res.json({ status: auctions[0].status, auctionId: auctions[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const [results] = await pool.query(`
            SELECT ar.*, p.name as player_name, u.full_name as user_name 
            FROM auction_results ar 
            JOIN players p ON ar.player_id = p.id 
            LEFT JOIN users u ON ar.winning_user_id = u.id
            ORDER BY ar.completed_at DESC
        `);
        res.json({ history: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
