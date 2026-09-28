'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from './AuthProvider';

/** Shows its children only to signed-in users; sends everyone else to /login and back afterwards. */
export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner size={22} color="var(--text-muted)" />
      </div>
    );
  }

  return children;
}
