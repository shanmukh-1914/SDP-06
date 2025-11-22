import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function RegisterChoice(){
  const navigate = useNavigate();

  useEffect(() => {
    // if already authenticated, redirect out
    try {
      const current = localStorage.getItem('mf_current_user');
      if (current) { navigate('/home', { replace: true }); }
    } catch(e){}
  }, [navigate]);

  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h1 className="landing-title">Create Account</h1>
        <p className="landing-sub">Register as a User or as an Admin</p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={()=>navigate('/signup')}>Register as User</button>
          <button className="landing-btn outline" onClick={()=>navigate('/admin-signup')}>Register as Admin</button>
        </div>
      </div>
    </div>
  );
}
