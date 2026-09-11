const pool = require('../config/db');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id, full_name, enrollment_number, email, mobile, role, purse FROM users WHERE role != 'admin'");
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
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const playerId = req.params.id;

        // 1. Delete from teams
        await connection.query('DELETE FROM teams WHERE player_id=?', [playerId]);

        // 2. Delete from auction_results
        await connection.query('DELETE FROM auction_results WHERE player_id=?', [playerId]);

        // 3. Delete bids tied to the player's auctions
        const [auctions] = await connection.query('SELECT id FROM auctions WHERE player_id=?', [playerId]);
        if (auctions.length > 0) {
            const auctionIds = auctions.map(a => a.id);
            await connection.query('DELETE FROM bids WHERE auction_id IN (?)', [auctionIds]);
        }

        // 4. Delete auctions
        await connection.query('DELETE FROM auctions WHERE player_id=?', [playerId]);

        // 5. Delete player
        await connection.query('DELETE FROM players WHERE id=?', [playerId]);

        await connection.commit();
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('DELETE PLAYER ERROR:', error.message);
        res.status(500).json({ message: 'Server error', detail: error.message });
    } finally {
        connection.release();
    }
};

exports.getAuctionState = async (req, res) => {
    res.json({ message: 'Use sockets for real-time state' });
};

exports.getPlayers = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players ORDER BY created_at DESC');
        res.json({ players });
    } catch (error) {
        console.error('GET PLAYERS ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM players');
        const [[{ sold }]] = await pool.query("SELECT COUNT(*) as sold FROM players WHERE status = 'Sold'");
        const [[{ unsold }]] = await pool.query("SELECT COUNT(*) as unsold FROM players WHERE status = 'Unsold'");
        const [[{ bidders }]] = await pool.query("SELECT COUNT(*) as bidders FROM users WHERE role = 'user'");
        res.json({ totalPlayers: total, soldPlayers: sold, unsoldPlayers: unsold, activeBidders: bidders });
    } catch (error) {
        console.error('GET STATS ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAuctionHistory = async (req, res) => {
    try {
        const [history] = await pool.query(`
            SELECT ar.id, p.name as player_name, u.full_name as winner_name,
                   ar.winning_bid, ar.status, ar.completed_at
            FROM auction_results ar
            JOIN players p ON ar.player_id = p.id
            LEFT JOIN users u ON u.id = ar.winning_user_id
            ORDER BY ar.completed_at DESC
        `);
        res.json({ history });
    } catch (error) {
        console.error('GET AUCTION HISTORY ERROR:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};



