import Link from 'next/link';
import UserMenu from '@/components/auth/UserMenu';
import Logo from '@/components/ui/Logo';
import styles from './SiteHeader.module.css';

/** Top navigation for regular pages (the workspace uses its own TopBar). */
export default function SiteHeader({ active }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/problems" className={styles.brand}>
          <Logo size={24} />
          <span>RepoForge</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/problems" className={`${styles.link} ${active === 'problems' ? styles.active : ''}`}>
            Problems
          </Link>
        </nav>
        <div className={styles.right}>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
