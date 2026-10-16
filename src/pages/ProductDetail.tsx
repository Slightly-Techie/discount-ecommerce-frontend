import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, Ban, CheckCircle2, Clock, Heart, ImageOff, Share2, Star, Store, Truck } from "lucide-react";

import { Layout } from "@/components/Layout";
import { DealCard } from "@/components/DealCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useProduct } from "@/hooks/useProducts";
import { productApi } from "@/lib/api";
import { useDealActions } from "@/hooks/useDealActions";
import { cn } from "@/lib/utils";
import { formatGHS } from "@/lib/price";
import { dealPricing, endDetail, productImage, retailerName, shortDate, stockState } from "@/lib/deal";
import type { Product } from "@/types/product";

function PriceBlock({ product }: { product: Product }) {
  const pricing = dealPricing(product);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="text-[28px] font-bold leading-[34px] tracking-[-0.01em] tabular-prices lg:text-[30px] lg:leading-[38px]">
          {formatGHS(pricing.price)}
        </span>
        {pricing.was !== null && (
          <span className="text-base text-subtle tabular-prices">
            was <s>{formatGHS(pricing.was)}</s>
          </span>
        )}
      </div>
      {pricing.save !== null && (
        <span className="self-start rounded-[6px] bg-save-subtle px-2.5 py-1 text-sm font-bold text-save tabular-prices">
          You save {formatGHS(pricing.save)} ({pricing.percent}%)
        </span>
      )}
    </div>
  );
}

function StockLine({ product }: { product: Product }) {
  const state = stockState(product.stock);
  if (state === "out")
    return (
      <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Ban className="h-4 w-4" aria-hidden="true" />
        Out of stock
      </span>
    );
  if (state === "low")
    return (
      <span className="flex items-center gap-1.5 text-sm font-semibold text-deal-text">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        Low stock · only {product.stock} left
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-save">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      In stock
    </span>
  );
}

