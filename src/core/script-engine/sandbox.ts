/**
 * Script security sandbox implementation
 * Provide a secure code execution environment，Prevent malicious code attacks
 */

import type { IScriptSandbox, SandboxConfig } from '@/core/script-engine/types'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * Script sandbox implementation class
 */
export class ScriptSandbox implements IScriptSandbox {
  private config: SandboxConfig

  constructor(config: SandboxConfig) {
    this.config = config
  }

  /**
   * Create a sandbox environment
   */
  createSandbox(config: SandboxConfig): any {
    const sandbox: any = {}

    // Add allowed global objects
    config.allowedGlobals.forEach(global => {
      switch (global) {
        case 'Math':
          sandbox.Math = Math
          break
        case 'Date':
          sandbox.Date = Date
          break
        case 'JSON':
          sandbox.JSON = JSON
          break
        case 'Promise':
          sandbox.Promise = Promise
          break
        case 'setTimeout':
          sandbox.setTimeout = setTimeout
          break
        case 'clearTimeout':
          sandbox.clearTimeout = clearTimeout
          break
        case 'setInterval':
          sandbox.setInterval = setInterval
          break
        case 'clearInterval':
          sandbox.clearInterval = clearInterval
          break
        case 'fetch':
          if (config.allowedGlobals.includes('fetch')) {
            sandbox.fetch = fetch
          }
          break
        case 'console':
          // provide safeconsoleaccomplish
          sandbox.console = this.createSafeConsole()
          break
        default:
          // Other safe global objects
          if (typeof window !== 'undefined' && global in window) {
            const value = (window as any)[global]
            if (typeof value !== 'function' || this.isSafeFunction(global)) {
              sandbox[global] = value
            }
          }
      }
    })

    // Add secure built-in tools
    sandbox._utils = this.createBuiltinUtils()

    return sandbox
  }

  /**
   * Execute code in a sandbox
   */
  async executeInSandbox(code: string, sandbox: any, timeout: number = 5000): Promise<any> {
    // Check code security
    const securityCheck = this.checkCodeSecurity(code)
    if (!securityCheck.safe) {
      throw new Error(`Code security check failed: ${securityCheck.issues.join(', ')}`)
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Script execution timeout'))
      }, timeout)

      try {
        // Create safe execution functions
        const wrappedCode = this.wrapCodeForExecution(code)
        const executor = new Function(
          'sandbox',
          `
          with (sandbox) {
            return (async function() {
              ${wrappedCode}
            })();
          }
        `
        )

        // Execute code
        const result = executor(sandbox)

        if (result instanceof Promise) {
          result
            .then(value => {
              clearTimeout(timeoutId)
              resolve(value)
            })
            .catch(error => {
              clearTimeout(timeoutId)
              reject(error)
            })
        } else {
          clearTimeout(timeoutId)
          resolve(result)
        }
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  /**
   * Destroy sandbox
   */
  destroySandbox(sandbox: any): void {
    // Clean up timers in sandbox
    if (sandbox._timers) {
      sandbox._timers.forEach((timer: any) => {
        if (timer.type === 'timeout') {
          clearTimeout(timer.id)
        } else if (timer.type === 'interval') {
          clearInterval(timer.id)
        }
      })
      sandbox._timers = []
    }

    // Clear sandbox objects
    Object.keys(sandbox).forEach(key => {
      delete sandbox[key]
    })
  }

  /**
   * Check code security
   */
  checkCodeSecurity(code: string): { safe: boolean; issues: string[] } {
    const issues: string[] = []

    // Check for dangerous keywords
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /new\s+Function/,
      /import\s*\(/,
      /require\s*\(/,
      /process\./,
      /global\./,
      /window\./,
      /document\./,
      /location\./,
      /navigator\./,
      /__proto__/,
      /constructor\s*\./,
      /prototype\s*\./
    ]

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(code)) {
        const patternNames = [
          'evalfunction call',
          'FunctionConstructor',
          'new Function',
          'dynamicimport',
          'requirecall',
          'processobject access',
          'globalobject access',
          'windowobject access',
          'documentobject access',
          'locationobject access',
          'navigatorobject access',
          '__proto__Property access',
          'constructorProperty access',
          'prototypeProperty access'
        ]
        issues.push(`Dangerous code pattern detected: ${patternNames[index]}`)
      }
    })

    // Check custom security policy
    if (this.config.customSecurityPolicy) {
      if (!this.config.customSecurityPolicy(code)) {
        issues.push('Custom security policy check failed')
      }
    }

