/**
 * Permission change listener
 * Notify components of system reloading when user permissions change
 */

type PermissionChangeCallback = (newAuthority: string, oldAuthority: string) => void

class PermissionWatcher {
  private callbacks: PermissionChangeCallback[] = []
  private currentAuthority: string | null = null
  private intervalId: number | null = null

  constructor() {
    this.startWatching()
  }

  /**
   * Start monitoring permission changes
   */
  private startWatching() {
    // Check current permissions
    this.updateCurrentAuthority()

    // 🔥 optimization：Reduce polling frequency to every5Check once every second
    this.intervalId = window.setInterval(() => {
      this.checkPermissionChange()
    }, 5000)
  }

  /**
   * Stop listening
   */
  stopWatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Update current permissions
   */
  private updateCurrentAuthority() {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        this.currentAuthority = parsed.authority || 'TENANT_USER'
      } else {
        this.currentAuthority = 'TENANT_USER'
      }
    } catch {
      this.currentAuthority = 'TENANT_USER'
    }
  }

  /**
   * Check if permissions have changed
   */
  private checkPermissionChange() {
    const oldAuthority = this.currentAuthority
    this.updateCurrentAuthority()

    if (oldAuthority !== this.currentAuthority) {

      // Notify all listeners
      this.callbacks.forEach(callback => {
        try {
          callback(this.currentAuthority!, oldAuthority || 'unknown')
        } catch (error) {
          console.error('[PermissionWatcher] Permission change callback execution failed:', error)
        }
      })
    }
  }

  /**
   * Add permission change listener
   */
  onPermissionChange(callback: PermissionChangeCallback) {
    this.callbacks.push(callback)

    // Returns the function to cancel listening
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current permissions
   */
  getCurrentAuthority(): string {
    return this.currentAuthority || 'TENANT_USER'
  }
}

// Global singleton
export const permissionWatcher = new PermissionWatcher()

/**
 * Manually trigger permission checks（Used to update immediately after logging in）
 */
export function triggerPermissionCheck() {
  // Access using private methods
  ;(permissionWatcher as any).checkPermissionChange()
}

/**
 * optimization：monitor localStorage change event（more efficient）
 */
export function setupStorageListener() {
  // Listen to the same tab localStorage change
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key: string, value: string) {
    const oldValue = localStorage.getItem(key)
    originalSetItem.call(this, key, value)

    // in the case of userInfo change，Trigger permission check immediately
    if (key === 'userInfo' && oldValue !== value) {
      triggerPermissionCheck()
    }
  }
}
