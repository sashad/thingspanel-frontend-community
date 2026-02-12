/**
 * Global script processing engine
 * provide safeJavaScriptScript execution environment，Support templates、Sandbox and extended functionality
 *
 * Main functions：
 * - Secure script execution environment
 * - Script template management
 * - Execution context management
 * - Error handling and logging
 * - Asynchronous script support
 */

export * from '@/core/script-engine/types'
export * from '@/core/script-engine/executor'
export * from '@/core/script-engine/sandbox'
export * from '@/core/script-engine/template-manager'
export * from '@/core/script-engine/context-manager'
export * from '@/core/script-engine/script-engine'

// Export default script engine instance
export { defaultScriptEngine } from '@/core/script-engine/script-engine'
