import React from 'react';
import { FileText, CheckSquare, Folder } from 'lucide-react';
import styles from './Features.module.css';

export default function Features() {
  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.featureCard}>
        <div className={`${styles.featureIcon} ${styles.iconNotes}`}>
          <FileText size={24} />
        </div>
        <h3>Structured Technical Notes</h3>
        <p>Ditch raw text editors. Take beautiful, real-time math and code notes using fully integrated Markdown and production-grade LaTeX blocks.</p>
        <div className={styles.featurePreviewCode}>{"$$\\oint_C \\mathbf{B} \\cdot d\\mathbf{l} = \\mu_0 I_{\\text{enc}}$$"}</div>
      </div>

      <div className={styles.featureCard}>
        <div className={`${styles.featureIcon} ${styles.iconTasks}`}>
          <CheckSquare size={24} />
        </div>
        <h3>Agile Task Management</h3>
        <p>Break massive syllabus milestones down into bite-sized tasks. Assign sub-tasks to group members, map target deadlines, and track pipeline progress via Kanban workflows.</p>
      </div>

      <div className={styles.featureCard}>
        <div className={`${styles.featureIcon} ${styles.iconFiles}`}>
          <Folder size={24} />
        </div>
        <h3>Subject-Based Filing</h3>
        <p>Stop hunting through messy chat apps for missing files. Securely upload PDFs, datasets, and presentation decks directly into nested, project-specific directories.</p>
      </div>
    </section>
  );
}