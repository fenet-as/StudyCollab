import React from 'react';
import { Quote } from 'lucide-react';
import styles from './Testimonials.module.css';

export default function Testimonials() {
  return (
    <section id="testimonials" className={styles.testimonialsSection}>
      <h2 className={styles.sectionHeading}>Trusted by Students Everywhere</h2>
      <div className={styles.testimonialGrid}>
        <div className={styles.testimonialCard}>
          <Quote size={24} className={styles.quoteIcon} />
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
          <Quote size={24} className={styles.quoteIcon} />
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
  );
}