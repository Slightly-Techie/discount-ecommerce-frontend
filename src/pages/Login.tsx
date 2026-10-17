import { useLocation, useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";

import { Layout } from "@/components/Layout";
import { LoginForm } from "@/components/LoginForm";

// Only same-site paths are allowed as a post-login destination.
const safePath = (value: string | null | undefined) => (value && value.startsWith("/") && !value.startsWith("//") ? value : null);

export default function Login() {
  const location = useLocation();
  const [params] = useSearchParams();
  const from = safePath(params.get("next")) || safePath(location.state?.from?.pathname) || "/";
  const forCheckout = params.get("reason") === "checkout";
  const passwordSet = params.get("reason") === "password-set";

  return (
    <Layout mobileBar={{ kind: "title", title: "Sign in" }}>
      <div className="container flex max-w-md flex-col gap-6 pb-12 pt-6 lg:pt-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">Sign in</h1>
          <p className="text-[15px] text-muted-foreground">Track orders and keep your saved deals on every device.</p>
        </div>
        {passwordSet && (
          <div role="status" className="flex items-start gap-3 rounded-lg bg-accent px-4 py-3.5 text-accent-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-[15px] font-semibold">Password set. Sign in to continue.</p>
          </div>
        )}
        {forCheckout && (
          <div className="flex items-start gap-3 rounded-lg bg-accent px-4 py-3.5 text-accent-foreground">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <strong className="text-[15px]">Sign in to place your order</strong>
              <p className="text-sm">We need your account to confirm delivery. Your cart is kept.</p>
            </div>
          </div>
        )}
        <LoginForm redirectTo={from} />
      </div>
    </Layout>
  );
}
