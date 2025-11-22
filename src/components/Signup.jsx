import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { registerUser } from './auth';

function Signup({ isAdmin = false }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


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

        {/* Signup Form */}
        <div className="auth-content">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h1>{isAdmin ? 'Create Admin Account' : 'Create Account'}</h1>
              <p>{isAdmin ? 'Register an administrator for the platform.' : 'Join thousands of smart investors'}</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setError('');
              if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
              }
              if (!formData.agreeToTerms) {
                setError('You must agree to the terms');
                return;
              }
              setSubmitting(true);
              const result = registerUser({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                password: formData.password,
                isAdmin: !!isAdmin
              });
              if (!result.ok) {
                setError(result.error || 'Registration failed');
                setSubmitting(false);
                return;
              }
              setTimeout(() => { navigate(isAdmin ? '/admin' : '/home'); }, 400);
            }} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                    required
                    autoFocus
                    pattern="^[A-Za-z]{2,20}$"
                    title="2-20 alphabetic characters"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                    required
                    pattern="^[A-Za-z]{2,20}$"
                    title="2-20 alphabetic characters"
                  />
                </div>
              </div>

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
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
                  title="Provide a valid email"
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
                  placeholder="Create a password"
                  required
                  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$"
                  title="Min 6 chars, at least 1 letter & 1 number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    required
                  />
                  <span className="checkmark"></span>
                  I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" className="auth-submit-btn" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button type="button" className="google-btn" onClick={()=>navigate('/google-oauth')}>
                <span className="google-icon">G</span>
                Sign up with Google
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account? 
                <Link to="/login" className="auth-link"> Sign in</Link>
              </p>
            </div>
          </div>

          <div className="auth-image">
            <div className="feature-highlight">
              <h3>Why Choose InvestPro?</h3>
              <ul>
                <li>🏆 18.2% Average Annual Returns</li>
                <li>🛡️ Bank Grade Security</li>
                <li>👥 50,000+ Happy Investors</li>
                <li>💰 Zero Commission Trading</li>
                <li>📊 Expert Portfolio Management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;