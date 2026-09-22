import { RequireAuth } from '@/components/require-auth';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
