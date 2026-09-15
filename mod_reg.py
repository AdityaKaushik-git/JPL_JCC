with open('client/src/pages/Register.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add team_name to form state
code = code.replace(
    '''    full_name: '', enrollment_number: '', email: '', mobile: '',
    role: 'user', password: '', confirm_password: '',''',
    '''    full_name: '', enrollment_number: '', email: '', mobile: '', team_name: '',
    role: 'user', password: '', confirm_password: '','''
)

# Add player_data mapping for role 'user'
code = code.replace(
    "if (form.role === 'player') payload.player_data = playerData",
    "if (form.role === 'player' || form.role === 'user') payload.player_data = playerData"
)

# Replace the player details section
player_details = '''          {form.role === 'player' && (
            <div style={{ background: 'var(--primary-bg)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Player Details</h4>'''

new_player_details = '''          {form.role === 'user' && (
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input className="form-input" placeholder="Your Franchise Name" value={form.team_name} onChange={set('team_name')} required />
            </div>
          )}

          {(form.role === 'player' || form.role === 'user') && (
            <div style={{ background: 'var(--primary-bg)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{form.role === 'user' ? 'Captain Details' : 'Player Details'}</h4>'''

code = code.replace(player_details, new_player_details)

with open('client/src/pages/Register.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Register.jsx modified')
