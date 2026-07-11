import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/LandingPage.module.css';
import Button from '../../../components/common/Button/Button'; 

import appImg from '../../../assets/images/app.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  
  // Initialize state from localStorage or fallback to system preference
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme attributes to html root node
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className={styles.landingContainer}>
      {/* --- HEADER / NAVBAR --- */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>StudyCollab</span>
        </div>
        <nav className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          
          {/* Theme Toggle Button */}
          <button 
            className={styles.themeToggle} 
            onClick={() => setIsDark(!isDark)}
            aria-label="Toggle dark mode"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button className={styles.loginBtn} onClick={() => navigate('/login')}>Login</button>
          <Button onClick={() => navigate('/register')}>Get Started Free</Button>
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
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
              Create Your Workspace Now
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

      {/* --- CORE FEATURES SECTION --- */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.iconNotes}`}>📝</div>
          <h3>Structured Technical Notes</h3>
          <p>Ditch raw text editors. Take beautiful, real-time math and code notes using fully integrated Markdown and production-grade LaTeX blocks.</p>
          <div className={styles.featurePreviewCode}>{"$$\\oint_C \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}}$$"}</div>
        </div>

        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.iconTasks}`}>📋</div>
          <h3>Agile Task Management</h3>
          <p>Break massive syllabus milestones down into bite-sized tasks. Assign sub-tasks to group members, map target deadlines, and track pipeline progress via Kanban workflows.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={`${styles.featureIcon} ${styles.iconFiles}`}>📁</div>
          <h3>Subject-Based Filing</h3>
          <p>Stop hunting through messy chat apps for missing files. Securely upload PDFs, datasets, and presentation decks directly into nested, project-specific directories.</p>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <h2 className={styles.sectionHeading}>Trusted by Students Everywhere</h2>
        <div className={styles.testimonialGrid}>
          <div className={styles.testimonialCard}>
            <p>"Before StudyCollab, our physics group project files and notes were scattered across three different messaging apps. Having LaTeX note editing and a shared file bin in one single URL saved our semester grade."</p>
            <div className={styles.testimonialUser}>
              <div className={styles.userAvatar}>JD</div>
              <div>
                <h4>John D.</h4>
                <span>Biomedical Engineering, Junior</span>
              </div>
            </div>
          </div>
          <div className={styles.testimonialCard}>
            <p>"The ability to create real-time Kanban pipelines assigned to my lab partners made coordinating our senior thesis completely smooth. Everyone knew exactly what to build next without endless sync meetings."</p>
            <div className={styles.testimonialUser}>
              <div className={styles.userAvatar}>SK</div>
              <div>
                <h4>Sarah K.</h4>
                <span>Computer Science, Senior</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA SECTION --- */}
      <footer className={styles.footer}>
        <div className={styles.footerCta}>
          <h2>Ready to Master Your Semesters?</h2>
          <button className={styles.footerBtn} onClick={() => navigate('/register')}>Get Started Now</button>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 StudyCollab Platform. Built for developers and students.</span>
          <div className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
          </div>
        </div>
      </footer>
    </div>
  );
}