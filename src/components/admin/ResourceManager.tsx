import { ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { ListParams, PaginatedResponse } from "@/types";
import { ConfirmDelete, EmptyRow, Pager, SearchBox, apiErrorMessage, useAdminList } from "./shared";

export interface Option {
  value: string | number;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "boolean" | "datetime" | "date" | "select";
  required?: boolean;
  options?: Option[];
  /** Load select options from the API (first 100 results) */
  optionsQuery?: {
    key: readonly unknown[];
    fetch: (params: ListParams) => Promise<PaginatedResponse<any>>;
    toOption: (row: any) => Option;
  };
  step?: string;
  placeholder?: string;
  defaultValue?: unknown;
  help?: string;
}

export interface ColumnConfig<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface Api<T> {
  list: (params?: ListParams) => Promise<PaginatedResponse<T>>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: any, data: Partial<T>) => Promise<T>;
  remove: (id: any) => Promise<void>;
}

interface ResourceManagerProps<T extends { id: string | number }> {
  title: string;
  icon?: ReactNode;
  singular: string;
  queryKey: readonly unknown[];
  api: Api<T>;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  searchPlaceholder?: string;
  searchable?: boolean;
  /** Extra query keys to invalidate after a change (e.g. dependent lists) */
  invalidate?: readonly unknown[][];
  embedded?: boolean;
}

// Convert between API values and <input> values
const toInput = (field: FieldConfig, value: any) => {
  if (value === null || value === undefined) return field.type === "boolean" ? false : "";
  if (field.type === "datetime") return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
  return value;
};

const fromInput = (field: FieldConfig, value: any) => {
  if (field.type === "boolean") return !!value;
  if (value === "" || value === undefined) return field.required ? value : null;
  if (field.type === "datetime") return new Date(value).toISOString();
  if (field.type === "select" && field.optionsQuery && /^\d+$/.test(String(value))) return Number(value);
  return value;
};

function SelectField({ field, value, onChange }: { field: FieldConfig; value: any; onChange: (v: any) => void }) {
  const { data } = useQuery({
    queryKey: [...(field.optionsQuery?.key ?? ["noop"]), "options"],
    queryFn: () => field.optionsQuery!.fetch({ page_size: 100 }),
    enabled: !!field.optionsQuery,
  });
  const options = field.options ?? data?.results.map(field.optionsQuery!.toOption) ?? [];
  return (
    <select
      id={`field-${field.name}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">{field.required ? "Select…" : "None"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ResourceManager<T extends { id: string | number }>({
  title,
  icon,
  singular,
  queryKey,
  api,
  columns,
  fields,
  searchPlaceholder,
  searchable = true,
  invalidate = [],
  embedded = false,
}: ResourceManagerProps<T>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const list = useAdminList<T>(queryKey, api.list);
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (editing === null) return;
    const source: Record<string, any> = editing === "new" ? {} : (editing as any);
    setForm(
      Object.fromEntries(
        fields.map((f) => [f.name, toInput(f, editing === "new" ? f.defaultValue : source[f.name])])
      )
    );
  }, [editing, fields]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
    invalidate.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(fields.map((f) => [f.name, fromInput(f, form[f.name])])) as Partial<T>;
      return editing === "new" ? api.create(payload) : api.update((editing as T).id, payload);
    },
    onSuccess: () => {
      refresh();
      toast({ title: `${singular} ${editing === "new" ? "created" : "updated"}` });
      setEditing(null);
    },
    onError: (error) => toast({ title: "Save failed", description: apiErrorMessage(error), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: T["id"]) => api.remove(id),
    onSuccess: () => {
      refresh();
      toast({ title: `${singular} deleted` });
    },
    onError: (error) => toast({ title: "Delete failed", description: apiErrorMessage(error), variant: "destructive" }),
  });

  const body = (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {searchable && (
          <SearchBox value={list.search} onChange={list.setSearch} placeholder={searchPlaceholder} />
        )}
        <Button onClick={() => setEditing("new")} className={searchable ? "" : "ml-auto"}>
          <Plus className="h-4 w-4 mr-1" />
          Add {singular.toLowerCase()}
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.header} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <EmptyRow colSpan={columns.length + 1}>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Loading…
              </EmptyRow>
            ) : list.error ? (
              <EmptyRow colSpan={columns.length + 1}>
                <span className="text-destructive">{apiErrorMessage(list.error, "Failed to load.")}</span>
              </EmptyRow>
            ) : list.rows.length === 0 ? (
              <EmptyRow colSpan={columns.length + 1}>Nothing here yet.</EmptyRow>
            ) : (
              list.rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.header} className={c.className}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete
                      disabled={remove.isPending}
                      title={`Delete this ${singular.toLowerCase()}?`}
                      onConfirm={() => remove.mutate(row.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pager page={list.page} count={list.count} onPageChange={list.setPage} isFetching={list.isFetching} />

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Add" : "Edit"} {singular.toLowerCase()}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3 max-h-[65vh] overflow-y-auto pr-1"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {fields.map((f) => (
              <div key={f.name} className="space-y-1">
                {f.type === "boolean" ? (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch
                      checked={!!form[f.name]}
                      onCheckedChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
                    />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <Label htmlFor={`field-${f.name}`}>
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {f.type === "select" ? (
                      <SelectField
                        field={f}
                        value={form[f.name]}
                        onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))}
                      />
                    ) : f.type === "textarea" ? (
                      <Textarea
                        id={`field-${f.name}`}
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        id={`field-${f.name}`}
                        required={f.required}
                        placeholder={f.placeholder}
                        type={f.type === "datetime" ? "datetime-local" : f.type}
                        step={f.step}
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                      />
                    )}
                  </>
                )}
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
            ))}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) return body;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
