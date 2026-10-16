import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, LayoutGrid, List, LogOut, Settings, ShoppingCart, Store, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { canAccessAdminPortal } from "@/lib/roles";
import { Logo } from "@/components/MobileTopBar";
import { SearchField } from "@/components/SearchField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsAuthenticated, useLogout } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useVendorMe } from "@/hooks/useVendors";
import { useCartStore } from "@/store/cartStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "box-border flex h-12 items-center gap-1.5 border-b-[3px] px-2.5 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary"
  );

// Desktop header (lg and up): logo, Categories menu, search, Saved, Cart, Account,
// and a second row of top categories.
export function SiteHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useIsAuthenticated();
  const logout = useLogout();
  const { data: vendor } = useVendorMe(isAuthenticated);
  const { data: categories } = useCategories();
  const cartCount = useCartStore((s) => (s.cart || []).reduce((n, item) => n + (item?.quantity || 0), 0));
  const topCategories = (categories || []).slice(0, 8);

  return (
    <header className="hidden border-b bg-background lg:block">
      <div className="container flex h-[72px] items-center gap-5">
        <Logo />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-12 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-3.5 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <LayoutGrid className="h-[18px] w-[18px]" aria-hidden="true" />
            Categories
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuItem onClick={() => navigate("/products")}>All deals</DropdownMenuItem>
            {(categories || []).map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => navigate(`/products?category=${c.id}`)}>
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <SearchField variant="joined" className="flex-1" />
        <nav aria-label="Your account" className="flex shrink-0 items-center gap-1">
          <NavLink to="/favorites" className={navLinkClass}>
            <Heart className="h-5 w-5" aria-hidden="true" />
            Saved
          </NavLink>
          <NavLink
            to="/cart"
            aria-label={cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Cart"}
            className={navLinkClass}
          >
            <span className="relative flex">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {!!cartCount && (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-3 h-5 min-w-5 rounded-full border-2 border-background bg-deal px-1.5 text-center text-[11px] font-bold leading-4 text-deal-foreground tabular-prices"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            Cart
          </NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-12 items-center gap-1.5 px-2.5 text-[15px] font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <User className="h-5 w-5" aria-hidden="true" />
              {isAuthenticated ? user?.first_name || "Account" : "Sign in"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isAuthenticated ? (
                <>
                  <DropdownMenuLabel>
                    <p className="text-sm font-semibold">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <List className="mr-2 h-4 w-4" aria-hidden="true" />
                    Orders
                  </DropdownMenuItem>
                  {vendor && (
                    <DropdownMenuItem onClick={() => navigate("/vendor")}>
                      <Store className="mr-2 h-4 w-4" aria-hidden="true" />
                      Vendor dashboard
                    </DropdownMenuItem>
                  )}
                  {canAccessAdminPortal(user) && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      Admin dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout.mutate()}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate("/login")}>Sign in</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/register")}>Create account</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
      {topCategories.length > 0 && (
        <div className="border-t">
          <nav aria-label="Categories" className="container flex h-11 items-center gap-1 overflow-x-auto text-sm font-medium scrollbar-none">
            {topCategories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.id}`}
                className="whitespace-nowrap px-2.5 py-3 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
