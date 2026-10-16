import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertCircle, Search, SlidersHorizontal, X } from "lucide-react";

import { Layout } from "@/components/Layout";
import { DealCard, DealCardSkeleton } from "@/components/DealCard";
import { Button } from "@/components/ui/button";
import { RemovableChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { productApi } from "@/lib/api";
import type { ProductFilters } from "@/types/api";

const PAGE_SIZE = 24;

// The API orders by price, discount_price and created_at only, so "biggest saving"
// and "ending soon" are not offered as listing sorts.
const SORTS = [
  { value: "newest", label: "Newest", ordering: "-created_at" },
  { value: "price", label: "Price: low to high", ordering: "discount_price" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

interface ListingFilters {
  search: string;
  category: string;
  /** Retailer name (source_platform) or "vendor" for vendor deals. */
  retailer: string;
  sort: SortValue;
}

function readFilters(params: URLSearchParams): ListingFilters {
  const sort = params.get("sort");
  return {
    search: params.get("search") || "",
    category: params.get("category") || "",
    retailer: params.get("retailer") || "",
    sort: SORTS.some((s) => s.value === sort) ? (sort as SortValue) : "newest",
  };
}

function toApiParams(f: ListingFilters): ProductFilters {
  return {
    search: f.search || undefined,
    category: f.category || undefined,
    ordering: SORTS.find((s) => s.value === f.sort)?.ordering,
    ...(f.retailer === "vendor" ? { source: "internal" } : f.retailer ? { source_platform: f.retailer } : {}),
  };
}

const retailerLabel = (r: string) => (r === "vendor" ? "Vendor deals" : r);

interface FilterControlsProps {
  value: ListingFilters;
  onChange: (next: ListingFilters) => void;
  retailers: string[];
  categories: { id: string; name: string }[];
  idPrefix: string;
  showSort?: boolean;
}

function FilterControls({ value, onChange, retailers, categories, idPrefix, showSort }: FilterControlsProps) {
  const groups = [
    showSort
      ? {
          key: "sort" as const,
          legend: "Sort by",
          options: SORTS.map((s) => ({ value: s.value, label: s.label })),
          allLabel: null,
        }
      : null,
    retailers.length > 0
      ? {
          key: "retailer" as const,
          legend: "Retailer",
          options: retailers.map((r) => ({ value: r, label: retailerLabel(r) })),
          allLabel: "All retailers",
        }
      : null,
    categories.length > 0
      ? {
          key: "category" as const,
          legend: "Category",
          options: categories.map((c) => ({ value: c.id, label: c.name })),
          allLabel: "All categories",
        }
      : null,
  ].filter(Boolean) as {
    key: "sort" | "retailer" | "category";
    legend: string;
    options: { value: string; label: string }[];
    allLabel: string | null;
  }[];

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <fieldset key={g.key} className="flex flex-col">
          <legend className="mb-1 text-base font-bold">{g.legend}</legend>
          <RadioGroup
            value={value[g.key] || "__all"}
            onValueChange={(v) => onChange({ ...value, [g.key]: v === "__all" ? "" : v })}
            className="gap-0"
          >
            {g.allLabel && (
              <Label htmlFor={`${idPrefix}-${g.key}-all`} className="flex min-h-12 cursor-pointer items-center gap-3 text-base font-normal">
                <RadioGroupItem id={`${idPrefix}-${g.key}-all`} value="__all" />
                {g.allLabel}
              </Label>
            )}
            {g.options.map((o) => (
              <Label
                key={o.value}
                htmlFor={`${idPrefix}-${g.key}-${o.value}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 text-base font-normal [&:has([data-state=checked])]:font-semibold"
              >
                <RadioGroupItem id={`${idPrefix}-${g.key}-${o.value}`} value={o.value} />
                {o.label}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
      ))}
    </div>
  );
}

const Products = () => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const requestedPages = Math.max(1, Number(params.get("page")) || 1);
  const apiParams = useMemo(() => toApiParams(filters), [filters]);

  const { data: categoriesData } = useCategories();
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  // Retailer names come from recent deals; the API has no list of retailers.
  const { data: recent } = useProducts({ page_size: 48, ordering: "-created_at" });
  const retailers = useMemo(() => {
    const rows = recent?.results || [];
    const names = Array.from(new Set(rows.map((p) => p.source_platform?.trim()).filter(Boolean))) as string[];
    const list = names.sort();
    if (rows.some((p) => p.source === "internal")) list.push("vendor");
    if (filters.retailer && !list.includes(filters.retailer)) list.unshift(filters.retailer);
    return list;
  }, [recent, filters.retailer]);

  const query = useInfiniteQuery({
    queryKey: ["products", "listing", apiParams],
    queryFn: ({ pageParam }) => productApi.getProducts({ ...apiParams, page: pageParam, page_size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.next ? all.length + 1 : undefined),
  });
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const items = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data]);
  const total = data?.pages[0]?.count ?? 0;

  // Restore "Load more" depth from the URL so Back returns to the same spot.
  useEffect(() => {
    if (data && data.pages.length < requestedPages && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [data, requestedPages, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const setFilters = (next: ListingFilters) => {
    const p = new URLSearchParams();
    if (next.search) p.set("search", next.search);
    if (next.category) p.set("category", next.category);
    if (next.retailer) p.set("retailer", next.retailer);
    if (next.sort !== "newest") p.set("sort", next.sort);
    setParams(p);
  };

  // Load more: append, move focus to the first new card and announce it.
  const gridRef = useRef<HTMLUListElement>(null);
  const focusIndex = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const loadMore = async () => {
    focusIndex.current = items.length;
    const p = new URLSearchParams(params);
    p.set("page", String((data?.pages.length || 1) + 1));
    setParams(p, { replace: true });
    const result = await fetchNextPage();
    const added = (result.data?.pages.at(-1)?.results.length ?? 0);
    setAnnouncement(`${added} more ${added === 1 ? "deal" : "deals"} loaded`);
  };
  useEffect(() => {
    if (focusIndex.current === null) return;
    const link = gridRef.current?.children[focusIndex.current]?.querySelector<HTMLAnchorElement>("h3 a");
    if (link) {
      link.focus();
      focusIndex.current = null;
    }
  }, [items.length]);

  // Mobile sheet: choices are staged and only applied with "Show N results".
  const [sheetOpen, setSheetOpen] = useState(false);
  const [staged, setStaged] = useState<ListingFilters>(filters);
  const [debounced, setDebounced] = useState<ListingFilters>(filters);
  useEffect(() => {
    if (sheetOpen) {
      setStaged(filters);
      setDebounced(filters);
    }
  }, [sheetOpen, filters]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(staged), 300);
    return () => clearTimeout(t);
  }, [staged]);
  const stagedCount = useQuery({
    queryKey: ["products", "count", toApiParams(debounced)],
    queryFn: () => productApi.getProducts({ ...toApiParams(debounced), page_size: 1 }),
    enabled: sheetOpen,
  });

  const categoryName = categories.find((c) => String(c.id) === filters.category)?.name;
  const heading = filters.search
    ? `Results for “${filters.search}”`
    : categoryName || (filters.retailer ? retailerLabel(filters.retailer) : "All deals");
  const sortLabel = SORTS.find((s) => s.value === filters.sort)?.label.toLowerCase();

  const applied = [
    filters.search && { key: "search", label: `“${filters.search}”`, clear: { ...filters, search: "" } },
    filters.retailer && { key: "retailer", label: retailerLabel(filters.retailer), clear: { ...filters, retailer: "" } },
    filters.category && { key: "category", label: categoryName || "Category", clear: { ...filters, category: "" } },
  ].filter(Boolean) as { key: string; label: string; clear: ListingFilters }[];
  const clearAll = () => setFilters({ search: "", category: "", retailer: "", sort: filters.sort });

  return (
    <Layout mobileBar={{ kind: "search", back: "/" }}>
      <div className="container pb-12 pt-4 lg:pt-6">
        <nav aria-label="Breadcrumb" className="mb-2 hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
          <Link to="/" className="text-primary hover:text-primary-strong">
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{heading}</span>
        </nav>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold leading-8 lg:text-[30px] lg:leading-[38px]">{heading}</h1>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {isLoading ? "Loading deals" : `${total.toLocaleString("en-GB")} ${total === 1 ? "deal" : "deals"} · sorted by ${sortLabel}`}
            </p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span id="sort-label" className="text-sm font-semibold">
              Sort by
            </span>
            <Select value={filters.sort} onValueChange={(v) => setFilters({ ...filters, sort: v as SortValue })}>
              <SelectTrigger aria-labelledby="sort-label" className="h-12 w-56 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile: sticky Filter & Sort trigger */}
        <div className="sticky top-16 z-sticky -mx-4 mt-3 flex items-center gap-2 bg-background px-4 py-2 lg:hidden">
          <Button variant="outline" onClick={() => setSheetOpen(true)} className="shrink-0">
            <SlidersHorizontal aria-hidden="true" />
            Filter &amp; Sort
            {applied.length > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                <span className="sr-only">, filters applied: </span>
                {applied.length}
              </span>
            )}
          </Button>
        </div>

        <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-6">
          <aside aria-label="Filters" className="hidden lg:block">
            <div className="sticky top-4 flex flex-col gap-4 rounded-lg border p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                {applied.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Clear all
                  </Button>
                )}
              </div>
              <FilterControls value={filters} onChange={setFilters} retailers={retailers} categories={categories} idPrefix="side" />
            </div>
          </aside>

          <section aria-label="Results" className="min-w-0">
            {applied.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="hidden text-sm text-muted-foreground lg:inline">Applied:</span>
                {applied.map((a) => (
                  <RemovableChip key={a.key} label={a.label} onClick={() => setFilters(a.clear)} />
                ))}
                <Button variant="link" size="sm" onClick={clearAll} className="px-3">
                  Clear all
                </Button>
              </div>
            )}

            {isError ? (
              <div role="alert" className="flex flex-col items-center gap-2.5 py-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
                  <AlertCircle className="h-7 w-7" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-bold">We couldn’t load deals</h2>
                <p className="max-w-[360px] text-sm text-muted-foreground">
                  Check your mobile data or Wi-Fi, then try again. Your filters are kept.
                </p>
                <Button onClick={() => refetch()}>Try again</Button>
                <Link to="/favorites" className="min-h-12 content-center text-sm font-semibold text-primary">
                  Open your saved deals
                </Link>
              </div>
            ) : isLoading ? (
              <ul aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i}>
                    <DealCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Search}
                title={
                  filters.search
                    ? `No deals for “${filters.search}”${applied.length > 1 ? " with these filters" : ""}`
                    : "No deals match these filters"
                }
                description={
                  filters.search
                    ? "Try clearing your filters or searching a shorter word."
                    : "Try another retailer or category, or clear your filters."
                }
                action={
                  <>
                    {applied.length > 0 && <Button onClick={clearAll}>Clear filters</Button>}
                    {categories.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        to={`/products?category=${c.id}`}
                        className="flex h-12 items-center rounded-full bg-secondary px-4 text-sm font-medium hover:bg-skeleton"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </>
                }
              />
            ) : (
              <>
                <ul ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 xl:gap-6">
                  {items.map((p, i) => (
                    <li key={p.id} className="flex">
                      <DealCard product={p} priority={i < 2} className="w-full" />
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Showing {items.length.toLocaleString("en-GB")} of {total.toLocaleString("en-GB")} deals
                  </span>
                  {hasNextPage && (
                    <Button variant="outline" onClick={loadMore} disabled={isFetchingNextPage} className="min-w-48">
                      {isFetchingNextPage ? "Loading…" : `Load ${Math.min(PAGE_SIZE, total - items.length)} more`}
                    </Button>
                  )}
                </div>
              </>
            )}
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>
          </section>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          hideClose
          className="flex h-[100dvh] flex-col gap-0 rounded-none p-0 md:left-auto md:w-[480px]"
        >
          <div className="flex items-center justify-between border-b py-1 pl-1 pr-4">
            <SheetClose className="flex h-12 w-12 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Close and discard changes</span>
            </SheetClose>
            <SheetTitle className="flex-1 text-lg font-bold">Filter &amp; Sort</SheetTitle>
            <Button variant="ghost" size="sm" onClick={() => setStaged({ ...staged, category: "", retailer: "", sort: "newest" })}>
              Clear all
            </Button>
          </div>
          <SheetDescription className="sr-only">Choose filters, then show the results.</SheetDescription>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FilterControls value={staged} onChange={setStaged} retailers={retailers} categories={categories} idPrefix="sheet" showSort />
          </div>
          <div className="border-t px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-lg">
            <Button
              className="w-full"
              onClick={() => {
                setFilters(staged);
                setSheetOpen(false);
              }}
            >
              {stagedCount.isFetching || staged !== debounced
                ? "Show results"
                : `Show ${(stagedCount.data?.count ?? 0).toLocaleString("en-GB")} results`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default Products;
