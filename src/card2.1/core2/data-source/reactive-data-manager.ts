/**
 * Responsive data manager
 * Support polling updates、Responsive data acquisition such as real-time subscription
 */

import type { StaticDataSource } from './static-data-source'
import type { DeviceApiDataSource } from './device-api-data-source'
import { dataBindingManager } from './data-binding-manager'

type DataSource = StaticDataSource | DeviceApiDataSource

export interface ReactiveDataSourceConfig {
  dataSourceId: string
  updateStrategy: 'static' | 'polling' | 'realtime'
  updateInterval?: number // Polling interval，unit：millisecond
  autoStart?: boolean
}

export interface ReactiveSubscription {
  id: string
  dataSourceId: string
  callback: (data: any) => void
  config: ReactiveDataSourceConfig
  isActive: boolean
  lastUpdate?: Date
  errorCount: number
}

/**
 * Responsive data manager
 */
export class ReactiveDataManager {
  private subscriptions = new Map<string, ReactiveSubscription>()
  private pollingTimers = new Map<string, NodeJS.Timeout>()
  private dataSources = new Map<string, DataSource>()

  /**
   * Register data source
   */
  registerDataSource(dataSource: DataSource) {
    this.dataSources.set(dataSource.getId(), dataSource)
  }

  /**
   * Remove data source
   */
  removeDataSource(dataSourceId: string) {
    // Stop related subscriptions
    const subscriptionsToRemove: string[] = []
    for (const [subId, subscription] of this.subscriptions.entries()) {
      if (subscription.dataSourceId === dataSourceId) {
        subscriptionsToRemove.push(subId)
      }
    }

    subscriptionsToRemove.forEach(subId => {
      this.unsubscribe(subId)
    })

    this.dataSources.delete(dataSourceId)
  }

  /**
   * Create a responsive subscription
   */
  subscribe(
    dataSourceId: string,
    callback: (data: any) => void,
    config: Omit<ReactiveDataSourceConfig, 'dataSourceId'>
  ): string {
    const subscriptionId = `${dataSourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const subscription: ReactiveSubscription = {
      id: subscriptionId,
      dataSourceId,
      callback,
      config: { ...config, dataSourceId },
      isActive: false,
      errorCount: 0
    }

    this.subscriptions.set(subscriptionId, subscription)

    // If configured to start automatically，Start now
    if (config.autoStart !== false) {
      this.startSubscription(subscriptionId)
    }

    return subscriptionId
  }

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    this.stopSubscription(subscriptionId)
    this.subscriptions.delete(subscriptionId)
  }

  /**
   * Start subscription
   */
  startSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription || subscription.isActive) return

    const dataSource = this.dataSources.get(subscription.dataSourceId)
    if (!dataSource) {
      return
    }

    subscription.isActive = true

    switch (subscription.config.updateStrategy) {
      case 'static':
        // static data：Get only once
        this.fetchDataOnce(subscriptionId)
        break

      case 'polling':
        // Poll for updates：Obtain at regular intervals
        this.startPolling(subscriptionId)
        break

      case 'realtime':
        // real time updates：WebSocketwait（Not yet implemented）
        this.fetchDataOnce(subscriptionId)
        break

      default:
    }
  }

  /**
   * Stop subscription
   */
  stopSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription || !subscription.isActive) return

    subscription.isActive = false

    // Clear polling timer
    const timer = this.pollingTimers.get(subscriptionId)
    if (timer) {
      clearInterval(timer)
      this.pollingTimers.delete(subscriptionId)
    }
  }

  /**
   * Get single data
   */
  private async fetchDataOnce(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const dataSource = this.dataSources.get(subscription.dataSourceId)
    if (!dataSource) return

    try {
      const data = await dataSource.getValue()
      subscription.lastUpdate = new Date()
      subscription.errorCount = 0

      // trigger callback
      subscription.callback(data)
    } catch (error) {
      subscription.errorCount++
      // If there are too many errors，Pause subscription
      if (subscription.errorCount >= 3) {
        this.stopSubscription(subscriptionId)
      }

      // trigger callback，pass error message
      subscription.callback({ error: error instanceof Error ? error.message : 'Data acquisition failed' })
    }
  }

  /**
   * Start polling
   */
  private startPolling(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const interval = subscription.config.updateInterval || 5000 // default5Second

    // Get data immediately
    this.fetchDataOnce(subscriptionId)

    // Set timer
    const timer = setInterval(() => {
      if (subscription.isActive) {
        this.fetchDataOnce(subscriptionId)
      }
    }, interval)

    this.pollingTimers.set(subscriptionId, timer)
  }

  /**
   * Update subscription configuration
   */
  updateSubscriptionConfig(subscriptionId: string, newConfig: Partial<ReactiveDataSourceConfig>) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    const wasActive = subscription.isActive

    // Stop current subscription
    if (wasActive) {
      this.stopSubscription(subscriptionId)
    }

    // Update configuration
    subscription.config = { ...subscription.config, ...newConfig }

    // if it was active before，Restart
    if (wasActive) {
      this.startSubscription(subscriptionId)
    }
  }

  /**
   * Manually refresh subscription data
   */
  async refreshSubscription(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return

    await this.fetchDataOnce(subscriptionId)
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(subscriptionId: string): ReactiveSubscription | undefined {
    return this.subscriptions.get(subscriptionId)
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): ReactiveSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * Pause all subscriptions
   */
  pauseAll() {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.stopSubscription(subscriptionId)
    }
  }

  /**
   * Restore all subscriptions
   */
  resumeAll() {
    for (const subscriptionId of this.subscriptions.keys()) {
      this.startSubscription(subscriptionId)
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Stop all subscriptions
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId)
    }

    // Clean data source
    this.dataSources.clear()
  }
}

// Export singleton
export const reactiveDataManager = new ReactiveDataManager()
export default reactiveDataManager
