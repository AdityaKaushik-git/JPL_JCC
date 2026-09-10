const pool = require('../config/db');

exports.getAllPlayers = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players ORDER BY status, id');
        res.json({ players });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlayerById = async (req, res) => {
    try {
        const [players] = await pool.query('SELECT * FROM players WHERE id = ?', [req.params.id]);
        if (players.length === 0) return res.status(404).json({ message: 'Player not found' });
        res.json({ player: players[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
