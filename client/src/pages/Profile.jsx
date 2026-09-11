import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
export default function Profile() {
  const { user } = useContext(AuthContext);
  return (
    <div style={{ padding: '20px' }}>
      <h2>Profile</h2>
      <div className="card">
        <p>Name: {user?.full_name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
}