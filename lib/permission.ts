import { loadSystemConfig } from '@/lib/system-config';

/**
 * Checks if a user's role is included in an allowed list.
 * ROOT bypasses all checks.
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === 'ROOT') return true;
  return allowedRoles.includes(userRole);
}

/**
 * Determines whether the authenticated user can edit the target user.
 * - ROOT can edit any user, including other ROOTs.
 * - Non‑ROOT cannot edit a ROOT user.
 * - Non‑ROOT cannot edit a user with equal or higher priority (except themselves).
 */
export function canEditTarget(
  authRole: string,
  authId: string,
  targetRole: string,
  targetId: string,
  rolePriority: Record<string, number>
): boolean {
  if (authRole === 'ROOT') return true;

  if (targetRole === 'ROOT') return false;

  if (authId === targetId) return true;

  const authPriority = rolePriority[authRole] ?? 0;
  const targetPriority = rolePriority[targetRole] ?? 0;

  return authPriority > targetPriority;
}

/**
 * Checks whether a system feature is enabled for a given role.
 * ROOT bypasses the feature flag.
 */
export function isFeatureEnabled(
  feature: keyof ReturnType<typeof loadSystemConfig>,
  role: string
): boolean {
  const config = loadSystemConfig();
  if (role === 'ROOT') return true;
  return !!config[feature];
}
