const pool = require('../config/db');

exports.getTeam = async (req, res) => {
    try {
        const [team] = await pool.query(`
            SELECT t.*, p.name as player_name, p.playing_role 
            FROM teams t 
            JOIN players p ON t.player_id = p.id 
            WHERE t.user_id = ?
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
            SELECT b.*, p.name as player_name 
            FROM bids b 
            JOIN auctions a ON b.auction_id = a.id
            JOIN players p ON a.player_id = p.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [req.user.id]);
        res.json({ bids });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlayerProfile = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT enrollment_number FROM users WHERE id = ?', [req.user.id]);
        if(users.length === 0) return res.status(404).json({message: 'User not found'});
        
        const [players] = await pool.query('SELECT * FROM players WHERE enrollment_number = ?', [users[0].enrollment_number]);
        if(players.length === 0) return res.status(404).json({message: 'Player not found'});
        
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
            return res.status(400).json({ message: 'Base price cannot exceed 50 Lakhs (50,00,000)' });
        }

        const [users] = await pool.query('SELECT enrollment_number FROM users WHERE id = ?', [req.user.id]);
        if(users.length === 0) return res.status(404).json({message: 'User not found'});
        
        await pool.query('UPDATE players SET base_price = ? WHERE enrollment_number = ?', [base_price, users[0].enrollment_number]);
        res.json({ message: 'Base price updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
