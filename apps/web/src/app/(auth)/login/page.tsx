'use client';

import { AuthForm } from '@/components/auth-form';
import { PageShell } from '@/components/page-shell';
import { useLanguage } from '@/providers/language-provider';

export default function Page() {
  const { t } = useLanguage();
  return (
    <PageShell title={t('login_page_title')} description={t('login_page_desc')}>
      <AuthForm />
    </PageShell>
  );
}
