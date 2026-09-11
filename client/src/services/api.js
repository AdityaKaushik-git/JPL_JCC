const BASE = '/api'

function getHeaders() {
  const token = localStorage.getItem('jpl_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, { headers: getHeaders(), ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const api = {
  login:             (body) => request('/auth/login',           { method: 'POST', body: JSON.stringify(body) }),
  register:          (body) => request('/auth/register',        { method: 'POST', body: JSON.stringify(body) }),
  getMe:             ()     => request('/auth/me'),
  getPlayers:        ()     => request('/players'),
  getMyTeam:         ()     => request('/users/my-team'),
  getMyBids:         ()     => request('/users/my-bids'),
  getProfile:        ()     => request('/users/profile'),
  updateProfile:     (body) => request('/users/profile',        { method: 'PUT',  body: JSON.stringify(body) }),
  getDashboard:      ()     => request('/users/dashboard'),
  getAdminUsers:     ()     => request('/admin/users'),
  getAdminPlayers:   ()     => request('/admin/players'),
  getAuctionHistory: ()     => request('/admin/auction-history'),
  getAdminStats:     ()     => request('/admin/stats'),
  addPlayer:         (body) => request('/admin/players',        { method: 'POST', body: JSON.stringify(body) }),
  deletePlayer:      (id)   => request('/admin/players/' + id,  { method: 'DELETE' }),
}



