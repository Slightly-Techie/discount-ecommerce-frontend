import { useState } from "react";
import { useVendorsList } from "@/hooks/useVendors";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { vendorsApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Store, Ban, CheckCircle2, XCircle } from "lucide-react";
import type { Vendor } from "@/types";

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

export function VendorManager() {
  const { data, isLoading, error, refetch } = useVendorsList();
  const vendors = (data?.results ?? []) as Vendor[];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Vendor["status"]>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const makeActionMutation = (
    action: "approve" | "reject" | "suspend",
    fn: (id: string) => Promise<void>
  ) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vendors", "list"] });
      },
      onError: () => {
        toast({
          title: "Action failed",
          description: "Unable to update vendor status. Please try again.",
          variant: "destructive",
        });
      },
    });

  const approveMutation = makeActionMutation("approve", vendorsApi.approveVendor);
  const rejectMutation = makeActionMutation("reject", vendorsApi.rejectVendor);
  const suspendMutation = makeActionMutation("suspend", vendorsApi.suspendVendor);

  const loading =
    isLoading || approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending;

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      !search ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.business_email?.toLowerCase().includes(search.toLowerCase()) ||
      v.phone?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading vendors…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-destructive">Failed to load vendors.</p>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Vendor Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No vendors match your filters.
            </div>
          ) : (
            filtered.map((v) => (
              <div
                key={v.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{v.name || v.slug || "Unnamed vendor"}</p>
                      <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
                    </div>
                    {v.business_email && (
                      <p className="text-sm text-muted-foreground">{v.business_email}</p>
                    )}
                    {v.phone && (
                      <p className="text-xs text-muted-foreground">Phone: {v.phone}</p>
                    )}
                    {v.rejection_reason && v.status === "rejected" && (
                      <p className="text-xs text-destructive mt-1">
                        Rejection reason: {v.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {v.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={loading}
                        onClick={() => approveMutation.mutate(v.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => rejectMutation.mutate(v.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {v.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => suspendMutation.mutate(v.id)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  )}

                  {(v.status === "rejected" || v.status === "suspended") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => approveMutation.mutate(v.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Re-approve
                    </Button>
                  )}

                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          Showing {filtered.length} of {vendors.length} vendors
        </div>
      </CardContent>
    </Card>
  );
}

