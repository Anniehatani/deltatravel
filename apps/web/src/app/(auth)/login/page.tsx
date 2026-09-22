import { AuthForm } from '@/components/auth-form';
import { PageShell } from '@/components/page-shell';
export default function Page() {
  return (
    <PageShell title="Đăng nhập" description="Tiếp tục hành trình của bạn.">
      <AuthForm />
    </PageShell>
  );
}
