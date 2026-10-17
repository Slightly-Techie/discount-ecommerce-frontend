// Mirrors backend permissions in api/common/permissions.py

type RoleUser = { role?: string; is_staff?: boolean; is_superuser?: boolean } | null | undefined;

/** IsAdminOrManager: role admin/manager, staff or superuser. Can open the admin portal. */
export const canAccessAdminPortal = (user: RoleUser): boolean =>
  !!user && (user.role === "admin" || user.role === "manager" || !!user.is_staff || !!user.is_superuser);

/** IsPlatformAdmin: role admin, staff or superuser (managers excluded). Can manage users. */
export const canManageUsers = (user: RoleUser): boolean =>
  !!user && (user.role === "admin" || !!user.is_staff || !!user.is_superuser);

/** Order status update: vendor admins can't mark an order paid (GrottoMore confirms payments). */
export const canMarkOrdersPaid = (user: RoleUser): boolean => !!user && user.role !== "vendor_admin";

/** A vendor account (role vendor_admin). Used to keep other roles off the vendor dashboard. */
export const isVendorAdmin = (user: RoleUser): boolean => !!user && user.role === "vendor_admin";
