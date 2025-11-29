import './Home.css';
import { useEffect, useState } from 'react';
import { getCurrentUser, getDemoInvestments } from './auth';
import { Link } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(getCurrentUser());
  const [demo, setDemo] = useState([]);

  useEffect(() => {
    const hero = document.querySelector('.hero-content');
    if (hero) hero.classList.add('enter');
    function onAuth() { setUser(getCurrentUser()); }
    window.addEventListener('mf_auth_change', onAuth);
    return () => window.removeEventListener('mf_auth_change', onAuth);
  }, []);

  useEffect(() => {
    if (user) setDemo(getDemoInvestments());
    else setDemo([]);
  }, [user]);

  if (user) {
    return (
      <section className="dashboard container" aria-labelledby="welcome">
        <h2 id="welcome">Welcome back, {user.firstName} 👋</h2>
        <p>Your quick investments overview</p>
        <div className="demo-grid">
          {demo.map(d => (
            <div key={d.id} className="demo-card">
              <h4>{d.name}</h4>
              <div className="demo-meta">{d.amount.toLocaleString()} • {d.date}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop: '1rem'}}>
          <Link to="/investments" className="btn-primary cta">Open Investments</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 id="hero-heading">
              Grow Your Wealth with<br />
              <span className="highlight">Smart Investing</span>
            </h1>
            <p className="hero-description">
              Start your investment journey with India's most trusted mutual fund platform. Zero commission, expert guidance, and seamless investing experience.
            </p>
            <div className="hero-buttons">
              <Link to="/login-choice" className="btn-secondary" aria-label="Login">Login</Link>
              <Link to="/register" className="btn-primary cta" aria-label="Get Started">Get Started</Link>
            </div>
            <div className="trust-indicators" role="list" aria-label="Trust Indicators">
              <div className="indicator" role="listitem">
                <span className="icon">🛡️</span>
                <span>Bank Grade Security</span>
              </div>
              <div className="indicator" role="listitem">
                <span className="icon">✅</span>
                <span>SEBI Registered</span>
              </div>
              <div className="indicator" role="listitem">
                <span className="icon">👥</span>
                <span>50,000+ Investors</span>
              </div>
            </div>
          </div>
          <aside className="hero-image" aria-label="Performance Highlight">
            <div className="image-placeholder">
              <div className="professionals-image" aria-hidden="true">
                👨‍💼 👩‍💼 👨‍💼
              </div>
              <div className="performance-card" aria-live="polite">
                <div className="performance-text">18.2%</div>
                <div className="performance-label">Avg Annual Returns</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Home;