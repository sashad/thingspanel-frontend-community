/**
 * Grid History management Hook
 * Provide revocation/Redo functionality and history management
 */

import { ref, computed } from 'vue'
import type { GridLayoutPlusItem } from '../gridLayoutPlusTypes'
import { cloneLayout } from '../gridLayoutPlusUtils'

export interface UseGridHistoryOptions {
  /** Whether to enable history */
  enabled?: boolean
  /** Maximum length of history */
  maxLength?: number
  /** Auto save time interval(ms) */
  autoSaveInterval?: number
}

/**
 * Grid history managementHook
 * Provide full revocation/redo function
 */
export function useGridHistory(options: UseGridHistoryOptions = {}) {
  const {
    enabled = true,
    maxLength = 50,
    autoSaveInterval = 0 // 0Indicates disabling auto-save
  } = options

  // history status
  const history = ref<GridLayoutPlusItem[][]>([])
  const historyIndex = ref(-1)
  const isRecording = ref(true)

  // Auto save timer
  let autoSaveTimer: NodeJS.Timeout | null = null

  // Computed properties
  const canUndo = computed(() => enabled && historyIndex.value > 0)
  const canRedo = computed(() => enabled && historyIndex.value < history.value.length - 1)
  const historyLength = computed(() => history.value.length)
  const currentHistoryIndex = computed(() => historyIndex.value)

  /**
   * Save layout to history
   */
  const saveToHistory = (layout: GridLayoutPlusItem[]) => {
    if (!enabled || !isRecording.value || layout.length === 0) return

    try {
      const currentLayout = cloneLayout(layout)

      // Check if it is the same as the current history
      if (history.value.length > 0) {
        const lastHistoryLayout = history.value[historyIndex.value]
        if (lastHistoryLayout && JSON.stringify(lastHistoryLayout) === JSON.stringify(currentLayout)) {
          return // The layout has not changed，Don't save
        }
      }

      // If you are not currently at the end of the history，Delete subsequent records
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1)
      }

      // Add new record
      history.value.push(currentLayout)
      historyIndex.value = history.value.length - 1

      // Limit history length
      if (history.value.length > maxLength) {
        history.value.shift()
        historyIndex.value = history.value.length - 1
      }

      console.debug(`[GridHistory] Saved to history. Index: ${historyIndex.value}, Total: ${history.value.length}`)
    } catch (err) {
      console.error('[GridHistory] Failed to save to history:', err)
    }
  }

  /**
   * Undo to previous state
   */
  const undo = (): GridLayoutPlusItem[] | null => {
    if (!canUndo.value) {
      console.error('[GridHistory] Cannot undo: no previous state available')
      return null
    }

    try {
      historyIndex.value--
      const previousLayout = history.value[historyIndex.value]
      console.debug(`[GridHistory] Undo to index: ${historyIndex.value}`)
      return cloneLayout(previousLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to undo:', err)
      return null
    }
  }

  /**
   * Redo to next state
   */
  const redo = (): GridLayoutPlusItem[] | null => {
    if (!canRedo.value) {
      console.error('[GridHistory] Cannot redo: no next state available')
      return null
    }

    try {
      historyIndex.value++
      const nextLayout = history.value[historyIndex.value]
      console.debug(`[GridHistory] Redo to index: ${historyIndex.value}`)
      return cloneLayout(nextLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to redo:', err)
      return null
    }
  }

  /**
   * Jump to the specified history record
   */
  const jumpToHistory = (index: number): GridLayoutPlusItem[] | null => {
    if (!enabled || index < 0 || index >= history.value.length) {
      console.error(`[GridHistory] Invalid history index: ${index}`)
      return null
    }

    try {
      historyIndex.value = index
      const targetLayout = history.value[index]
      console.debug(`[GridHistory] Jump to index: ${index}`)
      return cloneLayout(targetLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to jump to history:', err)
      return null
    }
  }

  /**
   * Get history summary
   */
  const getHistorySummary = () => {
    return history.value.map((layout, index) => ({
      index,
      timestamp: Date.now(), // Simplified version，Actually the real timestamp should be stored
      itemCount: layout.length,
      isCurrent: index === historyIndex.value
    }))
  }

  /**
   * Clear history
   */
  const clearHistory = () => {
    history.value = []
    historyIndex.value = -1
    console.debug('[GridHistory] History cleared')
  }

  /**
   * Pause history
   */
  const pauseRecording = () => {
    isRecording.value = false
    console.debug('[GridHistory] Recording paused')
  }

  /**
   * restore history
   */
  const resumeRecording = () => {
    isRecording.value = true
    console.debug('[GridHistory] Recording resumed')
  }

  /**
   * Start automatic saving
   */
  const startAutoSave = (layoutRef: { value: GridLayoutPlusItem[] }) => {
    if (autoSaveInterval <= 0 || !enabled) return

    stopAutoSave() // Stop the previous timer

    autoSaveTimer = setInterval(() => {
      if (isRecording.value && layoutRef.value.length > 0) {
        saveToHistory(layoutRef.value)
      }
    }, autoSaveInterval)

    console.debug(`[GridHistory] Auto save started with ${autoSaveInterval}ms interval`)
  }

  /**
   * Stop autosave
   */
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
      console.debug('[GridHistory] Auto save stopped')
    }
  }

  /**
   * Initialize history
   */
  const initHistory = (initialLayout: GridLayoutPlusItem[]) => {
    if (!enabled || initialLayout.length === 0) return

    history.value = [cloneLayout(initialLayout)]
    historyIndex.value = 0
    console.debug('[GridHistory] History initialized')
  }

  return {
    // state
    canUndo,
    canRedo,
    historyLength,
    currentHistoryIndex,
    isRecording,

    // method
    saveToHistory,
    undo,
    redo,
    jumpToHistory,
    getHistorySummary,
    clearHistory,
    pauseRecording,
    resumeRecording,
    startAutoSave,
    stopAutoSave,
    initHistory
  }
}
