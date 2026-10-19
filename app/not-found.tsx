import Link from 'next/link';
import { Arrow } from '@/components/icons';
export default function NotFound() {
  return (
    <main id="main-content" className="not-found wrap">
      <span className="section-label">404 / A SMALL DETOUR</span>
      <h1>
        This page
        <br />
        took a wrong turn.
      </h1>
      <p>The work is still right where you left it.</p>
      <Link prefetch={false} href="/#work" className="button button-accent">
        Back to selected work <Arrow />
      </Link>
    </main>
  );
}
