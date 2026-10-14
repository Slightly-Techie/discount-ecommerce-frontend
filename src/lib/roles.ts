// Mirrors backend permissions in api/common/permissions.py

/** IsAdminOrManager: role admin/manager, staff or superuser. Can open the admin portal. */
export const canAccessAdminPortal = (user: any): boolean =>
  !!user && (user.role === "admin" || user.role === "manager" || !!user.is_staff || !!user.is_superuser);

/** IsPlatformAdmin: role admin, staff or superuser (managers excluded). Can manage users. */
export const canManageUsers = (user: any): boolean =>
  !!user && (user.role === "admin" || !!user.is_staff || !!user.is_superuser);
