import Workspace from '@/components/workspace/Workspace';

export async function generateMetadata({ params }) {
  const { problemId } = await params;
  return { title: `${problemId} · RepoForge` };
}

export default async function ProblemPage({ params }) {
  const { problemId } = await params;
  return <Workspace problemId={problemId} />;
}
