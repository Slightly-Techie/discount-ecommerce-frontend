import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { MobileTopBar, type MobileBar } from "@/components/MobileTopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { useFavoritesAuthBinding } from "@/hooks/useFavorites";
import { useCartStore } from "@/store/cartStore";

interface LayoutProps {
  children: React.ReactNode;
  /** Mobile top bar variant; desktop always shows the full header. */
  mobileBar?: MobileBar;
  /** Hide the bottom tab bar, e.g. under a sticky buy bar or during checkout. */
  hideTabBar?: boolean;
  footer?: boolean;
  /** @deprecated counts now come from the stores; kept for older pages. */
  favoritesCount?: number;
}

export function Layout({ children, mobileBar = { kind: "home" }, hideTabBar = false, footer = true }: LayoutProps) {
  const fetchCart = useCartStore((s) => s.fetchCart);
  useFavoritesAuthBinding();

  // Load the signed-in cart once so the cart count is right on every page.
  useEffect(() => {
    if (localStorage.getItem("accessToken")) fetchCart().catch(() => undefined);
  }, [fetchCart]);

  return (
    <div className={cn("flex min-h-screen flex-col bg-background", !hideTabBar && "pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:font-semibold"
      >
        Skip to content
      </a>
      <SiteHeader />
      <MobileTopBar bar={mobileBar} />
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer && <Footer />}
      {!hideTabBar && <MobileTabBar />}
    </div>
  );
}
