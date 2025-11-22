import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, registerUser } from './auth';
import './Auth.css';

// This is a demo/local-only Google chooser. It simulates selecting a Google
// account and signing in by setting `mf_current_user`. For production use,
// integrate real Google OAuth 2.0.
export default function GoogleAuth(){
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(getAllUsers());
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function signIn(email){
    try { localStorage.setItem('mf_current_user', email); } catch(e){}
    // find user to check admin flag
    const u = accounts.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (u && u.isAdmin) navigate('/admin'); else navigate('/home');
  }

  function handleAdd(e){
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return; }
    // create a demo account (random name from localpart)
    const local = email.split('@')[0];
    const parts = local.split(/[._-]+/);
    const first = parts[0] ? parts[0].slice(0,1).toUpperCase()+parts[0].slice(1) : 'Google';
    const last = parts[1] ? parts[1].slice(0,1).toUpperCase()+parts[1].slice(1) : 'User';
    const res = registerUser({ firstName: first, lastName: last, email: email.trim(), password: Math.random().toString(36).slice(-8), isAdmin: false });
    if (!res.ok) { setError(res.error || 'Unable to create account'); return; }
    const updated = getAllUsers();
    setAccounts(updated);
    signIn(email.trim());
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-content">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h1>Sign in with Google</h1>
              <p>Select an account or add another</p>
            </div>

            <div style={{marginBottom:12}}>
              {accounts.length === 0 && <p>No accounts found. Add one below.</p>}
              {accounts.map(a => (
                <button key={a.email} className="google-choose" onClick={()=>signIn(a.email)} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 14px',margin:'6px 0'}}>
                  <strong>{a.firstName} {a.lastName}</strong>
                  <div style={{color:'#6b7280',fontSize:13}}>{a.email}</div>
                </button>
              ))}
            </div>

            {!adding ? (
              <div style={{display:'flex',gap:8}}>
                <button className="auth-submit-btn" onClick={()=>setAdding(true)}>Use another account</button>
                <button className="auth-submit-btn" onClick={()=>navigate(-1)} style={{background:'#eee',color:'#111'}}>Cancel</button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
                {error && <div className="form-error" role="alert">{error}</div>}
                <button className="auth-submit-btn" type="submit">Continue</button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
