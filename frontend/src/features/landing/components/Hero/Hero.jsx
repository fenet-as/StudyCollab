import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import appImg from '../../../../assets/images/app.jpg';
import styles from './Hero.module.css';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroLeft}>
        <h1 className={styles.heroTitle}>
          Your Academic Flow,<br />Accelerated.
        </h1>
        <p className={styles.heroSubtitle}>
          The centralized workspace for serious students and research teams. Seamlessly coordinate complex group projects, manage dynamic tasks, and co-author technical notes using native Markdown and LaTeX.
        </p>
        <div className={styles.heroCtaWrapper}>
          <button className={styles.primaryCtaBtn} onClick={() => navigate('/register')}>
            <span>Create Your Workspace Now</span>
            <ArrowRight size={18} />
          </button>
          <span className={styles.ctaSubtext}>Free forever for students. No credit card required.</span>
        </div>
      </div>

      <div className={styles.heroRight}>
        <div className={styles.imageWrapper}>
          <img 
            src={appImg} 
            alt="StudyCollab Dashboard Preview" 
            className={styles.heroImage}
          />
        </div>
      </div>
    </section>
  );
}