import { redirect } from 'next/navigation';

// Spike: there is no problem list yet, so go straight to the first problem.
export default function Home() {
  redirect('/problems/express-authentication-001');
}
