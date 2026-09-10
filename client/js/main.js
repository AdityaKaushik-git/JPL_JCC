document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
});

function updateNavbar() {
    const token = localStorage.getItem('jpl_token');
    const user = JSON.parse(localStorage.getItem('jpl_user'));
    const navLinks = document.getElementById('nav-links');

    if (token && user && navLinks) {
        navLinks.innerHTML = `
            <li class="nav-item">
                <a class="nav-link fw-bold text-warning" href="#">${user.full_name}</a>
            </li>
            ${user.role === 'admin' ? 
                '<li class="nav-item"><a class="nav-link" href="/admin">Admin Panel</a></li>' : 
                '<li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>'
            }
            <li class="nav-item">
                <a class="nav-link" href="/auction">Live Auction</a>
            </li>
            <li class="nav-item">
                <a class="nav-link text-danger" href="#" onclick="logout()">Logout</a>
            </li>
        `;
    }
}

function logout() {
    localStorage.removeItem('jpl_token');
    localStorage.removeItem('jpl_user');
    window.location.href = '/login';
}

// Utility to handle API calls with auth token
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('jpl_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token expired or invalid
        logout();
    }
    
    return response;
}
