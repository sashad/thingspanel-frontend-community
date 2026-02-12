/**
 * Smart deep copy tool
 * Specially handledVue 3Reactive objects andstructuredClonecompatibility issues
 */

import { toRaw, isRef, unref, isReactive, isReadonly } from 'vue'

/**
 * Check if the object isVueReactive objects
 */
const isVueReactiveObject = (obj: any): boolean => {
  return (
    isReactive(obj) ||
    isReadonly(obj) ||
    isRef(obj) ||
    (obj && typeof obj === 'object' && (obj.__v_isReactive || obj.__v_isReadonly || obj.__v_isRef))
  )
}

/**
 * Intelligent depthtoRawConvert
 * only rightVueReactive object usagetoRaw，Avoid unnecessary processing
 */
const smartDeepToRaw = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj

  // Handling basic types
  if (typeof obj !== 'object') return obj

  // deal withrefobject
  if (isRef(obj)) {
    return smartDeepToRaw(unref(obj)) as T
  }

  // Handle reactive objects
  let raw = obj
  if (isVueReactiveObject(obj)) {
    raw = toRaw(obj)
  }

  // Processing arrays
  if (Array.isArray(raw)) {
    return raw.map(smartDeepToRaw) as T
  }

  // deal withDate、RegExpWait for built-in objects
  if (raw instanceof Date || raw instanceof RegExp || raw instanceof Error) {
    return raw
  }

  // deal withSet
  if (raw instanceof Set) {
    const newSet = new Set()
    raw.forEach(value => {
      newSet.add(smartDeepToRaw(value))
    })
    return newSet as T
  }

  // deal withMap
  if (raw instanceof Map) {
    const newMap = new Map()
    raw.forEach((value, key) => {
      newMap.set(smartDeepToRaw(key), smartDeepToRaw(value))
    })
    return newMap as T
  }

  // Handle common objects
  if (raw.constructor === Object || raw.constructor === undefined) {
    const result: any = {}
    for (const [key, value] of Object.entries(raw)) {
      result[key] = smartDeepToRaw(value)
    }
    return result
  }

  // Leave other types as is
  return raw
}

/**
 * Performance-optimized deep copy functions
 *
 * Strategy：
 * 1. Prioritize the use of high-performance structuredClone()
 * 2. rightVue响应式right象智能预处理
 * 3. On failure, downgrade toJSONmethod
 * 4. Support complex object types(Set, Mapwait)
 */
export const smartDeepClone = <T>(
  obj: T,
  options?: {
    /** Whether to enable detailed logging */
    debug?: boolean
    /** Mandatory useJSONmethod（for testing） */
    forceJSON?: boolean
  }
): T => {
  const { debug = false, forceJSON = false } = options || {}

  if (obj === null || obj === undefined) return obj

  try {
    // first step：Intelligent preprocessingVueReactive objects
    const rawObj = smartDeepToRaw(obj)

    if (debug) {
      if (process.env.NODE_ENV === 'development') {
      }
    }

    // Step 2：try high performancestructuredClone
    if (!forceJSON && typeof structuredClone !== 'undefined') {
      try {
        const cloned = structuredClone(rawObj)
        if (debug) {
          if (process.env.NODE_ENV === 'development') {
          }
        }
        return cloned
      } catch (structuredCloneError) {
        if (debug) {
          console.error('⚠️ [smartDeepClone] structuredClonefail，downgrade toJSON:', structuredCloneError)
        }
        // continue toJSONmethod
      }
    }

    // Step 3：downgrade toJSONmethod
    const jsonCloned = JSON.parse(JSON.stringify(rawObj))
    if (debug) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
    return jsonCloned
  } catch (error) {
    console.error('❌ [smartDeepClone] All cloning methods fail:', error)
    // The last tip：Shallow copy
    if (Array.isArray(obj)) {
      return [...obj] as T
    }
    if (obj && typeof obj === 'object') {
      return { ...obj } as T
    }
    return obj
  }
}

/**
 * Simplified version of deep copy（Only for simple objects，Better performance）
 */
export const simpleDeepClone = <T>(obj: T): T => {
  return smartDeepClone(obj)
}

/**
 * Batch deep copy（Used for batch operations such as arrays）
 */
export const batchDeepClone = <T>(items: T[]): T[] => {
  try {
    // Try batch processing
    const rawItems = items.map(smartDeepToRaw)
    return structuredClone(rawItems)
  } catch {
    // Downgrade to single processing
    return items.map(smartDeepClone)
  }
}

/**
 * Compatibility deep copy（make sure100%success）
 */
export const safeDeepClone = <T>(obj: T): T => {
  return smartDeepClone(obj, { forceJSON: true })
}

// Default export
export default smartDeepClone
