import { PasswordChangeForm } from '@/app/account/password/_components/PasswordChangeForm';

type PasswordChangePageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function PasswordChangePage({ searchParams }: PasswordChangePageProps) {
  const redirectParam = searchParams?.redirect;
  const redirectUrl = typeof redirectParam === 'string' ? redirectParam : undefined;

  return <PasswordChangeForm redirectUrl={redirectUrl} />;
}
