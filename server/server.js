require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Routes
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Socket.IO logic
require('./sockets/auctionSocket')(io);

// Catch-all route for HTML pages
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const allowedPages = ['login', 'register', 'dashboard', 'auction', 'my-team', 'my-bids', 'profile', 'admin'];
    
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, `../client/${page}.html`));
    } else {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Admin sub-pages
app.get('/admin/:page', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
