import {
  AUTH_ERROR_MESSAGES,
  DEFAULT_AUTH_ERROR_MESSAGE,
} from "@domain/auth/auth.errors";
import {
  PASSWORD_ERROR_MESSAGES,
  PASSWORD_SUCCESS_MESSAGES,
} from "@domain/messages/error.messages";
import {
  MIN_PASSWORD_LENGTH,
  isPasswordComplex,
} from "@/helpers/password-policy.helpers";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type UsePasswordSetupViewModelParams = {
  email?: string;
  token?: string;
  redirectUrl?: string;
};

export function usePasswordSetupViewModel({
  email,
  token,
  redirectUrl,
}: UsePasswordSetupViewModelParams) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!token) {
      setError(PASSWORD_ERROR_MESSAGES.setupTokenMissing);
      return;
    }

    if (!email) {
      setError(PASSWORD_ERROR_MESSAGES.emailRequired);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_ERROR_MESSAGES.tooShort(MIN_PASSWORD_LENGTH));
      return;
    }

    if (!isPasswordComplex(password)) {
      setError(PASSWORD_ERROR_MESSAGES.complexity);
      return;
    }

    if (password !== confirmPassword) {
      setError(PASSWORD_ERROR_MESSAGES.mismatch);
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? PASSWORD_ERROR_MESSAGES.updateFailed);
        setIsSubmitting(false);
        return;
      }

      setSuccess(PASSWORD_SUCCESS_MESSAGES.updated);

      const callbackUrl = redirectUrl ?? "/bbs";
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (signInResult?.error) {
        const mappedMessage =
          AUTH_ERROR_MESSAGES[
            signInResult.error as keyof typeof AUTH_ERROR_MESSAGES
          ];
        setError(mappedMessage ?? DEFAULT_AUTH_ERROR_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      router.push(signInResult?.url ?? callbackUrl);
    } catch (err) {
      console.error("[password-setup] unexpected error", err);
      setError(PASSWORD_ERROR_MESSAGES.updateFailed);
      setIsSubmitting(false);
    }
  }, [confirmPassword, email, password, redirectUrl, router, token]);

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    isSubmitting,
    handleSubmit,
  };
}
