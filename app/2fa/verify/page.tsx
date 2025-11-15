import TwoFAVerifyForm from '@/components/2fa/verify/TwoFAVerifyForm';

export default async function TwoFAVerifyPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const callbackUrl = (await searchParams)?.callbackUrl || '/bbs';

  return <TwoFAVerifyForm callbackUrl={callbackUrl} />;
}
