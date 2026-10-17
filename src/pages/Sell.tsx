import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitVendorRequest } from "@/hooks/useVendors";
import { apiErrorMessage } from "@/lib/apiErrors";

const THROTTLED = "Too many requests, please try again later.";

export default function Sell() {
  const [form, setForm] = useState({ business_name: "", contact_name: "", email: "", phone: "", sells: "", message: "" });
  const [missing, setMissing] = useState(false);
  const request = useSubmitVendorRequest();

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const required = [form.business_name, form.contact_name, form.email, form.phone, form.sells];
    if (required.some((v) => !v.trim())) {
      setMissing(true);
      return;
    }
    setMissing(false);
    request.mutate({
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      sells: form.sells.trim(),
      ...(form.message.trim() ? { message: form.message.trim() } : {}),
    });
  };

  const status = (request.error as { response?: { status?: number } } | null)?.response?.status;
  const error = missing
    ? "Fill in all the required fields."
    : request.isError
      ? status === 429
        ? THROTTLED
        : apiErrorMessage(request.error, "We couldn’t send your request. Try again.")
      : null;

  const field = (id: keyof typeof form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input id={id} value={form[id]} onChange={set(id)} aria-invalid={missing && id !== "message" && !form[id].trim()} {...props} />
    </div>
  );

  return (
    <Layout mobileBar={{ kind: "title", title: "Sell on GrottoMore" }}>
      <div className="container flex max-w-lg flex-col gap-6 pb-12 pt-6 lg:pt-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold lg:text-[30px] lg:leading-[38px]">Sell on GrottoMore</h1>
          <p className="text-[15px] text-muted-foreground">
            Tell us about your business. Our team will get in touch and set up your vendor account.
          </p>
        </div>
        {request.isSuccess ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-base font-semibold">
              Thanks, we’ll be in touch.
            </p>
            <Link to="/" className="font-semibold text-primary hover:text-primary-strong">
              Back to the shop
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
            {field("business_name", "Business name *", { autoComplete: "organization" })}
            {field("contact_name", "Your name *", { autoComplete: "name" })}
            {field("email", "Email *", { type: "email", inputMode: "email", autoComplete: "email" })}
            {field("phone", "Phone *", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
            {field("sells", "What do you sell? *")}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="message" className="text-sm font-semibold">
                Anything else (optional)
              </Label>
              <Textarea id="message" value={form.message} onChange={set("message")} rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={request.isPending}>
              {request.isPending ? "Sending…" : "Send request"}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
}
