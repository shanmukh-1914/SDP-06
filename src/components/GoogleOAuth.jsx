import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, getAllUsers } from './auth';

// Lightweight JWT parse helper to avoid an external dependency.
function parseJwt (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Uses Google Identity Services to show the real Google account chooser.
// Requires VITE_GOOGLE_CLIENT_ID set in environment.
export default function GoogleOAuth(){
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID not set');
      return;
    }

    // Wait for the global google object (script included in index.html)
    if (!window.google || !window.google.accounts) {
      console.error('Google Identity Services script not loaded');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      ux_mode: 'popup'
    });

    // Render a Google button (optional) or prompt directly
    const container = document.getElementById('g_id_button_container');
    if (container) {
      window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
    }

    // Prompt the chooser immediately (optional) — it will show the account chooser popup
    window.google.accounts.id.prompt();

    // cleanup
    return () => {
      try { window.google.accounts.id.cancel(); } catch(e){}
    };
  }, []);

  function handleCredentialResponse(response) {
    // response.credential is a JWT containing the user's info
    try {
      const payload = parseJwt(response.credential);
      if (!payload) throw new Error('Invalid JWT');
      const email = payload.email;
      const given = payload.given_name || '';
      const family = payload.family_name || '';

      // If user not registered, create a new account (demo-only)
      const users = getAllUsers();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        // Create with a random password since OAuth will be used
        registerUser({ firstName: given || 'Google', lastName: family || 'User', email, password: Math.random().toString(36).slice(-8), isAdmin: false });
      }

      // set current user and navigate
      try { localStorage.setItem('mf_current_user', email); } catch(e){}
      // if admin, navigate to admin
      const u = getAllUsers().find(x => x.email.toLowerCase() === email.toLowerCase());
      if (u && u.isAdmin) navigate('/admin'); else navigate('/home');
    } catch (err) {
      console.error('Failed to decode credential', err);
    }
  }

  return (
    <div style={{padding:'2rem'}}>
      <div style={{maxWidth:480,margin:'0 auto'}}>
        <h2>Sign in with Google</h2>
        <p>Choose your Google account from the browser prompt. If you want to sign in with a different account, use the button below.</p>
        <div id="g_id_button_container" style={{marginTop:12}}></div>
        <p style={{marginTop:10,fontSize:13,color:'#6b7280'}}>This uses Google Identity Services client. For production, validate the ID token server-side.</p>
      </div>
    </div>
  );
}
