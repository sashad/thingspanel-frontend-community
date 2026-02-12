/**
 * Unified export of configuration modules
 * Configuration Module Unified Exports
 */

// Export security configuration
export * from './security'

/**
 * Configure module information
 * Configuration Module Information
 */
export const configInfo = {
  version: '1.0.0',
  description: 'ThingsPanel Frontend Configuration Module',
  modules: ['security'],
  lastUpdated: new Date().toISOString(),
} as const
