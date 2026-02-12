/**
 * Permission tool function
 * Simplified permission checking system
 */

import type { ComponentDefinition, UserAuthority } from '../types'

/**
 * Get user permissions from storage
 */
export function getUserAuthorityFromStorage(): UserAuthority {
  try {
    // Here the user permissions should be obtained from the actual storage
    // Temporarily return to default value
    return 'TENANT_ADMIN'
  } catch (error) {
    console.warn('❌ [permission] Failed to obtain user permissions，Use default permissions')
    return 'TENANT_ADMIN'
  }
}

/**
 * Check component permissions
 */
export function checkComponentPermission(definition: ComponentDefinition, userAuthority?: UserAuthority): boolean {
  const permission = definition.permission || 'NO_LIMIT'
  const authority = userAuthority || getUserAuthorityFromStorage()

  // If the component permissions are"NO_LIMIT"，then all users can access
  if (permission === 'NO_LIMIT') {
    return true
  }

  // If the user permission is"NO_LIMIT"，You cannot access any permission-restricted components
  if (authority === 'NO_LIMIT') {
    return false
  }

  // Permission level check
  const permissionLevels = {
    SYS_ADMIN: 4,
    TENANT_ADMIN: 3,
    TENANT_USER: 2,
    NO_LIMIT: 1
  }

  const componentLevel = permissionLevels[permission as keyof typeof permissionLevels]
  const userLevel = permissionLevels[authority as keyof typeof permissionLevels] || 0
  const hasPermission = userLevel >= componentLevel

  return hasPermission
}

/**
 * Filter component list（by permissions）
 */
export function filterComponentsByPermission(components: ComponentDefinition[]): ComponentDefinition[] {
  const userAuthority = getUserAuthorityFromStorage()
  return components.filter(component => checkComponentPermission(component, userAuthority))
}
