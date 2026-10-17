import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiErrors";

const EXPIRED = "Invalid or expired token.";

export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get("uid");
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const reset = useMutation({
    mutationFn: (data: { uid: string; token: string; new_password: string }) => authApi.confirmPasswordReset(data),
    onSuccess: () => navigate("/login?next=/vendor&reason=password-set"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!uid || !token) return;
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    reset.mutate({ uid, token, new_password: password });
  };

  const expired = (reset.error as { response?: { data?: { detail?: string } } } | null)?.response?.data?.detail === EXPIRED;

  return (
    <Layout mobileBar={{ kind: "title", title: "Set your password" }}>
      <div className="container flex max-w-md flex-col gap-6 pb-12 pt-6 lg:pt-12">
        <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">Set your password</h1>
        {!uid || !token ? (
          <div className="flex flex-col gap-3">
            <p>This link is incomplete.</p>
            <Link to="/login" className="font-semibold text-primary hover:text-primary-strong">
              Go to sign in
            </Link>
          </div>
        ) : expired ? (
          <div className="flex flex-col gap-3">
            <p role="alert">
              This link has expired or was already used. Ask GrottoMore to resend your invite, or request a new reset link.
            </p>
            <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-strong">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {(mismatch || reset.isError) && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                {mismatch ? "Passwords don’t match" : apiErrorMessage(reset.error, "We couldn’t set your password. Try again.")}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password" className="text-sm font-semibold">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password" className="text-sm font-semibold">
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch}
              />
            </div>
            <Button type="submit" className="w-full" disabled={reset.isPending || !password || !confirm}>
              {reset.isPending ? "Saving…" : "Set password"}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
}
