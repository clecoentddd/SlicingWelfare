// components/Navbar.jsx
import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.navLink}>
          Home
        </Link>
        <Link href="/calculation" className={styles.navLink}>
          Calculations
        </Link>
        <Link href="/resources" className={styles.navLink}>
          Resources
        </Link>
      </div>
    </nav>
  );
}
