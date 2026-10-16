import { FormEvent, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentsApi } from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiErrors";
import { accountLine, screenshotProblem } from "@/lib/payments";
import type { PaymentAccount, PaymentSubmission } from "@/types/payments";

type Target = { checkoutGroup: string } | { orderIds: string[] };

interface Props {
  accounts: PaymentAccount[];
  target: Target;
  defaultSenderName?: string;
  onSubmitted: (submission: PaymentSubmission) => void;
}

export function PaymentProofForm({ accounts, target, defaultSenderName = "", onSubmitted }: Props) {
  const [account, setAccount] = useState(accounts.length === 1 ? accounts[0].id : "");
  const [reference, setReference] = useState("");
  const [senderName, setSenderName] = useState(defaultSenderName);
  const [senderNumber, setSenderNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickFile = (f: File | null) => {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      const problem = screenshotProblem(f);
      if (problem) {
        setFile(null);
        setPreview(null);
        setError(problem);
        return;
      }
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!account || !reference.trim() || !senderName.trim()) {
      setError("Choose the account you paid into and enter the reference and sender name.");
      return;
    }
    const form = new FormData();
    if ("checkoutGroup" in target) form.append("checkout_group", target.checkoutGroup);
    else target.orderIds.forEach((id) => form.append("order_ids", id));
    form.append("account", account);
    form.append("reference", reference.trim());
    form.append("sender_name", senderName.trim());
    if (senderNumber.trim()) form.append("sender_number", senderNumber.trim());
    if (file) form.append("screenshot", file);
    setSending(true);
    setError(null);
    try {
      onSubmitted(await paymentsApi.submit(form));
    } catch (err) {
      setError(apiErrorMessage(err, "We couldn't send your payment details. Check your connection and try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pay-account">Account you paid into</Label>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger id="pay-account" className="h-12 text-base">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{accountLine(a)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pay-reference">Transaction ID or reference</Label>
        <Input id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-sender">Sender name</Label>
          <Input id="pay-sender" value={senderName} onChange={(e) => setSenderName(e.target.value)} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pay-number">Sender number (optional)</Label>
          <Input id="pay-number" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} inputMode="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pay-screenshot">Screenshot (optional)</Label>
        <Input
          id="pay-screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="h-auto py-2.5"
        />
        <span className="text-[13px] text-muted-foreground">JPEG, PNG or WebP, up to 5 MB.</span>
        {preview && <img src={preview} alt="Screenshot preview" className="mt-1 max-h-48 w-auto self-start rounded-md border object-contain" />}
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive-subtle p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
      <Button type="submit" variant="deal" disabled={sending}>
        {sending ? "Sending…" : "I’ve paid"}
      </Button>
    </form>
  );
}
