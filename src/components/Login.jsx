import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { loginUser } from './auth';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Inline handlers used directly in JSX per request.

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Header */}
        <header className="auth-header">
          <Link to="/home" className="logo-link">
            <div className="logo">
              <span className="logo-icon">📈</span>
              <span className="logo-text">InvestPro</span>
            </div>
          </Link>
        </header>

        {/* Login Form */}
        <div className="auth-content">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h1>Welcome Back</h1>
              <p>Sign in to your InvestPro account</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setError('');
              setSubmitting(true);
              const result = loginUser({ email: formData.email.trim(), password: formData.password });
              if (!result.ok) {
                setError(result.error || 'Login failed');
                setSubmitting(false);
                return;
              }
              setTimeout(() => navigate('/home'), 300);
            }} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button type="button" className="google-btn" onClick={()=>navigate('/google-oauth')}>
                <span className="google-icon">G</span>
                Continue with Google
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account? 
                <Link to="/signup" className="auth-link"> Sign up</Link>
              </p>
            </div>
          </div>

          <div className="auth-image">
            <div className="feature-highlight">
              <h3>Start Your Investment Journey</h3>
              <ul>
                <li>✅ Zero Commission Trading</li>
                <li>✅ Expert Guidance</li>
                <li>✅ SEBI Registered Platform</li>
                <li>✅ Bank Grade Security</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;