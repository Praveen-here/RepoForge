import RequireAuth from '@/components/auth/RequireAuth';
import SiteHeader from '@/components/layout/SiteHeader';
import ProfilePage from '@/components/profile/ProfilePage';

export async function generateMetadata({ params }) {
  const { username } = await params;
  return { title: `${username} · RepoForge Profile` };
}

export default async function UserProfilePage({ params }) {
  const { username } = await params;
  return (
    <RequireAuth>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}>
        <SiteHeader />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <ProfilePage username={username} />
        </main>
      </div>
    </RequireAuth>
  );
}
