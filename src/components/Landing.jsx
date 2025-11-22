import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const ADMIN_EMAIL = 'admin@investpro.local';

export default function Landing(){
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to appropriate landing
    try {
      const current = localStorage.getItem('mf_current_user');
      if (current) {
        if (current.toLowerCase() === ADMIN_EMAIL) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [navigate]);

  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h1 className="landing-title">Login As</h1>
        <p className="landing-sub">Choose how you'd like to sign in</p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={()=>navigate('/login')}>User Login</button>
          <button className="landing-btn outline" onClick={()=>navigate('/admin-login')}>Admin Login</button>
        </div>
      </div>
    </div>
  );
}
