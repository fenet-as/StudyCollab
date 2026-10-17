import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Sun, Moon, AlertTriangle, ArrowRight, Loader2, Send } from 'lucide-react';
import { loginUser, resendVerificationEmail } from '../../../api/authApi';
import { useTheme } from '../../../context/useTheme';
import { useAuthContext } from '../../../context/useAuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuthContext();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, message: '' });
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (isUnverified) setIsUnverified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUnverified(false);
    setResendStatus({ loading: false, success: false, message: '' });
    setLoading(true);

    try {
      const data = await loginUser(formData);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      if (!err.response) {
        setError('Connection timed out. Please check your internet connection or verify the backend server is running.');
      } else if (err.response.status === 401 || err.response.status === 403) {
        const msg = err.response.data?.message || '';
        if (msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('disabled')) {
          setIsUnverified(true);
          setError('Your account is not verified yet. Please check your email for the verification link.');
        } else {
          setError('The email or password you entered is incorrect.');
        }
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred during login. Please try again.');
      }
    }
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setResendStatus({ loading: true, success: false, message: '' });

    try {
      await resendVerificationEmail(formData.email.trim());
      setResendStatus({
        loading: false,
        success: true,
        message: 'A new verification link has been sent to your email.'
      });
    } catch {
      setResendStatus({
        loading: false,
        success: false,
        message: 'Failed to resend link. Please try again in a few moments.'
      });
    }
  };

  return (
    <div className={styles.authContainer}>
      <button 
        className={styles.themeToggle} 
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={styles.authCard}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <GraduationCap size={28} className={styles.logoIcon} />
          <span>StudyCollab</span>
        </div>
        
        <h1 className={styles.authTitle}>Welcome Back</h1>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={18} className={styles.errorIcon} />
            <div className={styles.errorText}>
              <p>{error}</p>
              {isUnverified && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus.loading || resendStatus.success}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontWeight: '600',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {resendStatus.loading ? (
                      <>
                        <Loader2 size={14} className={styles.spinnerIcon} /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Resend verification email
                      </>
                    )}
                  </button>
                  {resendStatus.message && (
                    <p style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                      {resendStatus.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.authSubmitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinnerIcon} />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className={styles.switchAuthText}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}