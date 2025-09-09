export type UserRole = 'GUEST' | 'WINERY_ADMIN' | 'PLATFORM_ADMIN';

export const ROLES = {
  GUEST: 'GUEST' as const,
  WINERY_ADMIN: 'WINERY_ADMIN' as const,
  PLATFORM_ADMIN: 'PLATFORM_ADMIN' as const,
} as const;

export const roleHierarchy = {
  [ROLES.GUEST]: 0,
  [ROLES.WINERY_ADMIN]: 1,
  [ROLES.PLATFORM_ADMIN]: 2,
};

export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessWineryAdmin(userRole: UserRole | undefined): boolean {
  return userRole === ROLES.WINERY_ADMIN || userRole === ROLES.PLATFORM_ADMIN;
}

export function canAccessPlatformAdmin(userRole: UserRole | undefined): boolean {
  return userRole === ROLES.PLATFORM_ADMIN;
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case ROLES.GUEST:
      return 'Guest';
    case ROLES.WINERY_ADMIN:
      return 'Winery Administrator';
    case ROLES.PLATFORM_ADMIN:
      return 'Platform Administrator';
    default:
      return 'Unknown';
  }
}