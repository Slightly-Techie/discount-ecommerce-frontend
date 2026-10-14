import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Ban, CheckCircle2, Eye, Loader2, Pencil, Store, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useVendorAction, vendorKeys } from "@/hooks/useVendors";
import { adminApi, vendorsApi } from "@/lib/api";
import { Pager, SearchBox, apiErrorMessage, useAdminList } from "@/components/admin/shared";
import type { AdminVendor, Vendor, VendorUpdatePayload } from "@/types";

const statusVariant = (status: Vendor["status"]) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    case "suspended":
      return "outline";
    default:
      return "outline";
  }
};

const ownerName = (v: AdminVendor) => {
  const o = v.owners?.[0];
  if (!o) return null;
  return `${o.first_name} ${o.last_name}`.trim() || o.email;
};

interface VendorManagerProps {
  /** Vendor to open in the details dialog (e.g. from a notification) */
  focusVendorId?: string | null;
  onFocusHandled?: () => void;
}

export function VendorManager({ focusVendorId, onFocusHandled }: VendorManagerProps = {}) {
  const [statusFilter, setStatusFilter] = useState<"all" | Vendor["status"]>("all");
  const list = useAdminList<AdminVendor>(
    [...vendorKeys.list(), "admin"],
    adminApi.getVendors,
    statusFilter === "all" ? {} : { status: statusFilter }
  );

  const approve = useVendorAction("approve");
  const reject = useVendorAction("reject");
  const suspend = useVendorAction("suspend");
  const busy = approve.isPending || reject.isPending || suspend.isPending;

  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminVendor | null>(null);
  const [rejecting, setRejecting] = useState<AdminVendor | null>(null);
  const [suspending, setSuspending] = useState<AdminVendor | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (focusVendorId) {
      setDetailId(focusVendorId);
      onFocusHandled?.();
    }
  }, [focusVendorId, onFocusHandled]);

  const renderActions = (v: AdminVendor, size: "sm" | "default" = "sm") => (
    <>
      {v.status === "pending" && (
        <>
          <Button size={size} disabled={busy} onClick={() => approve.mutate({ id: v.id, name: v.name })}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size={size}
            variant="outline"
            disabled={busy}
            onClick={() => {
              setReason("");
              setRejecting(v);
            }}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </>
      )}
      {v.status === "approved" && (
        <Button size={size} variant="outline" disabled={busy} onClick={() => setSuspending(v)}>
          <Ban className="h-4 w-4 mr-1" />
          Suspend
        </Button>
      )}
      {(v.status === "rejected" || v.status === "suspended") && (
        <Button
          size={size}
          variant="outline"
          disabled={busy}
          onClick={() => approve.mutate({ id: v.id, name: v.name })}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Re-approve
        </Button>
      )}
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Vendor Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search by vendor name or slug…" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              list.setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading vendors…</span>
          </div>
        ) : list.error ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-destructive">Failed to load vendors.</p>
            <Button onClick={() => list.refetch()}>Try again</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.rows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No vendors match your filters.</div>
            ) : (
              list.rows.map((v) => (
                <div
                  key={v.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    v.status === "pending" ? "border-amber-300 bg-amber-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{v.name || v.slug || "Unnamed vendor"}</p>
                        <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
                      </div>
                      {ownerName(v) && (
                        <p className="text-sm text-muted-foreground">
                          Applicant: {ownerName(v)} · {v.owners[0].email}
                        </p>
                      )}
                      {v.business_email && (
                        <p className="text-xs text-muted-foreground">Business email: {v.business_email}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Registered {format(new Date(v.created_at), "PPP")}
                      </p>
                      {v.rejection_reason && v.status === "rejected" && (
                        <p className="text-xs text-destructive mt-1">Rejection reason: {v.rejection_reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="icon" variant="ghost" aria-label="View" onClick={() => setDetailId(v.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(v)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {renderActions(v)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />
      </CardContent>

      <VendorDetailDialog
        vendorId={detailId}
        onClose={() => setDetailId(null)}
        renderActions={(v) => renderActions(v, "default")}
      />

      <VendorEditDialog vendor={editing} onClose={() => setEditing(null)} />

      {/* Reject with reason */}
      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.name}?</DialogTitle>
            <DialogDescription>
              The applicant will be notified. The reason is shown on their vendor dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Business details could not be verified"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reject.isPending}
              onClick={() =>
                rejecting &&
                reject.mutate(
                  { id: rejecting.id, name: rejecting.name, reason },
                  { onSuccess: () => setRejecting(null) }
                )
              }
            >
              {reject.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Reject vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation */}
      <Dialog open={!!suspending} onOpenChange={(open) => !open && setSuspending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspending?.name}?</DialogTitle>
            <DialogDescription>
              The vendor loses access to product management until re-approved. They will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspending(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={suspend.isPending}
              onClick={() =>
                suspending &&
                suspend.mutate(
                  { id: suspending.id, name: suspending.name },
                  { onSuccess: () => setSuspending(null) }
                )
              }
            >
              Suspend vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function VendorDetailDialog({
  vendorId,
  onClose,
  renderActions,
}: {
  vendorId: string | null;
  onClose: () => void;
  renderActions: (v: AdminVendor) => JSX.Element;
}) {
  const { data: vendor, isLoading } = useQuery({
    queryKey: [...vendorKeys.detail(vendorId ?? ""), "admin"],
    queryFn: () => adminApi.getVendor(vendorId!),
    enabled: !!vendorId,
  });

  const row = (label: string, value?: string | null) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );

  return (
    <Dialog open={!!vendorId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {vendor?.name ?? "Vendor"}
            {vendor && <Badge variant={statusVariant(vendor.status)}>{vendor.status}</Badge>}
          </DialogTitle>
          <DialogDescription>Vendor application details</DialogDescription>
        </DialogHeader>
        {isLoading || !vendor ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            <div className="pb-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Applicant</p>
              {vendor.owners.length === 0 && <p className="text-sm text-muted-foreground">No linked user.</p>}
              {vendor.owners.map((o) => (
                <div key={o.id}>
                  {row("Name", `${o.first_name} ${o.last_name}`.trim())}
                  {row("Email", o.email)}
                  {row("Phone", o.phonenumber)}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Business</p>
              {row("Business email", vendor.business_email)}
              {row("Phone", vendor.phone)}
              {row("Address", vendor.address)}
              {row("Website", vendor.website)}
              {row("About", vendor.about)}
              {row("Registered", format(new Date(vendor.created_at), "PPP p"))}
              {vendor.status === "rejected" && row("Rejection reason", vendor.rejection_reason)}
            </div>
          </div>
        )}
        {vendor && <DialogFooter className="gap-2">{renderActions(vendor)}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

function VendorEditDialog({ vendor, onClose }: { vendor: AdminVendor | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VendorUpdatePayload>({});

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        business_email: vendor.business_email ?? "",
        phone: vendor.phone ?? "",
        address: vendor.address ?? "",
        website: vendor.website ?? "",
        about: vendor.about ?? "",
      });
    }
  }, [vendor]);

  const save = useMutation({
    mutationFn: () => {
      // Send blanks as null so optional URL/email fields validate
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === "" && k !== "name" ? null : v])
      );
      return vendorsApi.updateVendor(vendor!.id, payload as VendorUpdatePayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      toast({ title: "Vendor updated" });
      onClose();
    },
    onError: (error) =>
      toast({ title: "Update failed", description: apiErrorMessage(error), variant: "destructive" }),
  });

  const field = (key: keyof VendorUpdatePayload, label: string) => (
    <div className="space-y-1">
      <Label htmlFor={`vendor-${key}`}>{label}</Label>
      <Input
        id={`vendor-${key}`}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Dialog open={!!vendor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit vendor</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          {field("name", "Store name")}
          {field("business_email", "Business email")}
          {field("phone", "Phone")}
          {field("address", "Address")}
          {field("website", "Website")}
          <div className="space-y-1">
            <Label htmlFor="vendor-about">About</Label>
            <Textarea
              id="vendor-about"
              value={form.about ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || !form.name}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
