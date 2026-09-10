document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jpl_token');
    const user = JSON.parse(localStorage.getItem('jpl_user'));
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = '/login';
        return;
    }

    const socket = io({ auth: { token: token } });

    const playerList = document.getElementById('playerList');
    const noPlayerAlert = document.getElementById('noPlayerAlert');
    const activePlayerSection = document.getElementById('activePlayerSection');
    
    const auctionStatusEl = document.getElementById('auctionStatus');
    const currentPlayerName = document.getElementById('currentPlayerName');
    const currentBasePrice = document.getElementById('currentBasePrice');
    const currentBidEl = document.getElementById('currentBid');
    const highestBidderEl = document.getElementById('highestBidder');
    const timeLeftEl = document.getElementById('timeLeft');
    const bidHistoryList = document.getElementById('bidHistoryList');

    const btnPause = document.getElementById('btnPause');
    const btnResume = document.getElementById('btnResume');
    const btnSell = document.getElementById('btnSell');
    const btnUnsold = document.getElementById('btnUnsold');

    let activeAuctionId = null;

    socket.on('connect', () => {
        socket.emit('user:join');
    });

    socket.on('auction:stateUpdate', (data) => {
        if (data.status === 'Pending' || data.status === 'Completed') {
            auctionStatusEl.textContent = data.status.toUpperCase();
            auctionStatusEl.className = 'badge bg-secondary';
            noPlayerAlert.classList.remove('d-none');
            activePlayerSection.classList.add('d-none');
            activeAuctionId = null;
            loadPlayers(); // Refresh list to show updated status
            return;
        }

        activeAuctionId = data.auctionId;
        noPlayerAlert.classList.add('d-none');
        activePlayerSection.classList.remove('d-none');

        auctionStatusEl.textContent = data.status.toUpperCase();
        if (data.status === 'Live') {
            auctionStatusEl.className = 'badge bg-danger';
            btnPause.classList.remove('d-none');
            btnResume.classList.add('d-none');
        } else {
            auctionStatusEl.className = 'badge bg-warning text-dark';
            btnPause.classList.add('d-none');
            btnResume.classList.remove('d-none');
        }

        if (data.player) {
            currentPlayerName.textContent = data.player.name;
            currentBasePrice.textContent = `₹${data.player.base_price}`;
            const roleEl = document.getElementById('currentPlayerRole');
            if (roleEl) roleEl.textContent = data.player.playing_role;
        }

        currentBidEl.textContent = `₹${data.currentBid}`;
        highestBidderEl.textContent = data.highestBidderName || 'None';

        updateTimerDisplay(data.timeLeft);
        renderHistory(data.bidHistory);
    });

    socket.on('auction:timer', updateTimerDisplay);

    // When a player is reset to Available, refresh the list automatically
    socket.on('auction:playerReset', () => {
        loadPlayers();
    });

    socket.on('auction:notification', (msg) => {
        const historyList = document.getElementById('bidHistoryList');
        // Add minimal log if wanted
    });

    // Control buttons
    btnPause.addEventListener('click', () => socket.emit('admin:pauseAuction'));
    btnResume.addEventListener('click', () => socket.emit('admin:resumeAuction'));
    btnSell.addEventListener('click', () => {
        if(confirm('Are you sure you want to sell this player?')) {
            socket.emit('admin:sellPlayer');
        }
    });
    btnUnsold.addEventListener('click', () => {
        if(confirm('Mark this player as UNSOLD?')) {
            socket.emit('admin:markUnsold');
        }
    });

    async function loadStats() {
        try {
            const res = await fetchWithAuth('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('statUsers').textContent = data.users.length;
            }
        } catch(e) { console.error(e); }
    }

    async function loadPlayers() {
        try {
            const res = await fetchWithAuth('/api/players');
            const data = await res.json();
            
            playerList.innerHTML = '';
            
            let available = 0;
            let sold = 0;
            let unsold = 0;
            
            document.getElementById('totalPlayersBadge').textContent = data.players.length;

            data.players.forEach(p => {
                if(p.status === 'Available') available++;
                if(p.status === 'Sold') sold++;
                if(p.status === 'Unsold') unsold++;

                const li = document.createElement('div');
                li.className = 'list-group-item d-flex justify-content-between align-items-center border-bottom';
                
                let badgeClass = 'bg-primary';
                if(p.status === 'Sold') badgeClass = 'bg-success';
                if(p.status === 'Unsold') badgeClass = 'bg-danger';
                if(p.status === 'In Auction') badgeClass = 'bg-warning text-dark';

                li.innerHTML = `
                    <div>
                        <strong class="d-block mb-1">${p.name}</strong>
                        <div class="text-muted small">
                            <span class="badge ${badgeClass} me-2">${p.status}</span>
                            ${p.playing_role} | ₹${p.base_price}
                        </div>
                    </div>
                `;

                if (p.status === 'Available') {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-outline-primary shadow-sm';
                    btn.innerHTML = '<i class="fas fa-play"></i> Start';
                    btn.onclick = () => {
                        if(activeAuctionId) {
                            alert('An auction is already active. Complete it first.');
                            return;
                        }
                        if(confirm(`Start auction for ${p.name}?`)) {
                            socket.emit('admin:startPlayer', { playerId: p.id });
                        }
                    };
                    li.appendChild(btn);
                }

                if (p.status === 'Unsold') {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-outline-warning shadow-sm';
                    btn.innerHTML = '<i class="fas fa-redo"></i> Re-Auction';
                    btn.onclick = () => {
                        if(activeAuctionId) {
                            alert('An auction is already active. Complete it first.');
                            return;
                        }
                        if(confirm(`Re-add ${p.name} to the auction pool?`)) {
                            socket.emit('admin:reAuction', { playerId: p.id });
                        }
                    };
                    li.appendChild(btn);
                }

                playerList.appendChild(li);
            });

            
            document.getElementById('statAvailable').textContent = available;
            document.getElementById('statSold').textContent = sold;
            document.getElementById('statUnsold').textContent = unsold;

        } catch (e) {
            console.error('Error loading players', e);
        }
    }

    function updateTimerDisplay(seconds) {
        if(seconds < 0) seconds = 0;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timeLeftEl.textContent = `${m}:${s}`;
    }

    function renderHistory(history) {
        bidHistoryList.innerHTML = '';
        if (!history || history.length === 0) {
            bidHistoryList.innerHTML = '<li class="list-group-item bg-transparent text-center text-muted py-4 border-0"><i class="fas fa-history mb-2 fs-4 opacity-50"></i><br>No activity yet</li>';
            return;
        }
        history.forEach(bid => {
            const li = document.createElement('li');
            li.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center border-bottom';
            li.innerHTML = `<div><i class="fas fa-arrow-right text-success me-2"></i><strong>${bid.userName}</strong></div><span class="badge bg-success rounded-pill fs-6 shadow-sm">₹${bid.amount}</span>`;
            bidHistoryList.appendChild(li);
        });
    }

    // Initial load
    loadStats();
    loadPlayers();
});
