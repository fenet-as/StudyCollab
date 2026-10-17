import React from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';
import Testimonials from '../components/Testimonials/Testimonials';
import Footer from '../components/Footer/Footer';
import { useTheme } from '../../../context/useTheme';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={styles.landingContainer}>
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}