import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Home,
  Landmark,
  Layers,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingCart,
  Store,
  Tags,
  Ticket,
  Truck,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import ProductManager from "@/components/ProductManager";
import CategoryManager from "@/components/CategoryManager";
import { BulkUploadProducts } from "@/components/BulkUploadProducts";
import { BulkUploadCategories } from "@/components/BulkUploadCategories";
import UserManager from "@/components/UserManager";
import { VendorManager } from "@/components/VendorManager";
import { AdminOverview, adminStatsKey } from "@/components/admin/AdminOverview";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { OrdersAdmin } from "@/components/admin/OrdersAdmin";
import { CouponsAdmin } from "@/components/admin/CouponsAdmin";
import { PaymentsAdmin } from "@/components/admin/PaymentsAdmin";
import { PaymentAccountsAdmin } from "@/components/admin/PaymentAccountsAdmin";
import { ShippingTaxAdmin } from "@/components/admin/ShippingTaxAdmin";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";
import { TagsAdmin } from "@/components/admin/TagsAdmin";
import { useIsAuthenticated, useLogout } from "@/hooks/useAuth";
import { adminApi } from "@/lib/api";
import { canAccessAdminPortal, canManageUsers } from "@/lib/roles";

type NavItem = { key: string; label: string; icon: typeof Package; adminOnly?: boolean };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Dashboard",
    items: [{ key: "overview", label: "Overview", icon: BarChart3 }],
  },
  {
    title: "Marketplace",
    items: [
      { key: "vendors", label: "Vendors", icon: Store },
      { key: "orders", label: "Orders", icon: ShoppingCart },
      { key: "payments", label: "Payments", icon: Wallet },
      { key: "users", label: "Users", icon: Users, adminOnly: true },
    ],
  },
  {
    title: "Catalog",
    items: [
      { key: "products", label: "Products", icon: Package },
      { key: "bulk-upload", label: "Bulk Upload Products", icon: Upload },
      { key: "categories", label: "Categories", icon: Layers },
      { key: "bulk-upload-categories", label: "Bulk Upload Categories", icon: Upload },
      { key: "tags", label: "Tags", icon: Tags },
      { key: "reviews", label: "Reviews", icon: MessageSquare },
    ],
  },
  {
    title: "Settings",
    items: [
      { key: "coupons", label: "Coupons", icon: Ticket },
      { key: "shipping-tax", label: "Shipping & Tax", icon: Truck },
      { key: "payment-accounts", label: "Payment accounts", icon: Landmark, adminOnly: true },
    ],
  },
];

export default function Admin() {
  const { isAuthenticated, isLoading, user } = useIsAuthenticated();
  const logoutMutation = useLogout();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [focusVendorId, setFocusVendorId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const allowed = canAccessAdminPortal(user);
  const activeTab = searchParams.get("tab") || "overview";

  // Redirect non-admins once auth state is known
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) navigate("/login", { state: { from: { pathname: "/admin" } } });
    else if (!allowed) navigate("/");
  }, [isAuthenticated, isLoading, allowed, navigate]);

  // Pending-vendor badge for the sidebar
  const { data: stats } = useQuery({
    queryKey: adminStatsKey,
    queryFn: adminApi.getStats,
    enabled: allowed,
    refetchInterval: 60 * 1000,
  });

  const setTab = useCallback(
    (tab: string) => {
      setSearchParams(tab === "overview" ? {} : { tab });
      setMobileNavOpen(false);
    },
    [setSearchParams]
  );

  const openVendor = useCallback(
    (vendorId: string) => {
      setFocusVendorId(vendorId);
      setTab("vendors");
    },
    [setTab]
  );
  const clearFocus = useCallback(() => setFocusVendorId(null), []);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/login");
  };

  if (isLoading || !isAuthenticated || !allowed) {
    return null;
  }

  const showUsers = canManageUsers(user);
  const badgeFor = (key: string) => {
    if (key === "vendors") return stats?.vendors.pending ?? 0;
    if (key === "reviews") return stats?.pending_product_reviews ?? 0;
    return 0;
  };
  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === activeTab)?.label ?? "Overview";

  const sidebar = (
    <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{group.title}</p>
          <div className="space-y-1">
            {group.items
              .filter((item) => !item.adminOnly || showUsers)
              .map(({ key, label, icon: Icon }) => {
                const badge = badgeFor(key);
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === key ? "bg-primary text-white shadow-md" : "hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {badge > 0 && (
                      <span
                        className={`ml-2 min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                          activeTab === key ? "bg-white text-primary" : "bg-amber-500 text-white"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-white shadow-lg flex flex-col transform transition-transform md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin Portal</h1>
          <button className="md:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebar}
        <div className="px-4 py-4 border-t space-y-1">
          <Link
            to="/"
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Home className="w-4 h-4 mr-3" /> Back to store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <LogOut className="w-4 h-4 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">{currentLabel}</h2>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell onOpenVendor={openVendor} />
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-medium">
                {user?.first_name || user?.last_name ? `${user?.first_name} ${user?.last_name}`.trim() : user?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {activeTab === "overview" && <AdminOverview onNavigate={setTab} onOpenVendor={openVendor} />}
            {activeTab === "vendors" && <VendorManager focusVendorId={focusVendorId} onFocusHandled={clearFocus} />}
            {activeTab === "orders" && <OrdersAdmin />}
            {activeTab === "payments" && <PaymentsAdmin />}
            {activeTab === "users" && showUsers && <UserManager />}
            {activeTab === "products" && <ProductManager />}
            {activeTab === "bulk-upload" && <BulkUploadProducts />}
            {activeTab === "categories" && <CategoryManager />}
            {activeTab === "bulk-upload-categories" && <BulkUploadCategories />}
            {activeTab === "tags" && <TagsAdmin />}
            {activeTab === "reviews" && <ReviewsAdmin />}
            {activeTab === "coupons" && <CouponsAdmin />}
            {activeTab === "shipping-tax" && <ShippingTaxAdmin />}
            {activeTab === "payment-accounts" && showUsers && <PaymentAccountsAdmin />}
          </div>
        </main>
      </div>
    </div>
  );
}
