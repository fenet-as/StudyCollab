import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Sun, Moon, AlertTriangle, ArrowRight } from 'lucide-react';
import { loginUser } from '../../../api/authApi';
import { useTheme } from '../../../context/ThemeContext';
import styles from './Auth.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await loginUser(formData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.email);
      localStorage.setItem('userId', data.id);

      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Connection timed out. Please check your internet connection or verify the backend server is running.');
      } else if (err.response.status === 403 || err.response.status === 401) {
        setError('The email or password you entered is incorrect.');
      } else {
        setError(err.response?.data?.message || 'An unexpected error occurred during login. Please try again.');
      }
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
            <div className={styles.errorText}>{error}</div>
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
              required
            />
          </div>

          <button type="submit" className={styles.authSubmitBtn}>
            <span>Login</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.switchAuthText}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}