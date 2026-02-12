/**
 * Global Poll Manager
 * Unified management of polling tasks for all components，Avoid repeating timers，Improve performance
 */

import { reactive, ref, type Ref } from 'vue'

export interface PollingTask {
  /** Task unique identifier */
  id: string
  /** associated componentsID */
  componentId: string
  /** Component display name */
  componentName: string
  /** Polling interval（millisecond） */
  interval: number
  /** Whether to activate */
  active: boolean
  /** Last execution time */
  lastExecutedAt?: number
  /** Next execution time */
  nextExecuteAt?: number
  /** Execute callback function */
  callback: () => Promise<void> | void
}

export interface PollingStatistics {
  /** Total number of tasks */
  totalTasks: number
  /** Number of active tasks */
  activeTasks: number
  /** average interval */
  averageInterval: number
  /** Minimum interval */
  minInterval: number
  /** Global timer status */
  globalTimerActive: boolean
  /** Total execution times */
  totalExecutions: number
}

/**
 * Global poll manager class
 * Use a single timer to schedule all polling tasks uniformly
 */
export class GlobalPollingManager {
  /** All polling tasks */
  private tasks = reactive<Map<string, PollingTask>>(new Map())

  /** Global timerID */
  private globalTimerId: number | null = null

  /** Global polling master switch - Controls whether any polling tasks are performed */
  private globalEnabled = ref<boolean>(false)

  /** global timer interval（millisecond），Set to lowest common denominator */
  private readonly GLOBAL_TIMER_INTERVAL = 5000 // 🔥 Performance optimization：Change to5Second，reduceCPUoccupy

  /** Is the manager started? */
  private isRunning = ref(false)

  /** Statistics */
  private statistics = reactive<PollingStatistics>({
    totalTasks: 0,
    activeTasks: 0,
    averageInterval: 0,
    minInterval: 0,
    globalTimerActive: false,
    totalExecutions: 0
  })

  constructor() {}

  /**
   * Add polling task
   * @param taskConfig Task configuration
   * @returns TaskID
   */
  addTask(taskConfig: {
    componentId: string
    componentName: string
    interval: number
    callback: () => Promise<void> | void
    autoStart?: boolean
  }): string {
    const taskId = this.generateTaskId(taskConfig.componentId)

    const task: PollingTask = {
      id: taskId,
      componentId: taskConfig.componentId,
      componentName: taskConfig.componentName,
      interval: Math.max(taskConfig.interval, 2000), // smallest2seconds interval
      active: false,
      callback: taskConfig.callback
    }

    this.tasks.set(taskId, task)
    this.updateStatistics()
    // If automatic startup is set
    if (taskConfig.autoStart) {
      this.startTask(taskId)
    } else {
    }

    return taskId
  }

