import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";

interface LoginFormProps {
  redirectTo?: string;
}

function errorMessage(error: unknown): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const detail = data?.detail || data?.message;
  if (typeof detail === "string") return detail;
  return "That email and password don’t match. Check them and try again.";
}

export function LoginForm({ redirectTo = "/" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [missing, setMissing] = useState(false);
  const login = useLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMissing(true);
      return;
    }
    setMissing(false);
    login.mutate({ email: email.trim(), password, redirectTo });
  };

  const error = missing ? "Enter your email and password." : login.isError ? errorMessage(login.error) : null;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {error && (
        <div role="alert" id="login-error" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {error}
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
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error && !email.trim()}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-semibold">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-14"
            aria-invalid={!!error && !password}
            aria-describedby={error ? "login-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to GrottoMore?{" "}
        <Link to="/register" className="font-semibold text-primary hover:text-primary-strong">
          Create an account
        </Link>
      </p>
    </form>
  );
}
