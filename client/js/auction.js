document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jpl_token');
    let user = JSON.parse(localStorage.getItem('jpl_user'));

    if (!token || !user) {
        window.location.href = '/login';
        return;
    }

    // Always verify role from server to avoid stale localStorage redirects
    try {
        const meRes = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!meRes.ok) {
            localStorage.removeItem('jpl_token');
            localStorage.removeItem('jpl_user');
            window.location.href = '/login';
            return;
        }
        const meData = await meRes.json();
        user = meData.user;
        localStorage.setItem('jpl_user', JSON.stringify(user));
    } catch(e) {
        console.error('Could not verify user, using cached data');
    }

    if (user.role === 'admin') {
        window.location.href = '/admin';
        return;
    }

    // Connect to Socket.IO
    const socket = io({
        auth: {
            token: token
        }
    });

    const auctionMainStatus = document.getElementById('auctionMainStatus');
    const auctionContent = document.getElementById('auctionContent');
    const currentBidEl = document.getElementById('currentBid');
    const highestBidderEl = document.getElementById('highestBidder');
    const timeLeftEl = document.getElementById('timeLeft');
    const btnPlaceBid = document.getElementById('btnPlaceBid');
    const nextBidAmountEl = document.getElementById('nextBidAmount');
    const bidHistoryList = document.getElementById('bidHistoryList');
    const myPurseEl = document.getElementById('myPurse');
    const soldOverlay = document.getElementById('soldOverlay');

    let currentAuctionId = null;
    let nextBidVal = 0;
    let purse = Number(user.purse);

    myPurseEl.textContent = `₹${purse}`;

    socket.on('connect', () => {
        console.log('Connected to auction server');
        socket.emit('user:join');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket error:', err.message);
        showToast('Connection error: ' + err.message, 'danger');
    });

    socket.on('auction:stateUpdate', (data) => {
        // data contains: status, player, currentBid, highestBidderName, timeLeft, bidHistory, nextBid
        
        if (data.status === 'Pending' || data.status === 'Completed') {
            auctionContent.classList.add('d-none');
            auctionMainStatus.textContent = data.status === 'Pending' ? 'Waiting for Auction to Start...' : 'Auction Completed!';
            auctionMainStatus.className = 'fw-bold text-uppercase p-3 bg-secondary rounded';
            return;
        }

        auctionContent.classList.remove('d-none');
        soldOverlay.classList.add('d-none');
        
        if (data.status === 'Paused') {
            auctionMainStatus.textContent = 'AUCTION PAUSED';
            auctionMainStatus.className = 'fw-bold text-uppercase p-3 bg-warning text-dark rounded';
            btnPlaceBid.disabled = true;
        } else if (data.status === 'Live') {
            auctionMainStatus.textContent = 'AUCTION IS LIVE';
            auctionMainStatus.className = 'fw-bold text-uppercase p-3 bg-danger text-white rounded';
            currentAuctionId = data.auctionId;
        }

        // Update Player Info
        if (data.player) {
            document.getElementById('playerName').textContent = data.player.name;
            document.getElementById('playerRole').textContent = data.player.playing_role;
            document.getElementById('playerCourse').textContent = data.player.course;
            document.getElementById('playerYear').textContent = data.player.year;
            document.getElementById('playerBasePrice').textContent = `₹${data.player.base_price}`;
        }

        // Update Bids
        currentBidEl.textContent = `₹${data.currentBid}`;
        highestBidderEl.textContent = data.highestBidderName || 'None';
        
        nextBidVal = data.nextBid;
        nextBidAmountEl.textContent = `₹${nextBidVal}`;

        // Button State
        if (data.status === 'Live' && data.timeLeft > 0 && purse >= nextBidVal && data.highestBidderName !== user.full_name) {
            btnPlaceBid.disabled = false;
        } else {
            btnPlaceBid.disabled = true;
        }

        // Update Timer
        updateTimerDisplay(data.timeLeft);

        // Update History
        renderHistory(data.bidHistory);
    });

    socket.on('auction:timer', (time) => {
        updateTimerDisplay(time);
        if (time <= 0) {
            btnPlaceBid.disabled = true;
        }
    });

    socket.on('auction:notification', (msg) => {
        showToast(msg.text, msg.type || 'primary');
    });

    socket.on('auction:sold', (data) => {
        // Show sold animation
        soldOverlay.classList.remove('d-none');
        soldOverlay.classList.add('d-flex');
        document.getElementById('soldPlayerName').textContent = data.playerName;
        document.getElementById('soldTeamName').textContent = data.teamName;
        document.getElementById('soldPrice').textContent = data.price;
        
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });

        // Update local purse if it's me
        if (data.userId === user.id) {
            purse -= data.price;
            myPurseEl.textContent = `₹${purse}`;
            // update local storage
            user.purse = purse;
            localStorage.setItem('jpl_user', JSON.stringify(user));
        }

        setTimeout(() => {
            soldOverlay.classList.remove('d-flex');
            soldOverlay.classList.add('d-none');
        }, 5000);
    });

    socket.on('auction:unsold', (data) => {
        showToast(`${data.playerName} went UNSOLD`, 'warning');
    });

    socket.on('purse:update', (newPurse) => {
        purse = Number(newPurse);
        myPurseEl.textContent = `₹${purse}`;
        user.purse = purse;
        localStorage.setItem('jpl_user', JSON.stringify(user));
    });

    // Track my active bid so we can refund it if outbid
    let myActiveBid = 0;

    // Place Bid Action
    btnPlaceBid.addEventListener('click', () => {
        if (!currentAuctionId) return;
        const bidAmount = nextBidVal;

        // Instantly deduct from displayed purse
        myActiveBid = bidAmount;
        purse -= bidAmount;
        myPurseEl.textContent = `₹${purse.toLocaleString('en-IN')}`;
        btnPlaceBid.disabled = true;

        socket.emit('user:placeBid', { auctionId: currentAuctionId, amount: bidAmount });
    });

    // If the stateUpdate shows I'm no longer the highest bidder, refund my previous bid
    socket.on('auction:stateUpdate', (data) => {
        if (myActiveBid > 0 && data.highestBidderName !== user.full_name) {
            // I was outbid — restore my purse display
            purse += myActiveBid;
            myActiveBid = 0;
            myPurseEl.textContent = `₹${purse.toLocaleString('en-IN')}`;
        }
    });


    function updateTimerDisplay(seconds) {
        if (seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timeLeftEl.textContent = `${m}:${s}`;
    }

    function renderHistory(history) {
        bidHistoryList.innerHTML = '';
        if (!history || history.length === 0) {
            bidHistoryList.innerHTML = '<li class="list-group-item bg-secondary text-light text-center text-muted">No bids yet</li>';
            return;
        }

        history.forEach(bid => {
            const li = document.createElement('li');
            li.className = 'list-group-item bg-secondary text-light d-flex justify-content-between align-items-center bid-history-item border-dark';
            li.innerHTML = `
                <span>${bid.userName}</span>
                <span class="badge bg-success rounded-pill">₹${bid.amount}</span>
            `;
            bidHistoryList.appendChild(li);
        });
    }

    function showToast(message, type) {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastMessage');
        toastBody.textContent = message;
        
        toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
});
