import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Filter, Loader2, Package, Shield, Store, User as UserIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsAuthenticated } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { Pager, SearchBox, apiErrorMessage, useAdminList } from "./admin/shared";
import { User } from "@/types";

const ROLES = [
  { value: "customer", label: "Customer" },
  { value: "seller", label: "Seller" },
  { value: "vendor_admin", label: "Vendor Admin" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "destructive";
    case "seller":
    case "vendor_admin":
      return "default";
    case "manager":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleIcon = (role: string) => {
  switch (role?.toLowerCase()) {
    case "admin":
    case "manager":
      return <Shield className="h-4 w-4" />;
    case "seller":
      return <Package className="h-4 w-4" />;
    case "vendor_admin":
      return <Store className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

const UserManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useIsAuthenticated();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const extra: Record<string, string> = {};
  if (roleFilter !== "all") extra.role = roleFilter;
  if (statusFilter !== "all") extra.is_active = statusFilter === "active" ? "true" : "false";
  const list = useAdminList<User>(["admin", "users"], adminApi.getUsers, extra);

  const onDone = (title: string) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    toast({ title });
  };
  const onFail = (error: unknown) =>
    toast({ title: "Error", description: apiErrorMessage(error), variant: "destructive" });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User>; message: string }) =>
      adminApi.updateUser(id, data),
    onSuccess: (_d, { message }) => onDone(message),
    onError: onFail,
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => adminApi.deactivateUser(id),
    onSuccess: () => onDone("User deactivated"),
    onError: onFail,
  });
  const busy = update.isPending || deactivate.isPending;

  const setActive = (u: User, active: boolean) => {
    if (active) {
      update.mutate({ id: u.id, data: { is_active: true, is_deleted: false }, message: "User reactivated" });
    } else {
      deactivate.mutate(u.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchBox
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search by email, phone, username, or name…"
          />
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
                list.setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                list.setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {list.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : list.error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Failed to load users</p>
            <Button onClick={() => list.refetch()}>Try Again</Button>
          </div>
        ) : list.rows.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users match your search criteria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.rows.map((user) => {
              const isSelf = currentUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    user.is_active ? "" : "opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {user.first_name || user.last_name
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : user.username || user.email}
                        </p>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role || "Unknown"}</Badge>
                        {user.is_superuser && <Badge variant="destructive">superuser</Badge>}
                        {!user.is_active && <Badge variant="outline">inactive</Badge>}
                        {isSelf && <Badge variant="secondary">you</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email} {user.phonenumber && `· ${user.phonenumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.vendor && <>Vendor: {user.vendor.name} ({user.vendor.status}) · </>}
                        {user.date_joined && <>Joined {format(new Date(user.date_joined), "PP")}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={!!user.is_staff}
                        disabled={busy || isSelf}
                        onCheckedChange={(checked) =>
                          update.mutate({
                            id: user.id,
                            data: { is_staff: checked },
                            message: checked ? "Staff access granted" : "Staff access removed",
                          })
                        }
                      />
                      Staff
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={!!user.is_active}
                        disabled={busy || isSelf}
                        onCheckedChange={(checked) => setActive(user, checked)}
                      />
                      Active
                    </label>
                    <Select
                      value={user.role || "customer"}
                      onValueChange={(role) =>
                        update.mutate({ id: user.id, data: { role } as Partial<User>, message: `Role set to ${role}` })
                      }
                      disabled={busy || isSelf}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />
      </CardContent>
    </Card>
  );
};

export { UserManager };
export default UserManager;
