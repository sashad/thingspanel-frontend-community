/**
 * 🔥 Global loop detection and protection manager
 *
 * solve200+Loop triggering problem in component scenario：
 * 1. Detecting circular dependencies on configuration changes
 * 2. Prevent recursive execution of data sources
 * 3. Monitor cyclic updates of property bindings
 * 4. Provide performance statistics and debugging information
 */

export interface LoopDetectionConfig {
  maxDepth: number         // maximum recursion depth
  timeWindow: number       // time window (ms)
  maxCallsInWindow: number // Maximum number of calls within the time window
  enableDebug: boolean     // Whether to enable debugging output
}

export interface CallRecord {
  timestamp: number
  depth: number
  source: string
  componentId?: string
  action?: string
}

class LoopProtectionManager {
  private static instance: LoopProtectionManager | null = null

  // Configuration
  private config: LoopDetectionConfig = {
    maxDepth: 10,
    timeWindow: 5000,     // 5Second
    maxCallsInWindow: 50, // 5Most in seconds50calls
    enableDebug: process.env.NODE_ENV === 'development'
  }

  // call stack trace
  private callStacks = new Map<string, CallRecord[]>() // key: functionName
  private activeCallCounts = new Map<string, number>() // Current active call count

  // Call statistics within time window
  private callHistory = new Map<string, CallRecord[]>() // key: functionName

  // blacklist：Functions whose loops are detected are temporarily disabled
  private blacklistedFunctions = new Set<string>()
  private blacklistTimeouts = new Map<string, NodeJS.Timeout>()

  // Performance Statistics
  private performanceStats = {
    totalCallsBlocked: 0,
    totalLoopsDetected: 0,
    averageCallsPerSecond: 0,
    lastResetTime: Date.now()
  }

  private constructor() {
    this.setupGlobalErrorHandling()
    this.startPerformanceMonitoring()
  }

  public static getInstance(): LoopProtectionManager {
    if (!LoopProtectionManager.instance) {
      LoopProtectionManager.instance = new LoopProtectionManager()
    }
    return LoopProtectionManager.instance
  }

  /**
   * 🔥 core methods：Check whether the function call should be allowed
   */
  public shouldAllowCall(
    functionName: string,
    componentId?: string,
    action?: string,
    source = 'unknown'
  ): boolean {
    const callKey = componentId ? `${functionName}:${componentId}` : functionName

    // 1. Check blacklist
    if (this.blacklistedFunctions.has(callKey)) {
      this.performanceStats.totalCallsBlocked++
      if (this.config.enableDebug) {
        console.warn(`🚫 [LoopProtection] Block blacklist function calls: ${callKey}`)
      }
      return false
    }

    // 2. Check recursion depth
    const currentDepth = this.getCurrentDepth(callKey)
    if (currentDepth >= this.config.maxDepth) {
      this.addToBlacklist(callKey, `Recursion depth exceeds${this.config.maxDepth}`)
      return false
    }

    // 3. Check the frequency of calls within a time window
    if (this.isCallFrequencyTooHigh(callKey)) {
      this.addToBlacklist(callKey, `Call frequency is too high`)
      return false
    }

    // 4. record this call
    this.recordCall(callKey, source, componentId, action)

    return true
  }

  /**
   * 🔥 Mark the start of a function call
   */
  public markCallStart(functionName: string, componentId?: string, source = 'unknown'): string {
    const callKey = componentId ? `${functionName}:${componentId}` : functionName
    const callId = `${callKey}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`

    if (!this.shouldAllowCall(functionName, componentId, 'start', source)) {
      return '' // An empty string indicates that the call is blocked
    }

    // Increase active call count
    const currentCount = this.activeCallCounts.get(callKey) || 0
    this.activeCallCounts.set(callKey, currentCount + 1)

    if (this.config.enableDebug && currentCount > 3) {
      console.warn(`⚠️ [LoopProtection] High concurrent call detection: ${callKey} (${currentCount + 1} concurrent)`)
    }

    return callId
  }

  /**
   * 🔥 Mark the end of a function call
   */
  public markCallEnd(callId: string, functionName: string, componentId?: string): void {
    if (!callId) return // Call blocked

    const callKey = componentId ? `${functionName}:${componentId}` : functionName

    // Reduce active call count
    const currentCount = this.activeCallCounts.get(callKey) || 0
    if (currentCount > 0) {
      this.activeCallCounts.set(callKey, currentCount - 1)
    }

    // Clean the call stack
    this.cleanupCallStack(callKey)
  }

  /**
   * 🔥 Get the current recursion depth
   */
  private getCurrentDepth(callKey: string): number {
    const stack = this.callStacks.get(callKey) || []
    return stack.length
  }

  /**
   * 🔥 Check whether the call frequency is too high
   */
  private isCallFrequencyTooHigh(callKey: string): boolean {
    const now = Date.now()
    const history = this.callHistory.get(callKey) || []

    // Clean up expired history
    const validHistory = history.filter(record =>
      now - record.timestamp <= this.config.timeWindow
    )
    this.callHistory.set(callKey, validHistory)

    return validHistory.length >= this.config.maxCallsInWindow
  }

  /**
   * 🔥 Logging function calls
   */
  private recordCall(callKey: string, source: string, componentId?: string, action?: string): void {
    const now = Date.now()
    const record: CallRecord = {
      timestamp: now,
      depth: this.getCurrentDepth(callKey),
      source,
      componentId,
      action
    }

    // Update call stack
    const stack = this.callStacks.get(callKey) || []
    stack.push(record)
    this.callStacks.set(callKey, stack)

    // Update history
    const history = this.callHistory.get(callKey) || []
    history.push(record)
    this.callHistory.set(callKey, history)
  }

