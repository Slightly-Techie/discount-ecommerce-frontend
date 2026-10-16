import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ImageIcon, Wallet, X } from "lucide-react";

import { adminApi, paymentsApi } from "@/lib/api";
import { formatGHS } from "@/lib/price";
import { orderDate, orderNumber } from "@/lib/orders";
import type { AdminPaymentSubmission, PaymentStatus } from "@/types/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage, Pager, useAdminList } from "./shared";

const STATUS_BADGE: Record<PaymentStatus, { variant: "shipping" | "confirmed" | "cancelled"; label: string }> = {
  submitted: { variant: "shipping", label: "Awaiting review" },
  confirmed: { variant: "confirmed", label: "Confirmed" },
  rejected: { variant: "cancelled", label: "Rejected" },
};

export function PaymentsAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentStatus>("submitted");
  const list = useAdminList<AdminPaymentSubmission>(
    ["admin", "payment-submissions", status],
    (params) => adminApi.paymentSubmissions.list({ ...params, status }),
  );
  const [confirming, setConfirming] = useState<AdminPaymentSubmission | null>(null);
  const [rejecting, setRejecting] = useState<AdminPaymentSubmission | null>(null);
  const [reason, setReason] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "payment-submissions"] });
  const confirm = useMutation({
    mutationFn: (id: string) => adminApi.paymentSubmissions.confirm(id),
    onSuccess: () => {
      toast({ title: "Payment confirmed", description: "The orders are now marked paid." });
      setConfirming(null);
      refresh();
    },
    onError: (e) => toast({ title: "Couldn't confirm", description: apiErrorMessage(e), variant: "destructive" }),
  });
  const reject = useMutation({
    mutationFn: ({ id, why }: { id: string; why: string }) => adminApi.paymentSubmissions.reject(id, why),
    onSuccess: () => {
      toast({ title: "Payment rejected", description: "The shopper has been told why." });
      setRejecting(null);
      setReason("");
      refresh();
    },
    onError: (e) => toast({ title: "Couldn't reject", description: apiErrorMessage(e), variant: "destructive" }),
  });

  const openProof = async (url: string) => {
    try {
      setProofUrl(await paymentsApi.screenshotBlobUrl(url));
    } catch (e) {
      toast({ title: "Couldn't open screenshot", description: apiErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Wallet className="h-5 w-5" aria-hidden="true" /> Payments
        </h2>
        <Tabs value={status} onValueChange={(v) => { setStatus(v as PaymentStatus); list.setPage(1); }}>
          <TabsList aria-label="Payment status">
            <TabsTrigger value="submitted">Awaiting review</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {list.isLoading ? (
        <div aria-busy="true" className="h-32 rounded-lg bg-skeleton" />
      ) : list.rows.length === 0 ? (
        <p className="rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">
          {status === "submitted" ? "Nothing to review right now." : "No payments here yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.rows.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold tabular-prices">{formatGHS(s.amount_expected)}</span>
                  <Badge variant={STATUS_BADGE[s.status].variant}>{STATUS_BADGE[s.status].label}</Badge>
                </div>
                <span>
                  Into <strong>{s.account.provider} · {s.account.account_number}</strong>
                </span>
                <span>
                  Reference <strong className="font-mono">{s.reference}</strong> · from {s.sender_name}
                  {s.sender_number ? ` (${s.sender_number})` : ""}
                </span>
                <span className="text-muted-foreground">
                  {s.user_name || s.user_email} · {s.user_email} · submitted {orderDate(s.created_at)}
                </span>
                <span className="text-muted-foreground">
                  Orders: {s.order_details.map((o) => `#${orderNumber(o.id)} (${formatGHS(o.total)}, ${o.status})`).join(", ")}
                </span>
                {s.status === "rejected" && <span className="text-destructive">Reason: {s.rejection_reason}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {s.screenshot_url && (
                  <Button variant="outline" size="sm" onClick={() => openProof(s.screenshot_url as string)}>
                    <ImageIcon aria-hidden="true" /> Screenshot
                  </Button>
                )}
                {s.status === "submitted" && (
                  <>
                    <Button size="sm" onClick={() => setConfirming(s)}>
                      <Check aria-hidden="true" /> Confirm payment
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setRejecting(s)}>
                      <X aria-hidden="true" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />

      <Dialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirming ? formatGHS(confirming.amount_expected) : ""} received?</DialogTitle>
            <DialogDescription>
              Only confirm once you can see reference {confirming?.reference} on the {confirming?.account.provider} statement.
              The orders will be marked paid and the shopper notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
            <Button onClick={() => confirming && confirm.mutate(confirming.id)} disabled={confirm.isPending}>
              {confirm.isPending ? "Confirming…" : "Yes, payment received"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(o) => { if (!o) { setRejecting(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this payment</DialogTitle>
            <DialogDescription>The shopper sees this reason and can submit their details again.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. No payment with this reference on the statement" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejecting(null); setReason(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || reject.isPending}
              onClick={() => rejecting && reject.mutate({ id: rejecting.id, why: reason.trim() })}
            >
              {reject.isPending ? "Rejecting…" : "Reject payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!proofUrl} onOpenChange={(o) => { if (!o && proofUrl) { URL.revokeObjectURL(proofUrl); setProofUrl(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment screenshot</DialogTitle>
          </DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Payment screenshot submitted by the shopper" className="max-h-[70vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
