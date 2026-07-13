import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../../api/authApi';
import styles from './Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

    // Prepare clean payload payload structure mapping to Spring Boot fields
    const registrationPayload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    console.group('🚀 [Auth Debug] Initiating Registration Request');
    console.log('Target Payload Structure:', registrationPayload);
    console.groupEnd();

    try {
      const data = await registerUser(registrationPayload);

      console.group('✅ [Auth Debug] Registration Succeeded');
      console.log('Server Response Token Received:', data.token ? 'Present' : 'Missing');
      console.log('Full Response Data:', data);
      console.groupEnd();

      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);

      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      
      console.group('❌ [Auth Debug] Registration Request Failed');
      
      if (err.response) {
        // Server responded with an error status code outside the 2xx range
        console.error('HTTP Status Code:', err.response.status);
        console.error('Server Error Data Body:', err.response.data);
        console.error('Server Error Headers:', err.response.headers);

        // Introspect common Spring Boot error field paths
        const serverErrorPayload = err.response.data;
        const targetErrorMessage = 
          serverErrorPayload?.message || 
          serverErrorPayload?.error ||
          (typeof serverErrorPayload === 'string' ? serverErrorPayload : null) ||
          'The application backend rejected this registration validation data.';

        setError(`[Server Error ${err.response.status}] ${targetErrorMessage}`);

      } else if (err.request) {
        // Request was sent but no response came back from your local server port
        console.error('No Response Received. Raw Request Instance details:', err.request);
        setError('Unable to contact server. Please verify your backend server is active at port 8080.');
      } else {
        // Something else triggered an error during axios compilation
        console.error('Axios Config/Setup Failure Message:', err.message);
        setError(`Configuration breakdown: ${err.message}`);
      }
      
      console.groupEnd();
    }
  };

  return (
    <div className={styles.authContainer}>
      <button 
        className={styles.themeToggle} 
        onClick={() => setIsDark(!isDark)}
        aria-label="Toggle dark mode"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={styles.authCard}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className={styles.logoIcon}>🎓</span> StudyCollab
        </div>
        
        <h1 className={styles.authTitle}>Get Started</h1>

        {error && (
          <div 
            className={styles.errorBanner} 
            style={{ 
              color: '#ef4444', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1rem', 
              fontSize: '0.85rem', 
              textAlign: 'left', 
              fontWeight: '500',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            ⚠️ <strong>Error Details:</strong>
            <div style={{ marginTop: '0.25rem', opacity: 0.9 }}>{error}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Full Name"
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
              placeholder="Email"
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
            {loading ? 'Registering User...' : 'Register'}
          </button>
        </form>

        <p className={styles.switchAuthText}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}