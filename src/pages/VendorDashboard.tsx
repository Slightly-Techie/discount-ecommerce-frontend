import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useIsAuthenticated } from "@/hooks/useAuth";
import { useVendorMe, useUpdateVendorMe } from "@/hooks/useVendors";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Store, Info, Package, User as UserIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VendorProductsPanel } from "@/components/VendorProductsPanel";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";

export default function VendorDashboard() {
  const { isAuthenticated, user } = useIsAuthenticated();
  const { data: vendor, isLoading, error, refetch } = useVendorMe(true);
  const updateVendor = useUpdateVendorMe();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"overview" | "products" | "profile">("overview");

  const { data: vendorProducts } = useQuery({
    queryKey: ["products", "vendor", vendor?.id],
    queryFn: () => productApi.getProducts({ vendor: vendor!.id }),
    enabled: !!vendor?.id,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const status = vendor?.status;

  const isBlocked = status === "pending" || status === "suspended" || status === "rejected";

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-var(--header-height,4rem))] bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg flex flex-col">
          <div className="px-6 py-5 border-b">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-bold">Vendor Dashboard</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {vendor?.name || user?.email}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => setActiveSection("overview")}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === "overview"
                  ? "bg-primary text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection("products")}
              disabled={status !== "approved"}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === "products"
                  ? "bg-primary text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
              } ${status !== "approved" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Package className="w-4 h-4 mr-3" />
              Products
            </button>
            <button
              onClick={() => setActiveSection("profile")}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeSection === "profile"
                  ? "bg-primary text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <UserIcon className="w-4 h-4 mr-3" />
              Store Profile
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Page header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Store className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {vendor?.name || "Vendor Dashboard"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your store, profile, and products.
                  </p>
                </div>
              </div>
            </div>

            {/* Loading / error / status banners */}
            {isLoading && (
              <Card className="mb-6">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading your vendor profile…
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="mb-6">
                <CardContent className="py-6 flex flex-col items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <p className="text-sm text-destructive">
                    Could not load your vendor profile.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {vendor && isBlocked && (
              <Card className="mb-6 border-amber-300 bg-amber-50/80">
                <CardHeader className="flex flex-row items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <CardTitle className="text-base">
                      {status === "pending" && "Your vendor account is pending approval"}
                      {status === "suspended" && "Your vendor account is suspended"}
                      {status === "rejected" && "Your vendor application was rejected"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-amber-900">
                  {status === "pending" && (
                    <p>
                      An administrator must approve your account before you can start
                      adding products. You will be notified once your account is approved.
                    </p>
                  )}
                  {status === "suspended" && (
                    <p>
                      Your store is currently suspended. Please contact support or the
                      platform administrator for more information.
                    </p>
                  )}
                  {status === "rejected" && (
                    <>
                      <p>Your application was rejected by an administrator.</p>
                      {vendor.rejection_reason && (
                        <p className="font-medium">
                          Reason: {vendor.rejection_reason}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main sections */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Store status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-2xl font-bold capitalize">
                        {vendor?.status ?? "unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current approval state of your vendor account.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total products
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-2xl font-bold">
                        {vendorProducts?.results.length ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Number of products listed under your store.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Account
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-sm font-semibold">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This dashboard is linked to your vendor account.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      As you add and update products, summary metrics and trends can be
                      surfaced here (e.g. active vs inactive products, featured items, etc.).
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Store profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor ? (
                    <form
                      className="space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget as HTMLFormElement;
                        const formData = new FormData(form);
                        const payload = {
                          name: formData.get("vendor_name")?.toString() || undefined,
                          business_email: formData.get("vendor_email")?.toString() || undefined,
                          phone: formData.get("vendor_phone")?.toString() || undefined,
                          website: formData.get("vendor_website")?.toString() || undefined,
                          about: formData.get("vendor_about")?.toString() || undefined,
                        };
                        updateVendor.mutate(payload);
                      }}
                    >
                      <div>
                        <Label htmlFor="vendor_name">Store name</Label>
                        <Input
                          id="vendor_name"
                          name="vendor_name"
                          defaultValue={vendor.name}
                          disabled={updateVendor.isPending}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_email">Business email</Label>
                        <Input
                          id="vendor_email"
                          name="vendor_email"
                          defaultValue={vendor.business_email}
                          disabled={updateVendor.isPending}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_phone">Phone</Label>
                        <Input
                          id="vendor_phone"
                          name="vendor_phone"
                          defaultValue={vendor.phone}
                          disabled={updateVendor.isPending}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_website">Website</Label>
                        <Input
                          id="vendor_website"
                          name="vendor_website"
                          defaultValue={vendor.website || ""}
                          disabled={updateVendor.isPending}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor_about">About</Label>
                        <Textarea
                          id="vendor_about"
                          name="vendor_about"
                          defaultValue={vendor.about || ""}
                          disabled={updateVendor.isPending}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          Update your store contact and description details.
                        </p>
                        <Button type="submit" size="sm" disabled={updateVendor.isPending}>
                          {updateVendor.isPending ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No vendor profile found.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "products" && (
              <div className="space-y-4">
                {vendor && status === "approved" ? (
                  <VendorProductsPanel filters={{ vendor: vendor.id }} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your products</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Your account must be approved before you can manage products.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
}

