import { PasswordSetupForm } from '@/app/account/password/_components/PasswordSetupForm';

type PasswordSetupPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function PasswordSetupPage({ searchParams }: PasswordSetupPageProps) {
  const redirectParam = searchParams?.redirect;
  const redirectUrl = typeof redirectParam === 'string' ? redirectParam : undefined;

  return <PasswordSetupForm redirectUrl={redirectUrl} />;
}
