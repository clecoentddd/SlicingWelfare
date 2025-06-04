// components/Navbar.jsx

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [activeLink, setActiveLink] = useState(null);

  const handleLinkClick = (link) => {
    setActiveLink(link);
    setTimeout(() => {
      setActiveLink(null);
    }, 1000); // Remove the active class after 1 second
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link
          href="/"
          className={`${styles.navLink} ${activeLink === 'home' ? styles.loading : ''}`}
          onClick={() => handleLinkClick('home')}
        >
          Home
        </Link>
        <Link
          href="/calculation"
          className={`${styles.navLink} ${activeLink === 'calculation' ? styles.loading : ''}`}
          onClick={() => handleLinkClick('calculation')}
        >
          Calculations
        </Link>
        <Link
          href="/resources"
          className={`${styles.navLink} ${activeLink === 'resources' ? styles.loading : ''}`}
          onClick={() => handleLinkClick('resources')}
        >
          Resources
        </Link>
        <Link
          href="/decision"
          className={`${styles.navLink} ${activeLink === 'decision' ? styles.loading : ''}`}
          onClick={() => handleLinkClick('decision')}
        >
          Decision
        </Link>
      </div>
    </nav>
  );
}
