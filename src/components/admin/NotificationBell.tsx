import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import type { AppNotification } from "@/types";

interface NotificationBellProps {
  /** Called when a notification that references a vendor is clicked */
  onOpenVendor?: (vendorId: string) => void;
}

export function NotificationBell({ onOpenVendor }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadNotificationCount();
  const { data, isLoading } = useNotifications({ page_size: 20 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = useMemo(() => data?.results ?? [], [data]);

  // Pop a toast when new notifications arrive while the portal is open.
  // The first successful load only seeds the "seen" set, so existing items never toast.
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!data) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const fresh = notifications.filter((n) => !n.is_read && !seenIds.current!.has(n.id));
    fresh.forEach((n) => seenIds.current!.add(n.id));
    if (fresh.length === 1) {
      toast({ title: fresh[0].title, description: fresh[0].message });
    } else if (fresh.length > 1) {
      toast({ title: `${fresh.length} new notifications`, description: fresh[0].title });
    }
  }, [data, notifications, toast]);

  const handleClick = (notification: AppNotification) => {
    if (!notification.is_read) markRead.mutate(notification.id);
    if (notification.type === "vendor_request") {
      navigate("/admin?tab=vendors&view=requests");
      setOpen(false);
    } else if (notification.vendor && onOpenVendor) {
      onOpenVendor(notification.vendor.id);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="p-6 text-sm text-center text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-sm text-center text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/60 transition-colors ${
                      n.is_read ? "" : "bg-primary/5"
                    }`}
                  >
                    <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${n.is_read ? "" : "font-semibold"}`}>{n.title}</p>
                        {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        {n.vendor && n.type === "vendor_signup" && n.vendor.status !== "pending" && (
                          <> · now {n.vendor.status}</>
                        )}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
