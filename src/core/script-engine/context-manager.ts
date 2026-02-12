/**
 * Script execution context manager
 * Manage the context in which scripts are executed，Includes variables and functions
 */

import type { IScriptContextManager, ScriptExecutionContext } from '@/core/script-engine/types'
import { nanoid } from 'nanoid'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * Script context manager implementation class
 */
export class ScriptContextManager implements IScriptContextManager {
  private contexts: Map<string, ScriptExecutionContext>

  constructor() {
    this.contexts = new Map()
    this.initializeDefaultContexts()
  }

  /**
   * Create execution context
   */
  createContext(name: string, variables: Record<string, any> = {}): ScriptExecutionContext {
    const now = Date.now()
    const context: ScriptExecutionContext = {
      id: nanoid(),
      name,
      variables: { ...variables },
      functions: this.createBuiltinFunctions(),
      createdAt: now,
      updatedAt: now
    }

    this.contexts.set(context.id, context)
    return context
  }

  /**
   * Get context
   */
  getContext(id: string): ScriptExecutionContext | null {
    return this.contexts.get(id) || null
  }

  /**
   * Get all context
   */
  getAllContexts(): ScriptExecutionContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * Find context by name
   */
  getContextByName(name: string): ScriptExecutionContext | null {
    for (const context of this.contexts.values()) {
      if (context.name === name) {
        return context
      }
    }
    return null
  }

  /**
   * update context
   */
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean {
    const context = this.contexts.get(id)
    if (!context) {
      return false
    }

    const updatedContext: ScriptExecutionContext = {
      ...context,
      ...updates,
      id, // make sureIDnot be modified
      updatedAt: Date.now()
    }

    this.contexts.set(id, updatedContext)
    return true
  }

  /**
   * Remove context
   */
  deleteContext(id: string): boolean {
    return this.contexts.delete(id)
  }

  /**
   * Clone context
   */
  cloneContext(id: string, newName: string): ScriptExecutionContext | null {
    const sourceContext = this.contexts.get(id)
    if (!sourceContext) {
      return null
    }

    const now = Date.now()
    const clonedContext: ScriptExecutionContext = {
      id: nanoid(),
      name: newName,
      variables: smartDeepClone(sourceContext.variables), // Use smart deep copy
      functions: { ...sourceContext.functions }, // Just copy the function shallowly
      createdAt: now,
      updatedAt: now
    }

    this.contexts.set(clonedContext.id, clonedContext)
    return clonedContext
  }

  /**
   * merge context
   */
  mergeContexts(sourceId: string, targetId: string): boolean {
    const sourceContext = this.contexts.get(sourceId)
    const targetContext = this.contexts.get(targetId)

    if (!sourceContext || !targetContext) {
      return false
    }

    // merge variables（Variables of the target context take precedence）
    const mergedVariables = {
      ...sourceContext.variables,
      ...targetContext.variables
    }

    // merge function（Functions in the target context take precedence）
    const mergedFunctions = {
      ...sourceContext.functions,
      ...targetContext.functions
    }

    // Update target context
    return this.updateContext(targetId, {
      variables: mergedVariables,
      functions: mergedFunctions
    })
  }

