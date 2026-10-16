import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Baby,
  ChevronRight,
  CookingPot,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Tv,
  type LucideIcon,
} from "lucide-react";

import { Layout } from "@/components/Layout";
import { DealCard, DealCardSkeleton } from "@/components/DealCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { dealPricing, endLabel } from "@/lib/deal";
import type { Product } from "@/types/product";

const categoryIcon = (name: string): LucideIcon => {
  const n = name.toLowerCase();
  if (n.includes("grocer") || n.includes("food")) return ShoppingBasket;
  if (n.includes("electr") || n.includes("tv")) return Tv;
  if (n.includes("phone") || n.includes("mobile")) return Smartphone;
  if (n.includes("home") || n.includes("kitchen")) return CookingPot;
  if (n.includes("baby") || n.includes("kid")) return Baby;
  if (n.includes("beauty") || n.includes("care")) return Sparkles;
  return Tag;
};

interface RailProps {
  title: string;
  subtitle: string;
  seeAllLabel: string;
  items: Product[];
  priority?: boolean;
}

// Mobile: horizontal scroll-snap with a peek of the next card, never auto-advancing.
// Desktop: a static row of five cards.
function Rail({ title, subtitle, seeAllLabel, items, priority }: RailProps) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-1.5 lg:gap-4" aria-label={title}>
      <div className="container flex items-end justify-between">
        <div className="flex flex-col lg:gap-0.5">
          <h2 className="text-lg font-bold leading-[26px] lg:text-2xl lg:leading-8">{title}</h2>
          <p className="text-[13px] leading-[18px] text-muted-foreground lg:text-sm">{subtitle}</p>
        </div>
        <Link
          to="/products"
          aria-label={seeAllLabel}
          className="-mr-3 flex min-h-12 items-center gap-0.5 px-3 text-sm font-bold text-primary hover:text-primary-strong lg:mr-0 lg:px-1 lg:text-[15px]"
        >
          See all
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="container flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto pb-1 scrollbar-none sm:scroll-pl-6 md:scroll-pl-8 lg:grid lg:grid-cols-5 lg:gap-6 lg:overflow-visible">
        {items.slice(0, 10).map((p, i) => (
          <li key={p.id} className="flex w-[156px] shrink-0 snap-start lg:w-auto [&:nth-child(n+6)]:lg:hidden">
            <DealCard product={p} priority={priority && i < 2} className="w-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className="container">
        <div className="h-6 w-40 rounded-[6px] bg-skeleton" />
      </div>
      <div className="container flex gap-3 overflow-hidden lg:grid lg:grid-cols-5 lg:gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[156px] shrink-0 lg:w-auto">
            <DealCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

const Index = () => {
  const { data, isLoading, isError, refetch } = useProducts({ page_size: 48, ordering: "-created_at" });
  const { data: categories } = useCategories();
  const products = useMemo(() => data?.results ?? [], [data]);

  const rails = useMemo(() => {
    const now = new Date();
    const biggest = products
      .filter((p) => dealPricing(p, now).save !== null)
      .sort((a, b) => (dealPricing(b, now).save ?? 0) - (dealPricing(a, now).save ?? 0));
    const ending = products
      .filter((p) => endLabel(p, now) !== null && p.stock > 0)
      .sort((a, b) => Date.parse(a.discount_end as string) - Date.parse(b.discount_end as string));
    const featured = products.filter((p) => p.is_featured);
    return { biggest, ending, featured };
  }, [products]);

  const retailers = useMemo(() => {
    const names = Array.from(new Set(products.map((p) => p.source_platform?.trim()).filter(Boolean))) as string[];
    return { names: names.sort(), hasVendorDeals: products.some((p) => p.source === "internal") };
  }, [products]);

  return (
    <Layout mobileBar={{ kind: "home" }}>
      <h1 className="sr-only">GrottoMore deals</h1>
      <div className="flex flex-col gap-6 pb-8 pt-4 lg:gap-12 lg:pb-16 lg:pt-8">
        {categories && categories.length > 0 && (
          <nav aria-label="Categories" className="container">
            <ul className="-mx-1 flex gap-1 overflow-x-auto scrollbar-none lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-2">
              {categories.slice(0, 8).map((c) => {
                const Icon = categoryIcon(c.name);
                return (
                  <li key={c.id} className="w-[76px] shrink-0 lg:w-auto">
                    <Link
                      to={`/products?category=${c.id}`}
                      className="flex flex-col items-center gap-1.5 rounded-lg py-1 text-center text-xs font-medium leading-4 hover:text-primary lg:gap-2 lg:py-2 lg:text-sm"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground lg:h-16 lg:w-16">
                        <Icon className="h-[26px] w-[26px]" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {(retailers.names.length > 0 || retailers.hasVendorDeals) && (
          <section aria-labelledby="retailers-heading" className="container flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4">
            <h2 id="retailers-heading" className="text-lg font-bold leading-[26px]">
              Shop by retailer
            </h2>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:flex-wrap lg:px-0">
              {retailers.names.map((name) => (
                <li key={name} className="shrink-0">
                  <Link
                    to={`/products?retailer=${encodeURIComponent(name)}`}
                    className="flex h-11 items-center gap-2 rounded-full border border-input pl-1.5 pr-4 text-sm font-semibold hover:bg-muted lg:h-12 lg:text-[15px]"
                  >
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-muted-foreground">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    {name}
                  </Link>
                </li>
              ))}
              {retailers.hasVendorDeals && (
                <li className="shrink-0">
                  <Link
                    to="/products?retailer=vendor"
                    className="flex h-11 items-center gap-2 rounded-full border border-input pl-1.5 pr-4 text-sm font-semibold hover:bg-muted lg:h-12 lg:text-[15px]"
                  >
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <Store className="h-4 w-4" />
                    </span>
                    Vendor deals
                  </Link>
                </li>
              )}
              <li className="shrink-0">
                <Link to="/products" className="flex h-11 items-center rounded-full border border-input px-4 text-sm font-semibold hover:bg-muted lg:h-12 lg:text-[15px]">
                  All retailers
                </Link>
              </li>
            </ul>
          </section>
        )}

        {isLoading && (
          <>
            <RailSkeleton />
            <RailSkeleton />
          </>
        )}

        {isError && (
          <div className="container">
            <div role="alert" className="flex items-start gap-3 rounded-lg bg-destructive-subtle px-4 py-3.5 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-[15px]">Couldn't load deals</strong>
                  <p className="text-sm">Check your connection and try again.</p>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <EmptyState
            icon={Tag}
            title="No deals yet"
            description="New discounts from retailers and vendors will show up here. Check back soon."
          />
        )}

        <Rail
          title="Biggest savings"
          subtitle="Most cedis off right now"
          seeAllLabel="See all deals"
          items={rails.biggest}
          priority
        />
        <Rail title="Ending soon" subtitle="Deals with a real end date this week" seeAllLabel="See all deals" items={rails.ending} />
        <Rail title="Featured" subtitle="Picked by the GrottoMore team" seeAllLabel="See all deals" items={rails.featured} />
      </div>
    </Layout>
  );
};

export default Index;
