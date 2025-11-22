import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from './auth';
import './Landing.css';

export default function AdminDashboard(){
  const navigate = useNavigate();
  const users = getAllUsers();

  function signOut(){
    try { localStorage.removeItem('mf_current_user'); } catch(e){}
    // navigate to root landing page
    navigate('/');
  }

  return (
    <div style={{padding:'2rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',maxWidth:1100,margin:'0 auto 1rem'}}>
        <h2>Admin Dashboard</h2>
        <div>
          <button className="landing-btn outline" onClick={signOut}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <section style={{background:'#fff',borderRadius:10,padding:18,boxShadow:'0 8px 24px rgba(2,6,23,0.06)'}}>
          <h3>Registered Users</h3>
          {users.length === 0 ? (
            <p>No registered users</p>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{textAlign:'left',borderBottom:'1px solid #eef2f7'}}>
                  <th style={{padding:'8px 6px'}}>Name</th>
                  <th style={{padding:'8px 6px'}}>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'10px 6px'}}>{u.firstName} {u.lastName}</td>
                    <td style={{padding:'10px 6px'}}>{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
