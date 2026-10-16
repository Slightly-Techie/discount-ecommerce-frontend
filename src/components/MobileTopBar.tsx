import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { SearchField } from "@/components/SearchField";

export type MobileBar =
  /** Logo row that scrolls away, plus a sticky search row. */
  | { kind: "home" }
  /** Back button and the search field. */
  | { kind: "search"; back?: string }
  /** Back button and a page title, with optional actions on the right. */
  | { kind: "title"; title: string; back?: string; actions?: React.ReactNode };

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex min-h-12 shrink-0 items-center", className)}>
      <img src="/icons/Main Logo.svg" alt="GrottoMore home" className="h-12 w-12 lg:h-16 lg:w-16" width={64} height={64} />
    </Link>
  );
}

function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (to ? navigate(to) : window.history.length > 1 ? navigate(-1) : navigate("/"))}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}

// Mobile top bar (below lg): sticky, white, 1px bottom border, shadow-sm once scrolled.
export function MobileTopBar({ bar }: { bar: MobileBar }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (bar.kind === "home") {
    return (
      <>
        <div className="flex h-[52px] items-center justify-between bg-background pl-4 pr-2 lg:hidden">
          <Logo />
        </div>
        <div
          className={cn(
            "sticky top-0 z-sticky border-b bg-background px-4 pb-3 pt-1 lg:hidden",
            scrolled && "shadow-sm"
          )}
        >
          <SearchField />
        </div>
      </>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-sticky flex items-center gap-1 border-b bg-background lg:hidden",
        bar.kind === "search" ? "h-16 pl-1 pr-4" : "h-14 px-1",
        scrolled && "shadow-sm"
      )}
    >
      <BackButton to={bar.back} />
      {bar.kind === "search" ? (
        <SearchField className="flex-1" />
      ) : (
        <>
          <h1 className="flex-1 truncate text-lg font-bold leading-[26px]">{bar.title}</h1>
          {bar.actions && <div className="flex">{bar.actions}</div>}
        </>
      )}
    </header>
  );
}
