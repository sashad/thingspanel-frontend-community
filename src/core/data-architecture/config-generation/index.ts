/**
 * Configure build module export
 * Contains simplified data source configuration generator
 */

// Configuration generator
export { SimpleConfigGenerator, simpleConfigGenerator } from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

// Backwards compatible alias export
export { simpleConfigGenerator as configGenerator } from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

// System object export（backwards compatible）
import { simpleConfigGenerator } from '@/core/data-architecture/config-generation/SimpleConfigGenerator'

export const dataSourceSystem = {
  // core components
  configGenerator: simpleConfigGenerator
}
