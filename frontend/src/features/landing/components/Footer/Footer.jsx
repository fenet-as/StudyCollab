import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerCta}>
        <h2>Ready to Master Your Semesters?</h2>
        <button className={styles.footerBtn} onClick={() => navigate('/register')}>
          <span>Get Started Now</span>
          <ArrowRight size={18} />
        </button>
      </div>
      <div className={styles.footerBottom}>
        <span>© 2026 StudyCollab Platform. Built for developers and students.</span>
        <div className={styles.footerLinks}>
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
        </div>
      </div>
    </footer>
  );
}