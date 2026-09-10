document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = document.getElementById('loginId').value;
            const password = document.getElementById('password').value;
            const alertBox = document.getElementById('loginAlert');

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginId, password })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    localStorage.setItem('jpl_token', data.token);
                    localStorage.setItem('jpl_user', JSON.stringify(data.user));
                    
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/dashboard';
                    }
                } else {
                    showAlert(alertBox, data.message || 'Login failed', 'danger');
                }
            } catch (err) {
                showAlert(alertBox, 'Server error', 'danger');
            }
        });
    }

    if (registerForm) {
        const roleSelect = document.getElementById('role');
        const playerFields = document.getElementById('playerFields');
        
        if(roleSelect && playerFields) {
            roleSelect.addEventListener('change', (e) => {
                if(e.target.value === 'player') {
                    playerFields.classList.remove('d-none');
                } else {
                    playerFields.classList.add('d-none');
                }
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const full_name = document.getElementById('full_name').value;
            const enrollment_number = document.getElementById('enrollment_number').value;
            const email = document.getElementById('email').value;
            const mobile = document.getElementById('mobile').value;
            const role = document.getElementById('role') ? document.getElementById('role').value : 'user';
            
            let player_data = null;
            if (role === 'player') {
                player_data = {
                    playing_role: document.getElementById('playing_role').value,
                    course: document.getElementById('course').value,
                    year: document.getElementById('year').value
                };
            }

            const password = document.getElementById('password').value;
            const confirm_password = document.getElementById('confirm_password').value;
            const alertBox = document.getElementById('registerAlert');

            if (password !== confirm_password) {
                return showAlert(alertBox, 'Passwords do not match', 'danger');
            }

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name, enrollment_number, email, mobile, password, role, player_data })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    showAlert(alertBox, 'Registration successful! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showAlert(alertBox, data.message || 'Registration failed', 'danger');
                }
            } catch (err) {
                showAlert(alertBox, 'Server error', 'danger');
            }
        });
    }

    function showAlert(element, message, type) {
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.classList.remove('d-none');
    }
});
