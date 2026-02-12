/**
 * Script engine type definition
 */

// Script execution result
export interface ScriptExecutionResult<T = any> {
  /** Whether the execution was successful */
  success: boolean
  /** Execution result data */
  data?: T
  /** error message */
  error?: Error
  /** Execution time（millisecond） */
  executionTime: number
  /** Execution context snapshot */
  contextSnapshot?: Record<string, any>
  /** Log output */
  logs: ScriptLog[]
}

// Script log
export interface ScriptLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  message: string
  timestamp: number
  args?: any[]
}

// Script configuration
export interface ScriptConfig {
  /** script code */
  code: string
  /** Execution timeout（millisecond） */
  timeout?: number
  /** Whether to enable strict mode */
  strictMode?: boolean
  /** Whether to enable asynchronous support */
  asyncSupport?: boolean
  /** Maximum memory usage（byte） */
  maxMemory?: number
  /** Custom global variables */
  globals?: Record<string, any>
  /** Whether to allow network requests */
  allowNetworkAccess?: boolean
  /** Whether to allow file system access */
  allowFileSystemAccess?: boolean
}

// script execution context
export interface ScriptExecutionContext {
  /** contextID */
  id: string
  /** context name */
  name: string
  /** context variables */
  variables: Record<string, any>
  /** built-in functions */
  functions: Record<string, Function>
  /** Context creation time */
  createdAt: number
  /** Context last updated time */
  updatedAt: number
}

// script template
export interface ScriptTemplate {
  /** templateID */
  id: string
  /** Template name */
  name: string
  /** Template description */
  description?: string
  /** Template classification */
  category: string
  /** template code */
  code: string
  /** template parameters */
  parameters: ScriptTemplateParameter[]
  /** Example usage */
  example?: string
  /** Is it a system template? */
  isSystem?: boolean
  /** creation time */
  createdAt: number
  /** Update time */
  updatedAt: number
}

// Script template parameters
export interface ScriptTemplateParameter {
  /** Parameter name */
  name: string
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  /** Parameter description */
  description?: string
  /** Is it necessary */
  required: boolean
  /** default value */
  defaultValue?: any
  /** Parameter validation rules */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    enum?: any[]
  }
}

// Sandbox configuration
export interface SandboxConfig {
  /** Whether to enable sandbox */
  enabled: boolean
  /** Allowed global objects */
  allowedGlobals: string[]
  /** Forbidden global objects */
  blockedGlobals: string[]
  /** Is it allowed?eval */
  allowEval: boolean
  /** Is it allowed?FunctionConstructor */
  allowFunction: boolean
  /** Whether prototype contamination is allowed */
  allowPrototypePollution: boolean
  /** Custom security policy */
  customSecurityPolicy?: (code: string) => boolean
}

// Script engine configuration
export interface ScriptEngineConfig {
  /** Default script configuration */
  defaultScriptConfig: ScriptConfig
  /** Sandbox configuration */
  sandboxConfig: SandboxConfig
  /** Whether to enable caching */
  enableCache: boolean
  /** cacheTTL（millisecond） */
  cacheTTL: number
  /** Maximum number of concurrent executions */
  maxConcurrentExecutions: number
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring: boolean
}

// Script Executor Interface
export interface IScriptExecutor {
  /** Execute script */
  execute<T = any>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>>
  /** Verify script syntax */
  validateSyntax(code: string): { valid: boolean; error?: string }
  /** Get execution statistics */
  getExecutionStats(): ExecutionStats
}

// Script sandbox interface
export interface IScriptSandbox {
  /** Create a sandbox environment */
  createSandbox(config: SandboxConfig): any
  /** Execute sandbox code */
  executeInSandbox(code: string, sandbox: any, timeout?: number): Promise<any>
  /** Destroy sandbox */
  destroySandbox(sandbox: any): void
  /** Check code security */
  checkCodeSecurity(code: string): { safe: boolean; issues: string[] }
}

