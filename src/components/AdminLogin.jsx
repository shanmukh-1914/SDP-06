import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function AdminLogin(){
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ADMIN_EMAIL = 'admin@investpro.local';
  const ADMIN_PASSWORD = 'Admin123!';

  function handleSubmit(e){
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setTimeout(()=>{
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try { localStorage.setItem('mf_current_user', ADMIN_EMAIL); } catch(e){}
        try { localStorage.setItem('mf_is_admin', 'true'); localStorage.setItem('mf_admin_name', 'Administrator'); } catch(e){}
        setSubmitting(false);
        navigate('/admin');
        return;
      }
      setSubmitting(false);
      setError('Invalid admin credentials');
    }, 300);
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-content" style={{maxWidth:900}}>
          <div className="auth-form-container" style={{maxWidth:420,margin:'0 auto'}}>
            <header className="auth-header">
              <div className="logo">
                <span className="logo-icon">🛡️</span>
                <span className="logo-text">InvestPro Admin</span>
              </div>
            </header>

            <div className="auth-form-header">
              <h1>Admin Sign In</h1>
              <p>Use your admin credentials to manage the platform.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="admin-email">Email Address</label>
                <input id="admin-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label htmlFor="admin-password">Password</label>
                <input id="admin-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}

              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? 'Signing In...' : 'Sign In as Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
