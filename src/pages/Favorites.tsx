import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { Layout } from "@/components/Layout";
import { DealCard } from "@/components/DealCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useIsAuthenticated } from "@/hooks/useAuth";

// Saved deals work signed out (kept on this device) and merge into the account on sign-in.
export default function Favorites() {
  // Subscribe to the active list so unsaving a deal removes it immediately.
  const items = useFavoritesStore((s) => s.favoritesByUser[s.activeUserKey]);
  const saved = (items || []).map((i) => i.product);
  const { isAuthenticated } = useIsAuthenticated();

  return (
    <Layout mobileBar={{ kind: "title", title: "Saved" }}>
      <div className="container pb-12 pt-4 lg:pt-8">
        <div className="mb-4 flex flex-col gap-1 lg:mb-6">
          <h1 className="hidden text-[30px] font-bold leading-[38px] lg:block">Saved deals</h1>
          {saved.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {saved.length} saved {saved.length === 1 ? "deal" : "deals"}
              {!isAuthenticated && (
                <>
                  {" "}· kept on this device.{" "}
                  <Link to="/login?next=/favorites" className="font-semibold text-primary">
                    Sign in
                  </Link>{" "}
                  to keep them everywhere.
                </>
              )}
            </p>
          )}
        </div>

        {saved.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved deals yet"
            description="Tap the heart on any deal to keep it here and check back before it ends."
            action={
              <Button asChild>
                <Link to="/products">Browse deals</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6">
            {saved.map((p) => (
              <li key={p.id} className="flex">
                <DealCard product={p} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