const ProductDetail = () => {
  const { id = "" } = useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const { add, toggleSave, isSaved } = useDealActions();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // The mobile buy bar sits above the tab bar: keep toasts and keyboard focus clear of both.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--toast-bottom", "152px");
    root.style.scrollPaddingBottom = "168px";
    return () => {
      root.style.removeProperty("--toast-bottom");
      root.style.scrollPaddingBottom = "";
    };
  }, []);

  const related = useMemo(
    () => (product?.related_products || []).filter((r): r is Product => typeof r === "object" && r !== null),
    [product]
  );
  // Fall back to the same category when the product has no related deals.
  const categoryId = product?.category?.id;
  const { data: sameCategory } = useQuery({
    queryKey: ["products", "list", { category: categoryId, page_size: 8 }],
    queryFn: () => productApi.getProducts({ category: categoryId, page_size: 8 }),
    enabled: !!product && related.length === 0 && !!categoryId,
  });
  const suggestions = (related.length > 0 ? related : sameCategory?.results || []).filter((p) => p.id !== product?.id).slice(0, 10);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product?.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Share sheet dismissed
    }
  };

  const bar = { kind: "title" as const, title: "Deal", back: undefined, actions: (
    <button
      type="button"
      onClick={share}
      aria-label="Share this deal"
      className="flex h-12 w-12 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Share2 className="h-[22px] w-[22px]" aria-hidden="true" />
    </button>
  ) };

  if (isLoading) {
    return (
      <Layout mobileBar={bar}>
        <div aria-busy="true" className="container grid gap-6 pb-12 pt-4 lg:grid-cols-2 lg:gap-12 lg:pt-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !product) {
    return (
      <Layout mobileBar={bar}>
        <EmptyState
          icon={AlertCircle}
          title="We couldn’t load this deal"
          description="It may have ended or been removed. Check your connection and try again."
          action={
            <>
              <Button onClick={() => refetch()}>Try again</Button>
              <Button variant="outline" asChild>
                <Link to="/products">Browse deals</Link>
              </Button>
            </>
          }
        />
      </Layout>
    );
  }

  const image = productImage(product);
  const pricing = dealPricing(product);
  const ends = endDetail(product);
  const isOut = stockState(product.stock) === "out";
  const saved = isSaved(product.id);
  const retailer = retailerName(product);
  const retailerHref = product.source_platform
    ? `/products?retailer=${encodeURIComponent(product.source_platform)}`
    : product.source === "internal"
      ? "/products?retailer=vendor"
      : "/products";
  const ratings = (product.reviews || []).filter((r) => r.is_approved !== false);
  const avgRating = ratings.length ? ratings.reduce((n, r) => n + r.rating, 0) / ratings.length : null;

  const handleAdd = async () => {
    setAdding(true);
    await add(product, quantity);
    setAdding(false);
  };

  const buyControls = (
    <div className="flex items-center gap-3">
      <QuantityStepper value={quantity} onChange={setQuantity} max={product.stock} />
      <Button variant="deal" className="flex-1" onClick={handleAdd} disabled={adding}>
        {adding ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );

  return (
    <Layout mobileBar={bar}>
      <div className={cn("container pb-12 pt-4 lg:pt-6", !isOut && "pb-28 lg:pb-12")}>
        <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
          <Link to="/" className="text-primary hover:text-primary-strong">Home</Link>
          <span aria-hidden="true">›</span>
          {product.category?.id ? (
            <Link to={`/products?category=${product.category.id}`} className="text-primary hover:text-primary-strong">
              {product.category.name}
            </Link>
          ) : (
            <Link to="/products" className="text-primary hover:text-primary-strong">Deals</Link>
          )}
          <span aria-hidden="true">›</span>
          <span aria-current="page" className="truncate">{product.name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-2 lg:gap-12">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary">
            {image ? (
              <img
                src={image}
                alt={product.name}
                width={640}
                height={640}
                {...{ fetchpriority: "high" }}
                className={cn("absolute inset-0 h-full w-full object-contain p-4", isOut && "opacity-[0.45]")}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageOff className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-medium">No photo</span>
              </div>
            )}
            {pricing.percent !== null && (
              <span className="absolute left-3 top-3 rounded-[6px] bg-deal px-2.5 py-1 text-[15px] font-bold leading-5 text-deal-foreground tabular-prices">
                -{pricing.percent}%
              </span>
            )}
            {isOut && (
              <span className="absolute bottom-3 left-3 rounded-full border border-input bg-background px-3 py-1 text-sm font-semibold">
                Out of stock
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Link to={retailerHref} className="flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:text-primary-strong">
              <Store className="h-4 w-4" aria-hidden="true" />
              {retailer} · more deals
            </Link>
            <h1 className="text-[22px] font-bold leading-[30px] lg:text-[28px] lg:leading-9">{product.name}</h1>
            {avgRating !== null && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-[#B45309] text-[#B45309]" aria-hidden="true" />
                {avgRating.toFixed(1)} out of 5 · {ratings.length} {ratings.length === 1 ? "rating" : "ratings"}
              </p>
            )}

            {isOut && (
              <div role="status" className="flex flex-col gap-3 rounded-lg bg-muted p-4">
                <div>
                  <strong className="text-[15px]">Out of stock at {retailer}</strong>
                  <p className="text-sm text-muted-foreground">Save it and check back, or see similar deals below.</p>
                </div>
                <Button variant="outline" onClick={() => toggleSave(product)} aria-pressed={saved} className="self-start">
                  <Heart className={cn(saved && "fill-current")} aria-hidden="true" />
                  {saved ? "Saved" : "Save for later"}
                </Button>
              </div>
            )}

            <PriceBlock product={product} />

            <div className="flex flex-col gap-1.5">
              {ends && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-deal-text">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Deal ends {ends}
                </span>
              )}
              <StockLine product={product} />
            </div>

            {!isOut && (
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex-1">{buyControls}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleSave(product)}
                  aria-pressed={saved}
                  aria-label={saved ? "Remove from saved" : "Save deal"}
                  className="rounded-full border-input text-foreground"
                >
                  <Heart className={cn(saved && "fill-deal-text text-deal-text")} aria-hidden="true" />
                </Button>
              </div>
            )}

            <div className="flex gap-3 rounded-lg border p-4">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm">
                <strong className="block text-[15px]">Delivery fee calculated at checkout</strong>
                <span className="text-muted-foreground">It depends on your area. You’ll see the exact fee before you pay.</span>
              </div>
            </div>

            <section aria-labelledby="about-heading" className="flex flex-col gap-3 border-t pt-4">
              <h2 id="about-heading" className="text-lg font-bold">About this deal</h2>
              {product.description && <p className="whitespace-pre-line text-[15px] leading-6">{product.description}</p>}
              {product.tags?.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {product.tags.map((t) => {
                    const name = typeof t === "string" ? t : (t as { name: string }).name;
                    return (
                      <li key={name} className="flex h-8 items-center rounded-full bg-secondary px-3 text-[13px] font-medium">
                        #{name}
                      </li>
                    );
                  })}
                </ul>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                {product.category?.name && (
                  <>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>{product.category.name}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Sold by</dt>
                <dd>{retailer}</dd>
                {pricing.was !== null && product.discount_start && product.discount_end && (
                  <>
                    <dt className="text-muted-foreground">Deal dates</dt>
                    <dd>
                      {shortDate(product.discount_start)} – {shortDate(product.discount_end)}
                    </dd>
                  </>
                )}
              </dl>
            </section>
          </div>
        </div>

        {suggestions.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10 flex flex-col gap-3 lg:mt-14 lg:gap-4">
            <div className="flex items-end justify-between">
              <h2 id="related-heading" className="text-lg font-bold lg:text-2xl">
                {isOut ? "Similar deals" : "Related deals"}
              </h2>
              <Link to={product.category?.id ? `/products?category=${product.category.id}` : "/products"} className="-mr-3 flex min-h-12 items-center px-3 text-sm font-bold text-primary lg:mr-0">
                See all
              </Link>
            </div>
            <ul className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-6 lg:px-0">
              {suggestions.map((p) => (
                <li key={p.id} className="flex w-[156px] shrink-0 snap-start lg:w-auto [&:nth-child(n+6)]:lg:hidden">
                  <DealCard product={p} className="w-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Mobile sticky buy bar above the tab bar */}
      {!isOut && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-sticky border-t bg-background px-4 py-3 shadow-lg lg:hidden">
          {buyControls}
        </div>
      )}
    </Layout>
  );
};

export default ProductDetail;
