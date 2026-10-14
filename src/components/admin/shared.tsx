import { ReactNode, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ListParams, PaginatedResponse } from "@/types";

export const ADMIN_PAGE_SIZE = 20;

/** Pull a readable message out of a DRF error response. */
export function apiErrorMessage(error: any, fallback = "Something went wrong. Please try again."): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  const first = Object.entries(data)[0];
  if (first) {
    const [field, value] = first;
    const msg = Array.isArray(value) ? value[0] : value;
    return field === "non_field_errors" ? String(msg) : `${field}: ${msg}`;
  }
  return fallback;
}

export function formatMoney(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Paginated + searchable list query for admin tables. */
export function useAdminList<T>(
  key: readonly unknown[],
  fetcher: (params: ListParams) => Promise<PaginatedResponse<T>>,
  extraParams: ListParams = {}
) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce search input so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params: ListParams = { page, page_size: ADMIN_PAGE_SIZE, ...extraParams };
  if (search) params.search = search;

  const query = useQuery({
    queryKey: [...key, params],
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    rows: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    page,
    setPage,
    search: searchInput,
    setSearch: setSearchInput,
  };
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function Pager({
  page,
  count,
  onPageChange,
  isFetching,
  pageSize = ADMIN_PAGE_SIZE,
}: {
  page: number;
  count: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  pageSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  return (
    <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t text-sm text-muted-foreground">
      <span className="flex items-center gap-2">
        {from}–{to} of {count}
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ConfirmDelete({
  onConfirm,
  title = "Delete this item?",
  description = "This action cannot be undone.",
  disabled,
  trigger,
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
  disabled?: boolean;
  trigger?: ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" disabled={disabled} aria-label="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}
