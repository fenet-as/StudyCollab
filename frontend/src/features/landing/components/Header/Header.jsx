import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sun, Moon } from 'lucide-react';
import Button from '../../../../components/common/Button/Button';
import styles from './Header.module.css';

export default function Header({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className={styles.logoIcon}>
          <GraduationCap size={28} />
        </span>
        <span className={styles.logoText}>StudyCollab</span>
      </div>
      <nav className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#testimonials">Testimonials</a>
        
        <button 
          className={styles.themeToggle} 
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
          Login
        </button>
        <Button
          className={styles.getStartedBtn}
          onClick={() => navigate('/register')}
        >
          Get Started Free
        </Button>
      </nav>
    </header>
  );
}