  /**
   * Start the specified task
   * @param taskId TaskID
   */
  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) {
      return false
    }

    task.active = true
    task.nextExecuteAt = Date.now() + task.interval
    // Start global timer（If it hasn't started yet）
    this.startGlobalTimer()
    this.updateStatistics()
    return true
  }

  /**
   * Stop specified task
   * @param taskId TaskID
   */
  stopTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) {
      return false
    }

    task.active = false
    task.nextExecuteAt = undefined
    this.updateStatistics()

    // If there are no active tasks，Stop global timer
    if (this.getActiveTasks().length === 0) {
      this.stopGlobalTimer()
    }

    return true
  }

  /**
   * Remove specified task
   * @param taskId TaskID
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) {
      return false
    }

    // Stop the task first
    this.stopTask(taskId)

    // Remove from list
    this.tasks.delete(taskId)
    this.updateStatistics()
    return true
  }

  /**
   * According to componentsIDGet tasks
   * @param componentId componentsID
   */
  getTasksByComponent(componentId: string): PollingTask[] {
    return Array.from(this.tasks.values()).filter(task => task.componentId === componentId)
  }

  /**
   * Start all polling tasks for the specified component
   * @param componentId componentsID
   */
  startComponentTasks(componentId: string): boolean {
    const tasks = this.getTasksByComponent(componentId)
    if (tasks.length === 0) {
      return false
    }

    let startedCount = 0
    tasks.forEach(task => {
      if (!task.active) {
        task.active = true
        task.nextExecuteAt = Date.now() + task.interval
        startedCount++
      }
    })

    if (startedCount > 0) {
      // Start global timer（If it hasn't started yet）
      this.startGlobalTimer()
      this.updateStatistics()
    }

    return startedCount > 0
  }

  /**
   * Stops all polling tasks for the specified component
   * @param componentId componentsID
   */
  stopComponentTasks(componentId: string): boolean {
    const tasks = this.getTasksByComponent(componentId)
    if (tasks.length === 0) {
      return false
    }

    let stoppedCount = 0
    tasks.forEach(task => {
      if (task.active) {
        task.active = false
        task.nextExecuteAt = undefined
        stoppedCount++
      }
    })

    if (stoppedCount > 0) {
      this.updateStatistics()

      // If there are no active tasks，Stop global timer
      if (this.getActiveTasks().length === 0) {
        this.stopGlobalTimer()
      }
    }

    return stoppedCount > 0
  }

  /**
   * Toggle the polling status of the specified component
   * @param componentId componentsID
   */
  toggleComponentPolling(componentId: string): boolean {
    const tasks = this.getTasksByComponent(componentId)
    const hasActiveTasks = tasks.some(task => task.active)

    if (hasActiveTasks) {
      return !this.stopComponentTasks(componentId)
    } else {
      return this.startComponentTasks(componentId)
    }
  }

  /**
   * Check if the component has active polling tasks
   * @param componentId componentsID
   */
  isComponentPollingActive(componentId: string): boolean {
    const tasks = this.getTasksByComponent(componentId)
    return tasks.some(task => task.active)
  }

  /**
   * Get component polling statistics
   * @param componentId componentsID
   */
  getComponentStatistics(componentId: string): PollingStatistics {
    const tasks = this.getTasksByComponent(componentId)
    const activeTasks = tasks.filter(task => task.active)

    const intervals = tasks.map(task => task.interval)
    const averageInterval =
      intervals.length > 0 ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0
    const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0

    return {
      totalTasks: tasks.length,
      activeTasks: activeTasks.length,
      averageInterval,
      minInterval,
      globalTimerActive: this.statistics.globalTimerActive,
      totalExecutions: this.statistics.totalExecutions
    }
  }

  /**
   * Get all tasks
   */
  getAllTasks(): PollingTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): PollingTask[] {
    return this.getAllTasks().filter(task => task.active)
  }

  /**
   * Get statistics
   */
  getStatistics(): PollingStatistics {
    return { ...this.statistics }
  }

  /**
   * Stop all tasks
   */
  stopAllTasks(): void {
    for (const task of this.tasks.values()) {
      if (task.active) {
        task.active = false
        task.nextExecuteAt = undefined
      }
    }

    this.stopGlobalTimer()
    this.updateStatistics()
  }

  /**
   * Clear all tasks
   */
  clearAllTasks(): void {
    this.stopAllTasks()
    this.tasks.clear()
    this.updateStatistics()
  }

  /**
   * Enable global polling
   */
  enableGlobalPolling(): void {
    this.globalEnabled.value = true

    // Detailed status report
    const allTasks = this.getAllTasks()
    const activeTasks = this.getActiveTasks()

    if (this.getActiveTasks().length > 0) {
      this.startGlobalTimer()
    }
  }

  /**
   * Disable global polling
   */
  disableGlobalPolling(): void {
    this.globalEnabled.value = false

    // Stop global timer without clearing task
    if (this.globalTimerId !== null) {
      clearInterval(this.globalTimerId)
      this.globalTimerId = null
      this.isRunning.value = false
      this.statistics.globalTimerActive = false
    }
  }

  /**
   * Get global polling switch status
   */
  isGlobalPollingEnabled(): boolean {
    return this.globalEnabled.value
  }

  /**
   * Toggle global polling switch state
   */
  toggleGlobalPolling(): boolean {
    if (this.globalEnabled.value) {
      this.disableGlobalPolling()
    } else {
      this.enableGlobalPolling()
    }
    return this.globalEnabled.value
  }

  /**
   * destroy manager
   */
  destroy(): void {
    this.clearAllTasks()
    this.globalEnabled.value = false
    this.isRunning.value = false
  }

  /**
   * Start global timer
   */
  private startGlobalTimer(): void {
    if (this.globalTimerId !== null) {
      return // Already started
    }
    this.globalTimerId = window.setInterval(() => {
      this.executeScheduledTasks()
    }, this.GLOBAL_TIMER_INTERVAL)

    this.isRunning.value = true
    this.statistics.globalTimerActive = true
  }

  /**
   * Stop global timer
   */
  private stopGlobalTimer(): void {
    if (this.globalTimerId !== null) {
      clearInterval(this.globalTimerId)
      this.globalTimerId = null
    }

    this.isRunning.value = false
    this.statistics.globalTimerActive = false
  }

  /**
   * Execute planned tasks - 🔥 Optimized version：Batch processing and intelligent scheduling
   */
  private executeScheduledTasks(): void {
    // 🔴 Check global polling switch
    if (!this.globalEnabled.value) {
      // When global polling is turned off，Do not perform any tasks，But keep the timer running so it can be resumed at any time
      return
    }

    const now = Date.now()
    const readyTasks: PollingTask[] = []

    // 🔥 Performance optimization：Collect all tasks ready to be executed
    for (const task of this.getActiveTasks()) {
      if (task.nextExecuteAt && now >= task.nextExecuteAt) {
        readyTasks.push(task)
      }
    }

    // 🔥 Performance optimization：Batch execution，Avoid single task blockage
    if (readyTasks.length > 0) {
      // Sort by priority：Tasks with short intervals are executed first
      readyTasks.sort((a, b) => a.interval - b.interval)

      // Execute tasks in parallel（But limit the number of concurrencies to avoid overload）
      const batchSize = Math.min(readyTasks.length, 5) // Execute at most simultaneously5tasks
      const batch = readyTasks.slice(0, batchSize)
      Promise.allSettled(batch.map(task => this.executeTask(task, now))).catch(error => {})
    } else {
      // Current time check
      this.getActiveTasks()
    }
  }

  /**
   * Perform a single task
   * @param task Task object
   * @param now current timestamp
   */
  private async executeTask(task: PollingTask, now: number): Promise<void> {
    try {
      // 🔍 debug：Always output execution log
      // Update execution time
      task.lastExecutedAt = now
      task.nextExecuteAt = now + task.interval

      // Execute callback
      await task.callback()

      // Update statistics
      this.statistics.totalExecutions++
    } catch (error) {
      error(`❌ [GlobalPollingManager] Task execution failed: ${task.componentName}`, error)
    }
  }

  /**
   * Generate tasksID
   * @param componentId componentsID
   */
  private generateTaskId(componentId: string): string {
    return `polling_${componentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    const allTasks = this.getAllTasks()
    const activeTasks = this.getActiveTasks()

    this.statistics.totalTasks = allTasks.length
    this.statistics.activeTasks = activeTasks.length

    if (allTasks.length > 0) {
      const intervals = allTasks.map(task => task.interval)
      this.statistics.averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      this.statistics.minInterval = Math.min(...intervals)
    } else {
      this.statistics.averageInterval = 0
      this.statistics.minInterval = 0
    }
  }
}

// Create a global singleton instance
let globalPollingManagerInstance: GlobalPollingManager | null = null

/**
 * Get the global poll manager singleton
 */
export function useGlobalPollingManager(): GlobalPollingManager {
  if (!globalPollingManagerInstance) {
    globalPollingManagerInstance = new GlobalPollingManager()

    // Clean up when page unloads
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        globalPollingManagerInstance?.destroy()
      })
    }
  }

  return globalPollingManagerInstance
}

/**
 * Destroy the global poll manager instance（Mainly used for testing）
 */
export function destroyGlobalPollingManager(): void {
  if (globalPollingManagerInstance) {
    globalPollingManagerInstance.destroy()
    globalPollingManagerInstance = null
  }
}