  /**
   * 🔥 Add to blacklist
   */
  private addToBlacklist(callKey: string, reason: string): void {
    this.blacklistedFunctions.add(callKey)
    this.performanceStats.totalLoopsDetected++

    if (this.config.enableDebug) {
      console.error(`🚫 [LoopProtection] Loop detected，Blacklisted: ${callKey}`, {
        reason,
        callHistory: this.callHistory.get(callKey)?.slice(-5), // at last5calls
        currentDepth: this.getCurrentDepth(callKey)
      })
    }

    // Set a timer to automatically remove the blacklist
    const existingTimeout = this.blacklistTimeouts.get(callKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const timeout = setTimeout(() => {
      this.removeFromBlacklist(callKey)
    }, 10000) // 10Automatically remove blacklist after seconds

    this.blacklistTimeouts.set(callKey, timeout)
  }

  /**
   * 🔥 Remove from blacklist
   */
  private removeFromBlacklist(callKey: string): void {
    this.blacklistedFunctions.delete(callKey)
    this.blacklistTimeouts.delete(callKey)

    // Clean up related call history
    this.callStacks.delete(callKey)
    this.callHistory.delete(callKey)
    this.activeCallCounts.delete(callKey)

    if (this.config.enableDebug) {
      console.info(`✅ [LoopProtection] Removed from blacklist: ${callKey}`)
    }
  }

  /**
   * 🔥 Clean the call stack
   */
  private cleanupCallStack(callKey: string): void {
    const stack = this.callStacks.get(callKey) || []
    if (stack.length > 0) {
      stack.pop() // Remove the last call record
      this.callStacks.set(callKey, stack)
    }
  }

  /**
   * 🔥 Set global error handling
   */
  private setupGlobalErrorHandling(): void {
    // Listen for uncaught exceptions，It may be a stack overflow caused by a loop call
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message.includes('Maximum call stack size exceeded')) {
          console.error('🚫 [LoopProtection] Stack overflow detected，Possible infinite recursion')
          this.performanceStats.totalLoopsDetected++

          // Clear all active calls，Prevent system crashes
          this.activeCallCounts.clear()
          this.callStacks.clear()
        }
      })
    }
  }

  /**
   * 🔥 Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const now = Date.now()
      const timeDiff = now - this.performanceStats.lastResetTime
      const totalCalls = Array.from(this.callHistory.values())
        .reduce((sum, history) => sum + history.length, 0)

      this.performanceStats.averageCallsPerSecond = totalCalls / (timeDiff / 1000)
      this.performanceStats.lastResetTime = now

      if (this.config.enableDebug && totalCalls > 0) {
      }

      // Clean up expired history
      this.cleanupExpiredHistory()
    }, 30000) // Every30Statistics once every second
  }

  /**
   * 🔥 Clean up expired history
   */
  private cleanupExpiredHistory(): void {
    const now = Date.now()
    for (const [callKey, history] of this.callHistory.entries()) {
      const validHistory = history.filter(record =>
        now - record.timestamp <= this.config.timeWindow * 2 // reserve2History of multiple time windows
      )
      if (validHistory.length !== history.length) {
        this.callHistory.set(callKey, validHistory)
      }
    }
  }

  /**
   * 🔥 Get performance statistics
   */
  public getPerformanceStats() {
    return {
      ...this.performanceStats,
      blacklistedFunctionsCount: this.blacklistedFunctions.size,
      activeCallsCount: Array.from(this.activeCallCounts.values()).reduce((a, b) => a + b, 0),
      totalTrackedFunctions: this.callHistory.size
    }
  }

  /**
   * 🔥 Get the current blacklist
   */
  public getBlacklistedFunctions(): string[] {
    return Array.from(this.blacklistedFunctions)
  }

  /**
   * 🔥 Manual cleanup（for testing or resetting）
   */
  public reset(): void {
    this.callStacks.clear()
    this.callHistory.clear()
    this.activeCallCounts.clear()
    this.blacklistedFunctions.clear()

    // Clear all timers
    for (const timeout of this.blacklistTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.blacklistTimeouts.clear()

    this.performanceStats = {
      totalCallsBlocked: 0,
      totalLoopsDetected: 0,
      averageCallsPerSecond: 0,
      lastResetTime: Date.now()
    }

  }

  /**
   * 🔥 Update configuration
   */
  public updateConfig(newConfig: Partial<LoopDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const loopProtectionManager = LoopProtectionManager.getInstance()

/**
 * 🔥 Decorator：Automatically add loop protection
 */
export function loopProtection(functionName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const fnName = functionName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = function (...args: any[]) {
      const componentId = (this as any).componentId || (this as any).nodeId || 'unknown'
      const callId = loopProtectionManager.markCallStart(fnName, componentId, 'decorator')

      if (!callId) {
        // call blocked
        return Promise.resolve()
      }

      try {
        const result = originalMethod.apply(this, args)

        if (result instanceof Promise) {
          return result.finally(() => {
            loopProtectionManager.markCallEnd(callId, fnName, componentId)
          })
        } else {
          loopProtectionManager.markCallEnd(callId, fnName, componentId)
          return result
        }
      } catch (error) {
        loopProtectionManager.markCallEnd(callId, fnName, componentId)
        throw error
      }
    }

    return descriptor
  }
}