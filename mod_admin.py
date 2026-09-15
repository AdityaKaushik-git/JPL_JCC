with open('client/src/pages/Admin.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add team_name to addForm state
code = code.replace(
    "password: '',\n    playing_role: 'Batsman'",
    "password: '', team_name: '',\n    playing_role: 'Batsman'"
)

# Add player_data mapping for role 'user'
code = code.replace(
    "if (createType === 'player') {",
    "if (createType === 'player' || createType === 'user') {"
)

# For role user, we still send playing_role, course, year. base_price is not strictly needed but sending it is fine.

player_details = '''                {createType === 'player' && (
                  <div style={{ background: 'var(--primary-bg)', padding: 'var(--card-padding, 1.5rem)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Player Details</h4>'''

new_player_details = '''                {createType === 'user' && (
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input className="form-input" value={addForm.team_name} onChange={set('team_name')} required placeholder="e.g. Chennai Super Kings" />
                  </div>
                )}

                {(createType === 'player' || createType === 'user') && (
                  <div style={{ background: 'var(--primary-bg)', padding: 'var(--card-padding, 1.5rem)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid #FFD8C4' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-dark)', fontSize: '0.9rem', textTransform: 'uppercase' }}>{createType === 'user' ? 'Captain Details' : 'Player Details'}</h4>'''

code = code.replace(player_details, new_player_details)

# If it's user, base_price doesn't need to be required or shown, but it's easier to just show it or hide it.
# Let's hide base_price if createType === 'user'
base_price_section = '''                      <div className="form-group">
                        <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Base Price (₹)</label>
                        <input className="form-input" type="number" min="1000" step="500" value={addForm.base_price} onChange={set('base_price')} required />
                      </div>'''

new_base_price_section = '''                      {createType === 'player' && (
                        <div className="form-group">
                          <label className="form-label" style={{ color: 'var(--primary-dark)' }}>Base Price (₹)</label>
                          <input className="form-input" type="number" min="1000" step="500" value={addForm.base_price} onChange={set('base_price')} required />
                        </div>
                      )}'''

code = code.replace(base_price_section, new_base_price_section)

# ensure team_name goes into payload
payload_sec = '''      const payload = {
        full_name: addForm.full_name,
        enrollment_number: addForm.enrollment_number,
        email: addForm.email,
        mobile: addForm.mobile,
        password: addForm.password,
        role: createType,
      }'''

new_payload_sec = '''      const payload = {
        full_name: addForm.full_name,
        enrollment_number: addForm.enrollment_number,
        email: addForm.email,
        mobile: addForm.mobile,
        password: addForm.password,
        role: createType,
        team_name: addForm.team_name,
      }'''
code = code.replace(payload_sec, new_payload_sec)

with open('client/src/pages/Admin.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Admin.jsx modified')
