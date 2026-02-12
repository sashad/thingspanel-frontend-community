/**
 * Main script engine class
 * Integrate all components，Provide a unified script execution interface
 */

import type {
  IScriptEngine,
  IScriptExecutor,
  IScriptSandbox,
  IScriptTemplateManager,
  IScriptContextManager,
  ScriptEngineConfig,
  ScriptExecutionResult,
  ScriptConfig
} from './types'
import { ScriptExecutor, defaultScriptConfig } from '@/core/script-engine/executor'
import { ScriptSandbox, defaultSandboxConfig } from '@/core/script-engine/sandbox'
import { ScriptTemplateManager } from '@/core/script-engine/template-manager'
import { ScriptContextManager } from '@/core/script-engine/context-manager'
import { initializeBuiltInTemplates } from '@/core/script-engine/templates/built-in-templates'

/**
 * Main script engine implementation class
 */
export class ScriptEngine implements IScriptEngine {
  public readonly executor: IScriptExecutor
  public readonly sandbox: IScriptSandbox
  public readonly templateManager: IScriptTemplateManager
  public readonly contextManager: IScriptContextManager

  private config: ScriptEngineConfig

  constructor(config?: Partial<ScriptEngineConfig>) {
    this.config = {
      defaultScriptConfig,
      sandboxConfig: defaultSandboxConfig,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5minute
      maxConcurrentExecutions: 10,
      enablePerformanceMonitoring: true,
      ...config
    }

    // Initialize each component
    this.executor = new ScriptExecutor()
    this.sandbox = new ScriptSandbox(this.config.sandboxConfig)
    this.templateManager = new ScriptTemplateManager()
    this.contextManager = new ScriptContextManager()

    // Initialize the built-in template library
    const templateStats = initializeBuiltInTemplates(this.templateManager)
  }

  /**
   * Quickly execute scripts
   */
  async execute<T = any>(code: string, context?: Record<string, any>): Promise<ScriptExecutionResult<T>> {
    const displayCode = code ? code.substring(0, 100) + (code.length > 100 ? '...' : '') : '[empty script]'
    // Create script configuration
    const scriptConfig: ScriptConfig = {
      ...this.config.defaultScriptConfig,
      code
    }

    // Create or get execution context
    let executionContext = undefined
    if (context) {
      executionContext = this.contextManager.createContext('temporary context', context)
    }

    try {
      const result = await this.executor.execute<T>(scriptConfig, executionContext)

      // Clean up temporary context
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }
      return result
    } catch (error) {
      // Clean up temporary context
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }
      throw error
    }
  }

  /**
   * Execute using template
   */
  async executeTemplate<T = any>(
    templateId: string,
    parameters: Record<string, any>
  ): Promise<ScriptExecutionResult<T>> {
    try {
      // Generate code based on template
      const code = this.templateManager.generateCode(templateId, parameters)

      // Execute the generated code
      return await this.execute<T>(code)
    } catch (error) {
      throw error
    }
  }

  /**
   * Execute scripts in batches
   */
  async executeBatch<T = any>(
    scripts: Array<{ code: string; context?: Record<string, any> }>
  ): Promise<ScriptExecutionResult<T>[]> {
    const promises = scripts.map(script => this.execute<T>(script.code, script.context))
    return await Promise.all(promises)
  }

  /**
   * Execute the script and return streaming results
   */
  async executeStream<T = any>(
    code: string,
    context?: Record<string, any>,
    onUpdate?: (result: Partial<ScriptExecutionResult<T>>) => void
  ): Promise<ScriptExecutionResult<T>> {
    // Create script configuration
    const scriptConfig: ScriptConfig = {
      ...this.config.defaultScriptConfig,
      code
    }

    // Create execution context
    let executionContext = undefined
    if (context) {
      executionContext = this.contextManager.createContext('streaming context', context)
    }

    try {
      // If an update callback is provided，Send start status first
      if (onUpdate) {
        onUpdate({
          success: false,
          executionTime: 0,
          logs: [
            {
              level: 'info',
              message: 'The script starts executing...',
              timestamp: Date.now()
            }
          ]
        })
      }

      const result = await this.executor.execute<T>(scriptConfig, executionContext)

      // Send final result
      if (onUpdate) {
        onUpdate(result)
      }

      // clear context
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      return result
    } catch (error) {
      // clear context
      if (executionContext) {
        this.contextManager.deleteContext(executionContext.id)
      }

      throw error
    }
  }

  /**
   * Verify script syntax
   */
  validateScript(code: string): { valid: boolean; error?: string } {
    return this.executor.validateSyntax(code)
  }

  /**
   * Check script security
   */
  checkScriptSecurity(code: string): { safe: boolean; issues: string[] } {
    return this.sandbox.checkCodeSecurity(code)
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    return {
      executor: this.executor.getExecutionStats(),
      templates: {
        total: this.templateManager.getAllTemplates().length,
        byCategory: this.getTemplatesByCategory()
      },
      contexts: {
        total: this.contextManager.getAllContexts().length,
        active: this.contextManager.getAllContexts().filter(
          ctx => Date.now() - ctx.updatedAt < 24 * 60 * 60 * 1000 // 24Active within hours
        ).length
      }
    }
  }

  /**
   * Get the number of templates by category
   */
  private getTemplatesByCategory(): Record<string, number> {
    const templates = this.templateManager.getAllTemplates()
    const stats: Record<string, number> = {}

    templates.forEach(template => {
      stats[template.category] = (stats[template.category] || 0) + 1
    })

    return stats
  }

  /**
   * Get engine configuration
   */
  getConfig(): ScriptEngineConfig {
    return { ...this.config }
  }

  /**
   * Update engine configuration
   */
  updateConfig(config: Partial<ScriptEngineConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Warm up engine（Execute some initialization scripts to improve subsequent performance）
   */
  async warmup(): Promise<void> {
    const warmupScripts = [
      'return "Hello World"',
      'return Math.random()',
      'return new Date().toISOString()',
      'return [1, 2, 3].map(x => x * 2)'
    ]

    for (const script of warmupScripts) {
      try {
        await this.execute(script)
      } catch (error) {}
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // clear all context
    const contexts = this.contextManager.getAllContexts()
    contexts.forEach(context => {
      this.contextManager.deleteContext(context.id)
    })
  }

  /**
   * Export engine status
   */
  exportState(): any {
    return {
      config: this.config,
      stats: this.getExecutionStats(),
      templates: this.templateManager.getAllTemplates(),
      contexts: this.contextManager.getAllContexts(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Import engine status
   */
  importState(state: any): boolean {
    try {
      // Import configuration
      if (state.config) {
        this.updateConfig(state.config)
      }

      // Import template
      if (state.templates && Array.isArray(state.templates)) {
        state.templates.forEach((template: any) => {
          if (!template.isSystem) {
            // Only import non-system templates
            this.templateManager.createTemplate(template)
          }
        })
      }

      // import context
      if (state.contexts && Array.isArray(state.contexts)) {
        state.contexts.forEach((context: any) => {
          this.contextManager.createContext(context.name, context.variables)
        })
      }
      return true
    } catch (error) {
      return false
    }
  }
}

/**
 * Default script engine instance
 */
export const defaultScriptEngine = new ScriptEngine()

// Warm up in development environment
if (process.env.NODE_ENV === 'development') {
  defaultScriptEngine.warmup().catch(console.error)
}
