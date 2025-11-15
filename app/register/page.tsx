import RegisterForm from '@/components/register/RegisterForm';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const callbackUrl = (await searchParams)?.callbackUrl || '/bbs';

  return <RegisterForm callbackUrl={callbackUrl} />;
}
