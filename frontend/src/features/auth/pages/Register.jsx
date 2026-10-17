import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Sun, Moon, AlertTriangle, Loader2, ArrowRight, Mail, Send } from 'lucide-react';
import { registerUser, resendVerificationEmail } from '../../../api/authApi';
import { useTheme } from '../../../context/useTheme';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, message: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (fullName.trim().length < 2) {
      setError('Full Name must be at least 2 characters long.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const registrationPayload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    try {
      await registerUser(registrationPayload);
      setRegisteredEmail(registrationPayload.email);
      setIsSubmitted(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response) {
        if (err.response.status === 409) {
          setError('An account with this email address already exists.');
        } else if (err.response.status === 400) {
          setError('Please check your entries. The registration data provided is invalid.');
        } else {
          setError(err.response.data?.message || 'The server could not process your account creation request right now.');
        }
      } else if (err.request) {
        setError('Unable to reach the server. Please ensure your backend application is actively running.');
      } else {
        setError('A system setup error occurred. Please refresh and try again.');
      }
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendStatus({ loading: true, success: false, message: '' });

    try {
      await resendVerificationEmail(registeredEmail);
      setResendStatus({
        loading: false,
        success: true,
        message: 'A new verification email has been sent.'
      });
    } catch {
      setResendStatus({
        loading: false,
        success: false,
        message: 'Failed to resend. Please try again shortly.'
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

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', marginBottom: '1rem' }}>
              <Mail size={36} />
            </div>
            <h1 className={styles.authTitle}>Check Your Inbox</h1>
            <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              We sent a verification link to <strong>{registeredEmail}</strong>. Please click the link in your email to activate your account.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus.loading || resendStatus.success}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color, #4F46E5)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {resendStatus.loading ? (
                  <>
                    <Loader2 size={16} className={styles.spinnerIcon} /> Sending new link...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Didn't get the email? Resend
                  </>
                )}
              </button>
              {resendStatus.message && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: resendStatus.success ? '#22c55e' : '#ef4444' }}>
                  {resendStatus.message}
                </p>
              )}
            </div>

            <Link to="/login" className={styles.authSubmitBtn} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span>Go to Login</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.authTitle}>Get Started</h1>

            {error && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={18} className={styles.errorIcon} />
                <div className={styles.errorText}>{error}</div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
              <div className={styles.inputGroup}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

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
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className={styles.authSubmitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className={styles.spinnerIcon} />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className={styles.switchAuthText}>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}