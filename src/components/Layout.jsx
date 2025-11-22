import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser } from './auth';
import { useState, useEffect } from 'react';

function Layout({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser(getCurrentUser());
    function handleStorage(e) {
      if (e.key === 'mf_current_user' || e.key === 'mf_users') {
        setUser(getCurrentUser());
      }
    }
    function handleAuthChange() { setUser(getCurrentUser()); }
    window.addEventListener('storage', handleStorage);
    window.addEventListener('mf_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mf_auth_change', handleAuthChange);
    };
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    // After logout, send users back to the landing (login-as) page
    navigate('/');
  };

  const location = useLocation();

  const authPages = ['/login','/signup','/register','/admin-signup','/admin-login'];
  const showAuthButtons = !user && !authPages.includes(location.pathname);

  return (
    <div className="app">
      <header className="header" role="banner">
        <div className="container">
          <div className="nav-brand">
            <Link to="/home" className="logo" aria-label="InvestPro Home">
              <span className="logo-icon">📈</span>
              <span className="logo-text">InvestPro</span>
            </Link>
            <span className="sebi-badge">SEBI Registered</span>
          </div>
          <nav className="nav-menu" aria-label="Primary Navigation">
            <Link to="/home">Home</Link>
            <Link to="/investments">Investments</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/support">Support</Link>
          </nav>
          <div className="header-buttons">
            {user ? (
              <>
                <span className="welcome-text">Hi, {user.firstName}</span>
                <button onClick={handleLogout} className="login-btn" style={{border:'1px solid #22c55e'}}>Logout</button>
              </>
            ) : (
              showAuthButtons ? (
                <>
                  <Link to="/login" className="login-btn">Login</Link>
                  <Link to="/register" className="get-started-btn">Get Started</Link>
                </>
              ) : null
            )}
          </div>
        </div>
      </header>
      <main role="main">{children}</main>
      <footer className="site-footer" role="contentinfo">
        <div className="container">
          <small>&copy; {new Date().getFullYear()} InvestPro Platform</small>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
