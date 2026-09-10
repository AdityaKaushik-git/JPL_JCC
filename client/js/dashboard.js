document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('jpl_user'));
    const token = localStorage.getItem('jpl_token');

    if (!token || !user) {
        window.location.href = '/login';
        return;
    }

    if (user.role === 'admin') {
        window.location.href = '/admin';
        return;
    }

    document.getElementById('userName').textContent = user.full_name;

    let freshUser = user; // fallback to cached user

    try {
        // Fetch fresh user data
        const res = await fetchWithAuth('/api/auth/me');
        if (res.ok) {
            const data = await res.json();
            freshUser = data.user;
            document.getElementById('userEnrollment').textContent = freshUser.enrollment_number;
            document.getElementById('availablePurse').textContent = `₹${freshUser.purse}`;
            localStorage.setItem('jpl_user', JSON.stringify(freshUser));
        }

        // Fetch team summary
        const teamRes = await fetchWithAuth('/api/users/team');
        if (teamRes.ok) {
            const teamData = await teamRes.json();
            document.getElementById('playersPurchased').textContent = teamData.team.length;
            const spent = teamData.team.reduce((acc, curr) => acc + Number(curr.purchase_price), 0);
            document.getElementById('amountSpent').textContent = `₹${spent}`;
        }

        // Fetch auction status (public, no auth needed)
        const auctionRes = await fetch('/api/auction/status');
        if (auctionRes.ok) {
            const auctionData = await auctionRes.json();
            const statusEl = document.getElementById('auctionStatus');

            if (auctionData.status === 'Live') {
                statusEl.innerHTML = '<span class="live-indicator"></span> AUCTION IS LIVE';
                statusEl.className = 'text-danger mb-4 fw-bold';
            } else if (auctionData.status === 'Paused') {
                statusEl.textContent = 'AUCTION PAUSED';
                statusEl.className = 'text-warning mb-4 fw-bold';
            } else if (auctionData.status === 'Completed') {
                statusEl.textContent = 'AUCTION COMPLETED';
                statusEl.className = 'text-success mb-4 fw-bold';
            } else {
                statusEl.textContent = 'AUCTION NOT STARTED';
                statusEl.className = 'text-secondary mb-4 fw-bold';
            }
        }

        // Handle Player Role view
        if (freshUser.role === 'player') {
            document.getElementById('playerDashboardView').classList.remove('d-none');

            const playerRes = await fetchWithAuth('/api/users/player-profile');
            if (playerRes.ok) {
                const playerData = await playerRes.json();
                document.getElementById('myBasePrice').value = playerData.player.base_price;
            }

            document.getElementById('updateBasePriceForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPrice = document.getElementById('myBasePrice').value;
                const alertBox = document.getElementById('priceUpdateAlert');
                try {
                    const updateRes = await fetchWithAuth('/api/users/player-profile', {
                        method: 'PUT',
                        body: JSON.stringify({ base_price: newPrice })
                    });
                    if (updateRes.ok) {
                        alertBox.textContent = 'Bidding Amount updated successfully!';
                        alertBox.className = 'alert alert-success mt-3';
                    } else {
                        const errData = await updateRes.json();
                        alertBox.textContent = errData.message || 'Failed to update amount.';
                        alertBox.className = 'alert alert-danger mt-3';
                    }
                    alertBox.classList.remove('d-none');
                } catch (err) {
                    alertBox.textContent = 'Server Error';
                    alertBox.className = 'alert alert-danger mt-3';
                    alertBox.classList.remove('d-none');
                }
            });
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
});
