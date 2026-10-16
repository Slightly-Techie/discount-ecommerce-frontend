import { NavLink } from "react-router-dom";
import { Heart, Home, LayoutGrid, ShoppingCart, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

// Bottom tab bar below lg: 64px plus the safe-area inset. Active tab = teal icon,
// bold label and a 3px top bar, with aria-current="page" from NavLink.
export function MobileTabBar() {
  const cartCount = useCartStore((s) => (s.cart || []).reduce((n, item) => n + (item?.quantity || 0), 0));

  const tabs = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/products", label: "Categories", icon: LayoutGrid },
    { to: "/favorites", label: "Saved", icon: Heart },
    { to: "/cart", label: "Cart", icon: ShoppingCart, count: cartCount },
    { to: "/profile", label: "Account", icon: User },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-nav grid grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map(({ to, label, icon: Icon, end, count }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={count ? `${label}, ${count} ${count === 1 ? "item" : "items"}` : undefined}
          className={({ isActive }) =>
            cn(
              "relative flex min-h-16 flex-col items-center justify-center gap-[3px] text-xs leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden="true"
                className={cn("absolute left-1/2 top-0 h-[3px] w-8 -translate-x-1/2 rounded-b-[3px]", isActive ? "bg-primary" : "bg-transparent")}
              />
              <span className="relative flex">
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
                {!!count && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 left-3.5 h-5 min-w-5 rounded-full border-2 border-background bg-deal px-1.5 text-center text-[11px] font-bold leading-4 text-deal-foreground tabular-prices"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
