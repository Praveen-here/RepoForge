import RequireAuth from '@/components/auth/RequireAuth';
import Workspace from '@/components/workspace/Workspace';

export async function generateMetadata({ params }) {
  const { problemId } = await params;
  return { title: `${problemId} · RepoForge` };
}

export default async function ProblemPage({ params }) {
  const { problemId } = await params;
  return (
    <RequireAuth>
      <Workspace problemId={problemId} />
    </RequireAuth>
  );
}
