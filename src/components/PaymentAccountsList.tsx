import { useState } from "react";
import { Check, Copy, Landmark, Smartphone } from "lucide-react";

import { formatGHS } from "@/lib/price";
import type { PaymentAccount } from "@/types/payments";

export function PaymentAccountsList({ accounts, amount }: { accounts: PaymentAccount[]; amount?: string | number }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (a: PaymentAccount) => {
    try {
      await navigator.clipboard.writeText(a.account_number);
      setCopied(a.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked: the number is still visible to copy by hand.
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {amount !== undefined && (
        <p className="text-[15px]">
          Send exactly <strong className="tabular-prices">{formatGHS(amount)}</strong> to one of these accounts, then tell us you’ve paid.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {accounts.map((a) => {
          const Icon = a.kind === "bank" ? Landmark : Smartphone;
          return (
            <li key={a.id} className="flex items-start gap-3 rounded-md border p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col text-[15px]">
                <span className="font-semibold">{a.provider}</span>
                <span>{a.account_name}</span>
                <span className="font-mono text-base tabular-prices">{a.account_number}</span>
                {a.branch && <span className="text-sm text-muted-foreground">Branch: {a.branch}</span>}
                {a.instructions && <span className="text-sm text-muted-foreground">{a.instructions}</span>}
              </div>
              <button
                type="button"
                onClick={() => copy(a)}
                aria-label={`Copy ${a.provider} number ${a.account_number}`}
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied === a.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied === a.id ? "Copied" : "Copy"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
