import { AuthForm } from '@/components/auth-form';
import { PageShell } from '@/components/page-shell';
export default function Page() {
  return (
    <PageShell title="Tạo tài khoản" description="Quản lý các hành trình của bạn tại một nơi.">
      <AuthForm register />
    </PageShell>
  );
}