    return {
      safe: issues.length === 0,
      issues
    }
  }

  /**
   * Wrap code for safe execution
   */
  private wrapCodeForExecution(code: string): string {
    // Add security wrappers before and after code
    return `
      // Redefine dangerous functions
      const eval = undefined;
      const Function = undefined;
      const require = undefined;
      // Notice：cannot be defined import variable，Because it is a reserved word
      
      // user code
      ${code}
    `
  }

  /**
   * Create a secureconsoleaccomplish
   */
  private createSafeConsole() {
    const logs: any[] = []

    return {
      log: (...args: any[]) => {
        logs.push({ level: 'log', args, timestamp: Date.now() })
      },
      warn: (...args: any[]) => {
        logs.push({ level: 'warn', args, timestamp: Date.now() })
      },
      error: (...args: any[]) => {
        logs.push({ level: 'error', args, timestamp: Date.now() })
      },
      info: (...args: any[]) => {
        logs.push({ level: 'info', args, timestamp: Date.now() })
      },
      debug: (...args: any[]) => {
        logs.push({ level: 'debug', args, timestamp: Date.now() })
      },
      _getLogs: () => logs
    }
  }

  /**
   * Create built-in utility functions
   */
  private createBuiltinUtils() {
    return {
      // Data generation tools
      mockData: {
        randomNumber: (min = 0, max = 100) => Math.random() * (max - min) + min,
        randomString: (length = 10) =>
          Math.random()
            .toString(36)
            .substring(2, length + 2),
        randomBoolean: () => Math.random() > 0.5,
        randomDate: (start?: Date, end?: Date) => {
          const startTime = start ? start.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000
          const endTime = end ? end.getTime() : Date.now()
          return new Date(startTime + Math.random() * (endTime - startTime))
        },
        randomArray: <T>(items: T[], count?: number) => {
          const actualCount = count || Math.floor(Math.random() * items.length) + 1
          const result: T[] = []
          for (let i = 0; i < actualCount; i++) {
            result.push(items[Math.floor(Math.random() * items.length)])
          }
          return result
        },
        randomObject: (template: Record<string, any>) => {
          const result: any = {}
          Object.keys(template).forEach(key => {
            const value = template[key]
            if (typeof value === 'function') {
              result[key] = value()
            } else {
              result[key] = value
            }
          })
          return result
        }
      },

      // data processing tools
      dataUtils: {
        deepClone: <T>(obj: T): T => smartDeepClone(obj),
        merge: (...objects: any[]) => Object.assign({}, ...objects),
        pick: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> => {
          const result: Partial<T> = {}
          keys.forEach(key => {
            if (key in obj) {
              result[key] = obj[key]
            }
          })
          return result
        },
        omit: <T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> => {
          const result: Partial<T> = {}
          Object.keys(obj).forEach(key => {
            if (!keys.includes(key as keyof T)) {
              result[key as keyof T] = obj[key as keyof T]
            }
          })
          return result
        },
        groupBy: <T>(array: T[], key: keyof T | ((item: T) => any)): Record<string, T[]> => {
          const result: Record<string, T[]> = {}
          array.forEach(item => {
            const groupKey = typeof key === 'function' ? key(item) : item[key]
            const groupKeyStr = String(groupKey)
            if (!result[groupKeyStr]) {
              result[groupKeyStr] = []
            }
            result[groupKeyStr].push(item)
          })
          return result
        },
        sortBy: <T>(array: T[], key: keyof T | ((item: T) => any)): T[] => {
          return [...array].sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key]
            const bVal = typeof key === 'function' ? key(b) : b[key]
            if (aVal < bVal) return -1
            if (aVal > bVal) return 1
            return 0
          })
        }
      },

      // time tool
      timeUtils: {
        now: () => Date.now(),
        format: (date: Date | number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
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
        },
        addDays: (date: Date, days: number) => {
          const result = new Date(date)
          result.setDate(result.getDate() + days)
          return result
        },
        diffDays: (date1: Date, date2: Date) => {
          const timeDiff = Math.abs(date2.getTime() - date1.getTime())
          return Math.ceil(timeDiff / (1000 * 3600 * 24))
        },
        startOfDay: (date: Date) => {
          const result = new Date(date)
          result.setHours(0, 0, 0, 0)
          return result
        },
        endOfDay: (date: Date) => {
          const result = new Date(date)
          result.setHours(23, 59, 59, 999)
          return result
        }
      }
    }
  }

  /**
   * Check if function is safe
   */
  private isSafeFunction(funcName: string): boolean {
    const safeFunctions = [
      'parseInt',
      'parseFloat',
      'isNaN',
      'isFinite',
      'encodeURIComponent',
      'decodeURIComponent',
      'encodeURI',
      'decodeURI'
    ]
    return safeFunctions.includes(funcName)
  }
}

/**
 * Default sandbox configuration
 */
export const defaultSandboxConfig: SandboxConfig = {
  enabled: true,
  allowedGlobals: [
    'Math',
    'Date',
    'JSON',
    'Promise',
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'console',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite'
  ],
  blockedGlobals: [
    'eval',
    'Function',
    'window',
    'document',
    'location',
    'navigator',
    'process',
    'global',
    'require',
    'import'
  ],
  allowEval: false,
  allowFunction: false,
  allowPrototypePollution: false
}
