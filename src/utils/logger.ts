/**
 * Unified debugging log system - Enhanced version
 * Support development/Production environment switch，Avoid debugging information pollution in production environments
 */

// Log level enum
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Log configuration interface
interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix?: string
  timestamp?: boolean
}

// Default configuration：Enable all logs in the development environment，Production environment only enables warnings and errors
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: import.meta.env.DEV,
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  prefix: '[ThingsPanel]',
  timestamp: true
}

export default class Logger {
  private config: LoggerConfig
  moduleName: string = ''

  constructor(moduleName = '', config?: Partial<LoggerConfig>) {
    this.moduleName = moduleName
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Update log configuration
   */
  updateConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check if log level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.level
  }

  /**
   * Format log prefix
   */
  private formatPrefix(level: string): string {
    const prefix = this.config.prefix || '[App]'
    const timestamp = this.config.timestamp ? new Date().toLocaleTimeString() + ' -' : ''
    const moduleInfo = this.moduleName ? `[${this.moduleName}]` : ''
    return `${prefix}${moduleInfo}[${level}] ${timestamp}`
  }

  /**
   * Debuglevel log - Only shown in development environment
   */
  debug(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
  }

  /**
   * Infolevel log
   */
  info(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      console.info(this.formatPrefix('INFO'), ...args)
    }
  }

  /**
   * Warninglevel log
   */
  warn(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      console.error(this.formatPrefix('WARN'), ...args)
    }
  }

  /**
   * Errorlevel log
   */
  error(...args: any[]): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      console.error(this.formatPrefix('ERROR'), ...args)
    }
  }

  /**
   * condition log - Only if the condition istrueOutput only when
   */
  debugIf(condition: boolean, ...args: any[]): void {
    if (condition) this.debug(...args)
  }

  /**
   * Performance timing starts
   */
  time(label: string): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      console.time(`${this.formatPrefix('TIMER')} ${label}`)
    }
  }

  /**
   * Performance timer ends
   */
  timeEnd(label: string): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      console.timeEnd(`${this.formatPrefix('TIMER')} ${label}`)
    }
  }
}

// Create a logger factory function
export const createLogger = (moduleName: string, config?: Partial<LoggerConfig>) => new Logger(moduleName, config)

// Create a global default logger
export const logger = new Logger()

// Create dedicated loggers for commonly used modules
export const dataSourceLogger = createLogger('DataSource')
export const httpLogger = createLogger('HTTP')
export const componentLogger = createLogger('Component')
export const visualEditorLogger = createLogger('VisualEditor')
export const propertyBindingLogger = createLogger('PropertyBinding')

// Export type
export type { LoggerConfig }
