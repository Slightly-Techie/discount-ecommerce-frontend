import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Clock, Heart, ImageOff, Plus, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatGHS } from "@/lib/price";
import { dealPricing, endLabel, productImage, retailerName, stockState } from "@/lib/deal";
import { useDealActions } from "@/hooks/useDealActions";
import type { Product } from "@/types/product";

interface DealCardProps {
  product: Product;
  /** Above-the-fold cards load eagerly with high fetch priority. */
  priority?: boolean;
  className?: string;
}

// Design system v1 deal card. States: default, saved, low stock, out of stock,
// no discount, no image. The title link stretches over the card; the heart and
// add buttons sit above it so there are no nested interactive elements.
export function DealCard({ product, priority = false, className }: DealCardProps) {
  const { add, toggleSave, isSaved } = useDealActions();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(t);
  }, [justAdded]);

  const pricing = dealPricing(product);
  const ends = endLabel(product);
  const stock = stockState(product.stock);
  const isOut = stock === "out";
  const saved = isSaved(product.id);
  const image = productImage(product);
  const href = `/products/${product.id}`;

  const handleAdd = async () => {
    if (await add(product)) setJustAdded(true);
  };

  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-lg border bg-card", className)}>
      <div className="relative flex aspect-square flex-col items-center justify-center gap-1.5 bg-secondary">
        {image ? (
          <img
            src={image}
            alt=""
            width={320}
            height={320}
            loading={priority ? "eager" : "lazy"}
            {...(priority ? { fetchpriority: "high" } : {})}
            decoding="async"
            className={cn("h-full w-full object-contain p-2", isOut && "opacity-[0.45]")}
          />
        ) : (
          <>
            <ImageOff className="h-10 w-10 text-[#8E9896]" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">No photo</span>
          </>
        )}

        {pricing.percent !== null && (
          <span className="absolute left-2 top-2 rounded-[6px] bg-deal px-2 py-[3px] text-[13px] font-bold leading-[18px] text-deal-foreground tabular-prices">
            -{pricing.percent}%
          </span>
        )}
        {isOut && (
          <span className="absolute bottom-2 left-2 rounded-full border border-input bg-background px-2.5 py-1 text-xs font-semibold">
            Out of stock
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleSave(product)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className="group/heart absolute right-0 top-0 z-10 flex h-12 w-12 items-center justify-center focus-visible:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-[0_1px_2px_rgba(17,17,17,0.12)] group-focus-visible/heart:ring-2 group-focus-visible/heart:ring-ring">
            <Heart
              className={cn("h-5 w-5", saved ? "fill-deal-text text-deal-text" : "text-foreground")}
              aria-hidden="true"
            />
          </span>
        </button>

        {!isOut && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={justAdded ? `${product.name} added to cart` : `Add ${product.name} to cart`}
            className="group/add absolute bottom-0 right-0 z-10 flex h-12 w-12 items-center justify-center focus-visible:outline-none"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_1px_2px_rgba(17,17,17,0.16)] transition-colors duration-fast group-focus-visible/add:ring-2 group-focus-visible/add:ring-ring group-focus-visible/add:ring-offset-2",
                justAdded ? "bg-save" : "bg-primary group-hover/add:bg-primary-hover"
              )}
            >
              {justAdded ? (
                <Check className="h-[22px] w-[22px]" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Plus className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden="true" />
              )}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col px-3 pb-3 pt-2.5">
        <div className="flex min-h-6 flex-wrap items-baseline gap-1.5">
          <span
            className={cn(
              "text-lg font-bold leading-6 tracking-[-0.01em] tabular-prices",
              isOut ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {formatGHS(pricing.price)}
          </span>
          {pricing.was !== null && (
            <s className="text-[13px] leading-[18px] text-subtle tabular-prices">
              <span className="sr-only">Was </span>
              {formatGHS(pricing.was)}
            </s>
          )}
        </div>
        <div className="mt-0.5 min-h-[18px]">
          {pricing.save !== null && (
            <span className="text-[13px] font-semibold leading-[18px] text-save tabular-prices">
              Save {formatGHS(pricing.save)}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 min-h-10 text-sm font-medium leading-5 line-clamp-2" title={product.name}>
          <Link
            to={href}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex min-w-0 items-center gap-1 text-xs leading-4 text-muted-foreground">
          <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate font-medium">{retailerName(product)}</span>
        </div>
        <div className="mt-1 flex min-h-4 gap-2.5 whitespace-nowrap text-xs font-semibold leading-4 text-deal-text">
          {ends && !isOut && (
            <span className="flex items-center gap-1">
              <Clock className="h-[13px] w-[13px]" strokeWidth={2.25} aria-hidden="true" />
              {ends}
            </span>
          )}
          {stock === "low" && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-[13px] w-[13px]" strokeWidth={2.25} aria-hidden="true" />
              Low stock
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function DealCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border bg-card">
      <div className="aspect-square bg-skeleton" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-5 w-[62%] rounded-[6px] bg-skeleton" />
        <div className="h-3.5 w-[44%] rounded-[6px] bg-skeleton" />
        <div className="h-3.5 w-[96%] rounded-[6px] bg-skeleton" />
        <div className="h-3.5 w-[70%] rounded-[6px] bg-skeleton" />
        <div className="mt-1 h-3 w-[48%] rounded-[6px] bg-skeleton" />
      </div>
    </div>
  );
}
