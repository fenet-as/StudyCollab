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

      // Store the auth response tokens and attributes into browser cache memory
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      
      // ⬇️ ADD THIS LINE TO SAVE THE NEW DATABASE USER ID ON REGISTRATION ⬇️
      localStorage.setItem('userId', data.id);

      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      
      console.group('❌ [Auth Debug] Registration Request Failed');
      
      // User-friendly structural mapping
      if (err.response) {
        console.error('HTTP Status Code:', err.response.status);
        console.error('Server Error Data Body:', err.response.data);
        
        if (err.response.status === 409) {
          setError('An account with this email address already exists.');
        } else if (err.response.status === 400) {
          setError('Please check your entries. The registration data provided is invalid.');
        } else {
          setError(err.response.data?.message || 'The server could not process your account creation request right now.');
        }
      } else if (err.request) {
        console.error('No Response Received. Raw Request Instance details:', err.request);
        setError('Unable to reach the server. Please ensure your backend application is actively running.');
      } else {
        console.error('Axios Config/Setup Failure Message:', err.message);
        setError('A system setup error occurred. Please refresh and try again.');
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
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
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