import { PasswordSetupForm } from '@/app/account/password/_components/PasswordSetupForm';

type PasswordSetupPageParamsType = {
  redirect?: string | undefined;
  token?: string | undefined;
  email?: string | undefined;
};

type PasswordSetupPageProps = {
  searchParams?: Promise<PasswordSetupPageParamsType>;
};

export default async function PasswordSetupPage({ searchParams }: PasswordSetupPageProps) {
  const { redirect, token, email } = (await searchParams) ?? {};

  return <PasswordSetupForm email={email} token={token} redirectUrl={redirect} />;
}
