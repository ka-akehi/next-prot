import { PasswordChangeForm } from '@/app/account/password/_components/PasswordChangeForm';

type PasswordChangePageParamsType = {
  redirect?: string | undefined;
};

type PasswordChangePageProps = {
  searchParams?: Promise<PasswordChangePageParamsType>;
};

export default async function PasswordChangePage({ searchParams }: PasswordChangePageProps) {
  const { redirect } = (await searchParams) ?? {};

  return <PasswordChangeForm redirectUrl={redirect} />;
}
