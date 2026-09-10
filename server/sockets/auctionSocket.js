const jwt = require('jsonwebtoken');
const pool = require('../config/db');

let activeAuction = {
    auctionId: null,
    player: null,
    status: 'Pending', // Pending, Live, Paused, Completed
    currentBid: 0,
    highestBidderId: null,
    highestBidderName: null,
    timeLeft: 0,
    bidHistory: [],
    timerInterval: null
};

module.exports = (io) => {
    // Authentication middleware for sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.user = decoded;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`);

        socket.on('user:join', () => {
            socket.emit('auction:stateUpdate', getSanitizedState());
        });

        socket.on('admin:startPlayer', async (data) => {
            if (socket.user.role !== 'admin') return;
            const { playerId } = data;

            try {
                // Get player details
                const [players] = await pool.query('SELECT * FROM players WHERE id = ?', [playerId]);
                if (players.length === 0) return;
                
                const player = players[0];
                
                // Create new auction entry
                const [result] = await pool.query('INSERT INTO auctions (player_id, status) VALUES (?, ?)', [playerId, 'Live']);
                const auctionId = result.insertId;

                // Update player status
                await pool.query('UPDATE players SET status = ? WHERE id = ?', ['In Auction', playerId]);

                clearInterval(activeAuction.timerInterval);
                
                activeAuction = {
                    auctionId,
                    player,
                    status: 'Live',
                    currentBid: 0,
                    highestBidderId: null,
                    highestBidderName: null,
                    timeLeft: 180, // 3 minutes default
                    bidHistory: [],
                    timerInterval: setInterval(() => handleTimer(io), 1000)
                };

                io.emit('auction:stateUpdate', getSanitizedState());
                io.emit('auction:notification', { text: `Auction started for ${player.name}`, type: 'info' });

            } catch (err) {
                console.error(err);
            }
        });

        socket.on('admin:pauseAuction', async () => {
            if (socket.user.role !== 'admin' || !activeAuction.auctionId) return;
            
            activeAuction.status = 'Paused';
            clearInterval(activeAuction.timerInterval);
            await pool.query('UPDATE auctions SET status = ? WHERE id = ?', ['Paused', activeAuction.auctionId]);
            io.emit('auction:stateUpdate', getSanitizedState());
            io.emit('auction:notification', { text: 'Auction Paused', type: 'warning' });
        });

        socket.on('admin:resumeAuction', async () => {
            if (socket.user.role !== 'admin' || !activeAuction.auctionId) return;
            
            activeAuction.status = 'Live';
            activeAuction.timerInterval = setInterval(() => handleTimer(io), 1000);
            await pool.query('UPDATE auctions SET status = ? WHERE id = ?', ['Live', activeAuction.auctionId]);
            io.emit('auction:stateUpdate', getSanitizedState());
            io.emit('auction:notification', { text: 'Auction Resumed', type: 'success' });
        });

        socket.on('user:placeBid', async (data) => {
            const auctionId = Number(data.auctionId);
            const amount = Number(data.amount);
            
            if (activeAuction.status !== 'Live' || activeAuction.auctionId !== auctionId) {
                return socket.emit('auction:notification', { text: 'Auction is not active', type: 'danger' });
            }

            if (activeAuction.timeLeft <= 0) {
                return socket.emit('auction:notification', { text: 'Time is up!', type: 'danger' });
            }

            const expectedNextBid = getNextBidAmount();
            if (amount < expectedNextBid) {
                return socket.emit('auction:notification', { text: `Bid must be at least ₹${expectedNextBid}`, type: 'danger' });
            }

            // DB Transaction
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // Lock the user row to check purse
                const [users] = await connection.query('SELECT purse, full_name FROM users WHERE id = ? FOR UPDATE', [socket.user.id]);
                const user = users[0];

                if (Number(user.purse) < amount) {
                    await connection.rollback();
                    return socket.emit('auction:notification', { text: 'Insufficient purse balance', type: 'danger' });
                }

                // Check if someone else just bid
                const [auctions] = await connection.query('SELECT current_bid FROM auctions WHERE id = ? FOR UPDATE', [auctionId]);
                if (Number(auctions[0].current_bid) >= amount) {
                    await connection.rollback();
                    return socket.emit('auction:notification', { text: 'Someone placed a higher bid', type: 'warning' });
                }

                // Record bid
                await connection.query('INSERT INTO bids (auction_id, user_id, bid_amount) VALUES (?, ?, ?)', [auctionId, socket.user.id, amount]);
                await connection.query('UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?', [amount, socket.user.id, auctionId]);

                await connection.commit();

                // Update active auction state
                activeAuction.currentBid = amount;
                activeAuction.highestBidderId = socket.user.id;
                activeAuction.highestBidderName = user.full_name;
                if (activeAuction.timeLeft < 30) {
                    activeAuction.timeLeft = 30; // Reset timer to 30s if less than 30s left
                }
                activeAuction.bidHistory.unshift({ userName: user.full_name, amount: amount });
                
                io.emit('auction:stateUpdate', getSanitizedState());
                io.emit('auction:notification', { text: `₹${amount} bid by ${user.full_name}`, type: 'success' });

            } catch (err) {
                await connection.rollback();
                console.error(err);
            } finally {
                connection.release();
            }
        });

        socket.on('admin:sellPlayer', async () => {
            if (socket.user.role !== 'admin' || !activeAuction.auctionId || activeAuction.status === 'Completed') return;

            clearInterval(activeAuction.timerInterval);

            if (!activeAuction.highestBidderId) {
                return socket.emit('auction:notification', { text: 'No bids placed. Mark as unsold.', type: 'warning' });
            }

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const amount = activeAuction.currentBid;
                const bidderId = activeAuction.highestBidderId;
                const playerId = activeAuction.player.id;

                // Deduct purse
                await connection.query('UPDATE users SET purse = purse - ? WHERE id = ?', [amount, bidderId]);
                
                // Add to team
                await connection.query('INSERT INTO teams (user_id, player_id, purchase_price) VALUES (?, ?, ?)', [bidderId, playerId, amount]);

                // Update results
                await connection.query('INSERT INTO auction_results (auction_id, player_id, status, winning_bid, winning_user_id) VALUES (?, ?, ?, ?, ?)', 
                    [activeAuction.auctionId, playerId, 'Sold', amount, bidderId]);
                
                await connection.query('UPDATE players SET status = ? WHERE id = ?', ['Sold', playerId]);
                await connection.query('UPDATE auctions SET status = ? WHERE id = ?', ['Completed', activeAuction.auctionId]);

                // Get new purse for the winner
                const [users] = await connection.query('SELECT purse, full_name FROM users WHERE id = ?', [bidderId]);
                const newPurse = users[0].purse;
                const winnerName = users[0].full_name;

                await connection.commit();

                activeAuction.status = 'Completed';
                
                // Notify everyone
                io.emit('auction:sold', {
                    playerName: activeAuction.player.name,
                    teamName: winnerName,
                    price: amount,
                    userId: bidderId
                });

                io.emit('auction:stateUpdate', getSanitizedState());

                // Send private message to update purse
                // Find socket by user id might be tricky if multiple tabs, simpler to broadcast purse update
                io.sockets.sockets.forEach((s) => {
                    if (s.user && s.user.id === bidderId) {
                        s.emit('purse:update', newPurse);
                    }
                });

            } catch (err) {
                await connection.rollback();
                console.error(err);
            } finally {
                connection.release();
            }
        });

        socket.on('admin:markUnsold', async () => {
            if (socket.user.role !== 'admin' || !activeAuction.auctionId) return;

            clearInterval(activeAuction.timerInterval);

            try {
                const playerId = activeAuction.player.id;
                await pool.query('INSERT INTO auction_results (auction_id, player_id, status) VALUES (?, ?, ?)', [activeAuction.auctionId, playerId, 'Unsold']);
                await pool.query('UPDATE players SET status = ? WHERE id = ?', ['Unsold', playerId]);
                await pool.query('UPDATE auctions SET status = ? WHERE id = ?', ['Completed', activeAuction.auctionId]);

                activeAuction.status = 'Completed';
                io.emit('auction:unsold', { playerName: activeAuction.player.name });
                io.emit('auction:stateUpdate', getSanitizedState());

            } catch (err) {
                console.error(err);
            }
        });

        // Re-auction an unsold player: reset status to Available
        socket.on('admin:reAuction', async (data) => {
            if (socket.user.role !== 'admin') return;
            const { playerId } = data;

            try {
                // Reset player status to Available
                await pool.query('UPDATE players SET status = ? WHERE id = ?', ['Available', playerId]);

                // Delete old unsold auction_results entry for this player so history is clean
                await pool.query(
                    'DELETE FROM auction_results WHERE player_id = ? AND status = ?',
                    [playerId, 'Unsold']
                );

                socket.emit('auction:notification', { text: 'Player reset to Available. You can now start their auction again!', type: 'success' });
                // Broadcast player list refresh signal
                io.emit('auction:playerReset', { playerId });

            } catch (err) {
                console.error('Re-auction error:', err);
                socket.emit('auction:notification', { text: 'Failed to reset player.', type: 'danger' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`);
        });
    });

    function handleTimer(io) {
        if (activeAuction.timeLeft > 0) {
            activeAuction.timeLeft--;
            io.emit('auction:timer', activeAuction.timeLeft);
            if (activeAuction.timeLeft === 0) {
                io.emit('auction:notification', { text: 'Time is up! Waiting for Admin...', type: 'warning' });
            }
        }
    }

    function getNextBidAmount() {
        if (!activeAuction.player) return 0;
        
        if (activeAuction.currentBid === 0) {
            return Number(activeAuction.player.base_price);
        }
        // Simple increment logic
        const cb = Number(activeAuction.currentBid);
        if (cb < 20000) return cb + 1000;
        if (cb < 50000) return cb + 2000;
        return cb + 5000;
    }

    function getSanitizedState() {
        return {
            auctionId: activeAuction.auctionId || null,
            status: activeAuction.status || 'Pending',
            player: activeAuction.player ? { ...activeAuction.player } : null,
            currentBid: activeAuction.currentBid || 0,
            highestBidderName: activeAuction.highestBidderName || null,
            timeLeft: activeAuction.timeLeft || 0,
            bidHistory: activeAuction.bidHistory || [],
            nextBid: getNextBidAmount()
        };
    }
};