// Script template manager interface
export interface IScriptTemplateManager {
  /** Get all templates */
  getAllTemplates(): ScriptTemplate[]
  /** Get templates by category */
  getTemplatesByCategory(category: string): ScriptTemplate[]
  /** Get the specified template */
  getTemplate(id: string): ScriptTemplate | null
  /** Create template */
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate
  /** Update template */
  updateTemplate(id: string, updates: Partial<ScriptTemplate>): boolean
  /** Delete template */
  deleteTemplate(id: string): boolean
  /** Generate code based on template */
  generateCode(templateId: string, parameters: Record<string, any>): string
}

// Context manager interface
export interface IScriptContextManager {
  /** Create execution context */
  createContext(name: string, variables?: Record<string, any>): ScriptExecutionContext
  /** Get context */
  getContext(id: string): ScriptExecutionContext | null
  /** update context */
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean
  /** Remove context */
  deleteContext(id: string): boolean
  /** Clone context */
  cloneContext(id: string, newName: string): ScriptExecutionContext | null
  /** merge context */
  mergeContexts(sourceId: string, targetId: string): boolean
}

// Script engine main interface
export interface IScriptEngine {
  /** script executor */
  executor: IScriptExecutor
  /** Script sandbox */
  sandbox: IScriptSandbox
  /** Template manager */
  templateManager: IScriptTemplateManager
  /** context manager */
  contextManager: IScriptContextManager

  /** Quickly execute scripts */
  execute<T = any>(code: string, context?: Record<string, any>): Promise<ScriptExecutionResult<T>>
  /** Execute using template */
  executeTemplate<T = any>(templateId: string, parameters: Record<string, any>): Promise<ScriptExecutionResult<T>>
  /** Get engine configuration */
  getConfig(): ScriptEngineConfig
  /** Update engine configuration */
  updateConfig(config: Partial<ScriptEngineConfig>): void
}

// Execution statistics
export interface ExecutionStats {
  /** Total execution times */
  totalExecutions: number
  /** Number of successful executions */
  successfulExecutions: number
  /** Number of failed executions */
  failedExecutions: number
  /** average execution time（millisecond） */
  averageExecutionTime: number
  /** Maximum execution time（millisecond） */
  maxExecutionTime: number
  /** Minimum execution time（millisecond） */
  minExecutionTime: number
  /** Current number of concurrent executions */
  currentConcurrentExecutions: number
}

// Built-in utility function types
export interface BuiltinUtilities {
  /** Data generation tools */
  mockData: {
    randomNumber: (min?: number, max?: number) => number
    randomString: (length?: number) => string
    randomBoolean: () => boolean
    randomDate: (start?: Date, end?: Date) => Date
    randomArray: <T>(items: T[], count?: number) => T[]
    randomObject: (template: Record<string, any>) => any
  }

  /** data processing tools */
  dataUtils: {
    deepClone: <T>(obj: T) => T
    merge: (...objects: any[]) => any
    pick: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]) => Partial<T>
    omit: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]) => Partial<T>
    groupBy: <T>(array: T[], key: keyof T | ((item: T) => any)) => Record<string, T[]>
    sortBy: <T>(array: T[], key: keyof T | ((item: T) => any)) => T[]
  }

  /** time tool */
  timeUtils: {
    now: () => number
    format: (date: Date | number, format: string) => string
    addDays: (date: Date, days: number) => Date
    diffDays: (date1: Date, date2: Date) => number
    startOfDay: (date: Date) => Date
    endOfDay: (date: Date) => Date
  }

  /** Network tools */
  networkUtils: {
    httpGet: (url: string, options?: RequestInit) => Promise<any>
    httpPost: (url: string, data: any, options?: RequestInit) => Promise<any>
    httpPut: (url: string, data: any, options?: RequestInit) => Promise<any>
    httpDelete: (url: string, options?: RequestInit) => Promise<any>
  }

  /** Logging tool */
  logger: {
    log: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    info: (...args: any[]) => void
    debug: (...args: any[]) => void
  }
}

// Predefined template categories
export enum TemplateCategory {
  DATA_GENERATION = 'data-generation',
  DATA_PROCESSING = 'data-processing',
  API_INTEGRATION = 'api-integration',
  TIME_SERIES = 'time-series',
  MATHEMATICAL = 'mathematical',
  VALIDATION = 'validation',
  TRANSFORMATION = 'transformation',
  UTILITY = 'utility',
  CUSTOM = 'custom'
}
