import AuthProvider from '@/components/auth/AuthProvider';
import '@xterm/xterm/css/xterm.css';
import './globals.css';

export const metadata = {
  title: 'RepoForge',
  description: 'Fix real bugs in real codebases.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
