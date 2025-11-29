import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function LoginChoice(){
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const current = localStorage.getItem('mf_current_user');
      if (current) { navigate('/home', { replace: true }); }
    } catch(e){}
  }, [navigate]);

  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h1 className="landing-title">Sign In</h1>
        <p className="landing-sub">Sign in as a User or as an Admin</p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={()=>navigate('/login')}>Sign in as User</button>
          <button className="landing-btn outline" onClick={()=>navigate('/admin-login')}>Sign in as Admin</button>
        </div>
      </div>
    </div>
  );
}
