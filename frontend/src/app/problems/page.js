import RequireAuth from '@/components/auth/RequireAuth';
import SiteHeader from '@/components/layout/SiteHeader';
import ProblemList from '@/components/problems/ProblemList';

export const metadata = { title: 'Problems · RepoForge' };

export default function ProblemsPage() {
  return (
    <RequireAuth>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
        <SiteHeader active="problems" />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <ProblemList />
        </main>
      </div>
    </RequireAuth>
  );
}
