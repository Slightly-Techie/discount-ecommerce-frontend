import { useSearchParams, Link } from "react-router-dom";
import { ChevronRight, Store, User } from "lucide-react";

import { Layout } from "@/components/Layout";
import { RegisterForm } from "@/components/RegisterForm";
import { VendorRegisterForm } from "@/components/VendorRegisterForm";

type RoleChoice = "customer" | "vendor" | null;

export default function Register() {
  const [params, setParams] = useSearchParams();
  const as = params.get("as");
  const role: RoleChoice = as === "vendor" || as === "customer" ? as : null;
  const setRole = (next: RoleChoice) => setParams(next ? { as: next } : {});

  const title = role === "vendor" ? "Register as a vendor" : role === "customer" ? "Create your account" : "Create an account";

  return (
    <Layout mobileBar={{ kind: "title", title, back: role ? "/register" : undefined }}>
      <div className="container flex max-w-lg flex-col gap-6 pb-12 pt-6 lg:pt-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">{title}</h1>
          <p className="text-[15px] text-muted-foreground">
            {role === "vendor"
              ? "List your deals on GrottoMore. Your account becomes active after our team approves it."
              : role === "customer"
                ? "Save deals across devices and track your orders."
                : "Shop deals as a customer, or list your business’s deals as a vendor."}
          </p>
        </div>

        {role === null ? (
          <>
            <ul className="flex flex-col gap-3">
              {[
                { value: "customer" as const, icon: User, label: "I’m shopping", note: "Save deals and track your orders" },
                { value: "vendor" as const, icon: Store, label: "I’m a vendor", note: "List deals for your business · approval required" },
              ].map(({ value, icon: Icon, label, note }) => (
                <li key={value}>
                  <button
                    type="button"
                    onClick={() => setRole(value)}
                    className="flex w-full items-center gap-4 rounded-lg border p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-base font-semibold">{label}</span>
                      <span className="text-sm text-muted-foreground">{note}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:text-primary-strong">
                Sign in
              </Link>
            </p>
          </>
        ) : role === "customer" ? (
          <RegisterForm embedded />
        ) : (
          <VendorRegisterForm />
        )}
      </div>
    </Layout>
  );
}
