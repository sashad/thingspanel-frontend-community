/**
 * Script executor implementation
 * Responsible for actual script execution、Results processing and statistics collection
 */

import type {
  IScriptExecutor,
  ScriptConfig,
  ScriptExecutionContext,
  ScriptExecutionResult,
  ExecutionStats,
  ScriptLog
} from './types'
import { ScriptSandbox, defaultSandboxConfig } from '@/core/script-engine/sandbox'

/**
 * Script executor implementation class
 */
export class ScriptExecutor implements IScriptExecutor {
  private sandbox: ScriptSandbox
  private stats: ExecutionStats
  private executionCount = 0
  private executionTimes: number[] = []
  private currentExecutions = 0

  constructor() {
    this.sandbox = new ScriptSandbox(defaultSandboxConfig)
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      currentConcurrentExecutions: 0
    }
  }

  /**
   * Execute script
   */
  async execute<T = any>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>> {
    const startTime = Date.now()
    const logs: ScriptLog[] = []

    // increase concurrency count
    this.currentExecutions++
    this.stats.currentConcurrentExecutions = this.currentExecutions

    try {
      // Verify script syntax
      const syntaxCheck = this.validateSyntax(config.code)
      if (!syntaxCheck.valid) {
        throw new Error(`Script syntax error: ${syntaxCheck.error}`)
      }

      // Create execution environment
      const sandboxEnv = this.sandbox.createSandbox(defaultSandboxConfig)

      // Add context variables
      if (context) {
        Object.assign(sandboxEnv, context.variables)
        Object.assign(sandboxEnv, context.functions)
      }

      // Add custom global variables
      if (config.globals) {
        Object.assign(sandboxEnv, config.globals)
      }

      // Add log collector
      sandboxEnv.console = this.createLoggingConsole(logs)

      // Execute script
      const timeout = config.timeout || 5000
      const result = await this.sandbox.executeInSandbox(config.code, sandboxEnv, timeout)

      // Calculate execution time
      const executionTime = Date.now() - startTime
      this.updateStats(executionTime, true)

      // Destroy sandbox
      this.sandbox.destroySandbox(sandboxEnv)

      return {
        success: true,
        data: result,
        executionTime,
        contextSnapshot: context ? { ...context.variables } : undefined,
        logs
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.updateStats(executionTime, false)

      return {
        success: false,
        error: error as Error,
        executionTime,
        contextSnapshot: context ? { ...context.variables } : undefined,
        logs
      }
    } finally {
      // Reduce concurrency count
      this.currentExecutions--
      this.stats.currentConcurrentExecutions = this.currentExecutions
    }
  }

  /**
   * Verify script syntax
   */
  validateSyntax(code: string): { valid: boolean; error?: string } {
    try {
      // useFunctionConstructor validation syntax
      new Function(code)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): ExecutionStats {
    return { ...this.stats }
  }

  /**
   * Create a log collector
   */
  private createLoggingConsole(logs: ScriptLog[]) {
    const createLogMethod =
      (level: ScriptLog['level']) =>
      (...args: any[]) => {
        const log: ScriptLog = {
          level,
          message: args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '),
          timestamp: Date.now(),
          args
        }
        logs.push(log)

        // Simultaneously output to realconsole（with prefix）
        const realConsole = console as any
        if (realConsole[level]) {
          realConsole[level](`[ScriptEngine:${level.toUpperCase()}]`, ...args)
        }
      }

    return {
      log: createLogMethod('log'),
      warn: createLogMethod('warn'),
      error: createLogMethod('error'),
      info: createLogMethod('info'),
      debug: createLogMethod('debug')
    }
  }

  /**
   * Update execution statistics
   */
  private updateStats(executionTime: number, success: boolean): void {
    this.stats.totalExecutions++

    if (success) {
      this.stats.successfulExecutions++
    } else {
      this.stats.failedExecutions++
    }

    // Update execution time statistics
    this.executionTimes.push(executionTime)

    // keep recent1000Records of executions
    if (this.executionTimes.length > 1000) {
      this.executionTimes = this.executionTimes.slice(-1000)
    }

    // Update time statistics
    this.stats.maxExecutionTime = Math.max(this.stats.maxExecutionTime, executionTime)
    this.stats.minExecutionTime =
      this.stats.minExecutionTime === 0 ? executionTime : Math.min(this.stats.minExecutionTime, executionTime)

    this.stats.averageExecutionTime =
      this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      currentConcurrentExecutions: this.currentExecutions
    }
    this.executionTimes = []
  }
}

/**
 * Default script configuration
 */
export const defaultScriptConfig: ScriptConfig = {
  code: '',
  timeout: 5000,
  strictMode: true,
  asyncSupport: true,
  maxMemory: 50 * 1024 * 1024, // 50MB
  allowNetworkAccess: false,
  allowFileSystemAccess: false
}