  /**
   * Add variables to context
   */
  addVariable(contextId: string, name: string, value: any): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    context.variables[name] = value
    context.updatedAt = Date.now()
    return true
  }

  /**
   * Remove variables from context
   */
  removeVariable(contextId: string, name: string): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    delete context.variables[name]
    context.updatedAt = Date.now()
    return true
  }

  /**
   * Add function to context
   */
  addFunction(contextId: string, name: string, func: Function): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    context.functions[name] = func
    context.updatedAt = Date.now()
    return true
  }

  /**
   * Remove function from context
   */
  removeFunction(contextId: string, name: string): boolean {
    const context = this.contexts.get(contextId)
    if (!context) {
      return false
    }

    delete context.functions[name]
    context.updatedAt = Date.now()
    return true
  }

  /**
   * Create built-in functions
   */
  private createBuiltinFunctions(): Record<string, Function> {
    return {
      // Math functions
      random: Math.random,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      abs: Math.abs,
      max: Math.max,
      min: Math.min,

      // String functions
      trim: (str: string) => str.trim(),
      toUpperCase: (str: string) => str.toUpperCase(),
      toLowerCase: (str: string) => str.toLowerCase(),
      replace: (str: string, search: string | RegExp, replacement: string) => str.replace(search, replacement),

      // array function
      arrayMap: <T, R>(arr: T[], callback: (item: T, index: number) => R) => arr.map(callback),
      arrayFilter: <T>(arr: T[], callback: (item: T, index: number) => boolean) => arr.filter(callback),
      arrayReduce: <T, R>(arr: T[], callback: (acc: R, item: T, index: number) => R, initial: R) =>
        arr.reduce(callback, initial),
      arraySort: <T>(arr: T[], compareFunction?: (a: T, b: T) => number) => [...arr].sort(compareFunction),
      arrayUnique: <T>(arr: T[]) => [...new Set(arr)],

      // object function
      objectKeys: Object.keys,
      objectValues: Object.values,
      objectEntries: Object.entries,
      objectAssign: Object.assign,

      // Type checking function
      isArray: Array.isArray,
      isString: (value: any) => typeof value === 'string',
      isNumber: (value: any) => typeof value === 'number',
      isBoolean: (value: any) => typeof value === 'boolean',
      isObject: (value: any) => typeof value === 'object' && value !== null,
      isFunction: (value: any) => typeof value === 'function',
      isUndefined: (value: any) => value === undefined,
      isNull: (value: any) => value === null,

      // conversion function
      toString: String,
      toNumber: Number,
      parseJSON: JSON.parse,
      stringifyJSON: JSON.stringify,

      // time function
      getCurrentTime: () => Date.now(),
      getCurrentDate: () => new Date(),
      formatDate: (date: Date | number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        const seconds = String(d.getSeconds()).padStart(2, '0')

        return format
          .replace('YYYY', year.toString())
          .replace('MM', month)
          .replace('DD', day)
          .replace('HH', hours)
          .replace('mm', minutes)
          .replace('ss', seconds)
      }
    }
  }

  /**
   * Initialize the default context
   */
  private initializeDefaultContexts(): void {
    // Create default context
    this.createDefaultContext()

    // Create a data processing context
    this.createDataProcessingContext()

    // Create IoT device context
    this.createIoTDeviceContext()
  }

  /**
   * Create default context
   */
  private createDefaultContext(): void {
    const context = this.createContext('default context', {
      appName: 'ThingsPanel',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      currentUser: {
        id: 'guest',
        name: 'guest user',
        role: 'viewer'
      }
    })

    // Add common tool functions
    this.addFunction(context.id, 'generateId', () => nanoid())
    this.addFunction(context.id, 'sleep', (ms: number) => new Promise(resolve => setTimeout(resolve, ms)))
    this.addFunction(context.id, 'retry', async (fn: Function, maxAttempts: number = 3, delay: number = 1000) => {
      let lastError: Error
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error as Error
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }
      throw lastError!
    })
  }

  /**
   * Create a data processing context
   */
  private createDataProcessingContext(): void {
    const context = this.createContext('data processing context', {
      dataSource: 'default',
      batchSize: 100,
      timeout: 30000
    })

    // Add data processing function
    this.addFunction(context.id, 'validateData', (data: any, schema: any) => {
      // Simple data validation
      if (schema.required && !data) {
        throw new Error('Data cannot be empty')
      }
      return true
    })

    this.addFunction(context.id, 'transformData', (data: any, transformer: Function) => {
      if (Array.isArray(data)) {
        return data.map(transformer)
      }
      return transformer(data)
    })
  }

  /**
   * Create IoT device context
   */
  private createIoTDeviceContext(): void {
    const context = this.createContext('IoTdevice context', {
      deviceProtocol: 'mqtt',
      sampleRate: 1000, // millisecond
      deviceTypes: ['sensor', 'actuator', 'gateway'],
      dataFormat: 'json'
    })

    // Add toIoTRelated functions
    this.addFunction(context.id, 'parseDeviceMessage', (message: string) => {
      try {
        return JSON.parse(message)
      } catch {
        return { raw: message }
      }
    })

    this.addFunction(context.id, 'generateDeviceData', (deviceType: string) => {
      const baseData = {
        deviceId: nanoid(),
        timestamp: new Date().toISOString(),
        type: deviceType
      }

      switch (deviceType) {
        case 'sensor':
          return {
            ...baseData,
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40,
            pressure: 1000 + Math.random() * 50
          }
        case 'actuator':
          return {
            ...baseData,
            status: Math.random() > 0.5 ? 'on' : 'off',
            power: Math.random() * 100
          }
        case 'gateway':
          return {
            ...baseData,
            connectedDevices: Math.floor(Math.random() * 20),
            uptime: Math.floor(Math.random() * 86400)
          }
        default:
          return baseData
      }
    })
  }
}
