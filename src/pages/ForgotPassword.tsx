import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiErrors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const request = useMutation({ mutationFn: (value: string) => authApi.requestPasswordReset(value) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    request.mutate(email.trim());
  };

  return (
    <Layout mobileBar={{ kind: "title", title: "Reset password", back: "/login" }}>
      <div className="container flex max-w-md flex-col gap-6 pb-12 pt-6 lg:pt-12">
        <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">Reset your password</h1>
        {request.isSuccess ? (
          <div className="flex flex-col gap-3">
            <p role="status">If that email has an account, we’ve sent a reset link.</p>
            <Link to="/login" className="font-semibold text-primary hover:text-primary-strong">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {request.isError && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                {apiErrorMessage(request.error, "We couldn’t send the reset link. Try again.")}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={request.isPending || !email.trim()}>
              {request.isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
}
