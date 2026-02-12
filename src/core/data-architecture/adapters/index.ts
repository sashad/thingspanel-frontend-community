/**
 * Configure adapter module export index
 * Provide configuration version conversion and compatibility processing functions
 */

// ==================== Main adapter class export ====================
export { ConfigurationAdapter, createConfigurationAdapter, type ConversionResult } from '@/core/data-architecture/adapters/ConfigurationAdapter'

// ==================== Convenient function export ====================
export { detectConfigVersion, upgradeToV2, downgradeToV1 } from '@/core/data-architecture/adapters/ConfigurationAdapter'

// ==================== Adapter version information ====================
export const ADAPTER_VERSION = '1.0.0'

export const ADAPTER_FEATURES = {
  VERSION_DETECTION: true,
  LOSSLESS_UPGRADE: true,
  COMPATIBLE_DOWNGRADE: true,
  BATCH_CONVERSION: true,
  VALIDATION: true
} as const
