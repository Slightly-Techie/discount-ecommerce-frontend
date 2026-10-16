import { FormEvent, useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchFieldProps {
  /** "pill" for the mobile bars, "joined" for the desktop header with its Search button. */
  variant?: "pill" | "joined";
  className?: string;
}

// Search is always a full field, never just an icon. Submitting opens the listing.
export function SearchField({ variant = "pill", className }: SearchFieldProps) {
  const id = useId();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("search") || "");

  useEffect(() => {
    setQuery(params.get("search") || "");
  }, [params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <form role="search" onSubmit={submit} className={cn("flex min-w-0", className)}>
      <label htmlFor={id} className="sr-only">
        Search deals
      </label>
      <div className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deals, brands, retailers"
          className={cn(
            "h-12 w-full border border-input bg-background pl-11 pr-4 text-base text-foreground placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            variant === "pill" ? "rounded-full" : "rounded-l-md border-r-0"
          )}
        />
      </div>
      {variant === "joined" && (
        <button
          type="submit"
          className="h-12 rounded-r-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Search
        </button>
      )}
    </form>
  );
}
