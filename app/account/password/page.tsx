import { redirect } from 'next/navigation';

export default function PasswordPage() {
  redirect('/account/password/change');
}
