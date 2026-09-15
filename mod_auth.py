with open('server/controllers/authController.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace INSERT INTO users
code = code.replace(
    "'INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',\n                [full_name, enrollment_number, email, mobile, password_hash, finalRole]",
    "'INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, team_name) VALUES (?, ?, ?, ?, ?, ?, ?)',\n                [full_name, enrollment_number, email, mobile, password_hash, finalRole, req.body.team_name || null]"
)

# Replace the player logic
player_logic = '''            if (finalRole === 'player' && player_data) {
                await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                    [full_name, player_data.playing_role, player_data.course, player_data.year, enrollment_number, player_data.base_price ? Number(player_data.base_price) : 1000.00]
                );
            }'''

new_player_logic = '''            if (finalRole === 'player' && player_data) {
                await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price) VALUES (?, ?, ?, ?, ?, ?)',
                    [full_name, player_data.playing_role, player_data.course, player_data.year, enrollment_number, player_data.base_price ? Number(player_data.base_price) : 1000.00]
                );
            } else if (finalRole === 'user') {
                const [insertUserRes] = await connection.query('SELECT id FROM users WHERE enrollment_number = ?', [enrollment_number]);
                const newUserId = insertUserRes[0].id;
                const pData = player_data || { playing_role: 'All-Rounder', course: 'N/A', year: 'N/A' };
                const [insertPlayer] = await connection.query(
                    'INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [full_name, pData.playing_role, pData.course, pData.year, enrollment_number, 0, 'Sold']
                );
                await connection.query(
                    'INSERT INTO teams (user_id, player_id, purchase_price) VALUES (?, ?, ?)',
                    [newUserId, insertPlayer.insertId, 0]
                );
            }'''

code = code.replace(player_logic, new_player_logic)

with open('server/controllers/authController.js', 'w', encoding='utf-8') as f:
    f.write(code)
print('authController modified')
