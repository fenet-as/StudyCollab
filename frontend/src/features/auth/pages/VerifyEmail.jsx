import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Sun, Moon, CheckCircle2, AlertTriangle, Loader2, ArrowRight, Send } from 'lucide-react';
import { verifyEmailToken, resendVerificationEmail } from '../../../api/authApi';
import { useTheme } from '../../../context/ThemeContext';
import { useAuthContext } from '../../../context/useAuthContext';
import styles from './Auth.module.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuthContext();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, success: false, message: '' });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Missing token parameter.');
      return;
    }

    verifyEmailToken(token)
      .then((data) => {
        setStatus('success');
        setMessage('Your email address has been successfully verified!');
        
        if (data && data.token) {
          login(data);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      });
  }, [token]);

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendStatus({ loading: true, success: false, message: '' });

    try {
      await resendVerificationEmail(resendEmail.trim());
      setResendStatus({
        loading: false,
        success: true,
        message: 'A new verification link has been sent if an account exists for that email.'
      });
    } catch (err) {
      setResendStatus({
        loading: false,
        success: false,
        message: 'Could not send verification email. Please try again.'
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

        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Loader2 size={40} className={styles.spinnerIcon} style={{ margin: '0 auto 1rem auto' }} />
            <h1 className={styles.authTitle}>Verifying Your Email</h1>
            <p style={{ color: 'var(--text-secondary, #666)' }}>Please wait while we confirm your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', marginBottom: '1rem' }}>
              <CheckCircle2 size={40} />
            </div>
            <h1 className={styles.authTitle}>Account Verified!</h1>
            <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.5rem' }}>{message}</p>
            <button onClick={() => navigate('/dashboard')} className={styles.authSubmitBtn}>
              <span>Continue to Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '1rem' }}>
              <AlertTriangle size={40} />
            </div>
            <h1 className={styles.authTitle}>Verification Failed</h1>
            <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.5rem' }}>{message}</p>

            <form onSubmit={handleResendSubmit} className={styles.authForm} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label htmlFor="resendEmail">Request a new verification link</label>
                <input
                  type="email"
                  id="resendEmail"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resendStatus.loading || resendStatus.success}
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.authSubmitBtn}
                disabled={resendStatus.loading || resendStatus.success}
              >
                {resendStatus.loading ? (
                  <>
                    <Loader2 size={18} className={styles.spinnerIcon} />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send New Link</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>

            {resendStatus.message && (
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: resendStatus.success ? '#22c55e' : '#ef4444' }}>
                {resendStatus.message}
              </p>
            )}

            <Link to="/login" className={styles.switchAuthText} style={{ display: 'inline-block' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}