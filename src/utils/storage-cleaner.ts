/**
 * localStorage cleaning tool
 * Used to clean up local storage items that are no longer needed
 */

/**
 * Need to be cleanedlocalStoragekey list
 */
const STORAGE_KEYS_TO_CLEAN = [
  'globalTabs',
  '__vue-devtools-frame-state__',
  'RECENTLY_VISITED_ROUTES',
  'visual-editor-config-state-v2',
  'visual-editor-configurations',
  'configuration-states',
  'config-discovery-cache',
  'visual-editor-config',
  'panel-config'
] as const

/**
 * Clean up the specifiedlocalStorageitem
 */
export function cleanupLocalStorage(): void {

  const cleanedKeys: string[] = []
  const skippedKeys: string[] = []

  STORAGE_KEYS_TO_CLEAN.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) {
        localStorage.removeItem(key)
        cleanedKeys.push(key)

      } else {
        skippedKeys.push(key)
      }
    } catch (error) {
      console.error(`❌ Cleanup failed: ${key}`, error)
    }
  })


}

/**
 * clean alllocalStorage（Dangerous operation）
 */
export function clearAllLocalStorage(): void {
  console.error('⚠️ Cleaning alllocalStorage...')

  const allKeys = Object.keys(localStorage)


  try {
    localStorage.clear()
  } catch (error) {
    console.error('❌ clean uplocalStoragefail:', error)
  }
}

/**
 * examinelocalStorageUsage
 */
export function inspectLocalStorage(): void {


  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      const size = value ? new Blob([value]).size : 0

    } catch (error) {
      console.error(`Unable to read ${key}:`, error)
    }
  })

}

// Automatically exposed to the global environment in the development environment
if (import.meta.env.DEV) {
  (window as any).storageCleanup = {
    clean: cleanupLocalStorage,
    clearAll: clearAllLocalStorage,
    inspect: inspectLocalStorage
  }

}
