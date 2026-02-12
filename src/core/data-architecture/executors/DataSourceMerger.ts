/**
 * third floor：data source combiner (DataSourceMerger)
 * Responsibilities：Combine multiple data items into the final data from the data source
 * Integrated script-engine Secure Script Execution System
 */

import { defaultScriptEngine } from '@/core/script-engine'

export type MergeStrategy =
  | {
      type: 'object'
      /** Splicing into large objects */
    }
  | {
      type: 'array'
      /** Spliced ​​into a large array */
    }
  | {
      type: 'select'
      /** Select one of the data items */
      selectedIndex?: number
    }
  | {
      type: 'script'
      /** Custom script processinglist */
      script: string
    }

/**
 * Data source combiner interface
 */
export interface IDataSourceMerger {
  /**
   * Merge data items based on policy
   * @param items List of processed data items
   * @param strategy merge strategy
   * @returns The final data of the merged data source，Return on error {}
   */
  mergeDataItems(items: any[], strategy: MergeStrategy): Promise<any>
}

/**
 * Data source combiner implementation class
 */
export class DataSourceMerger implements IDataSourceMerger {
  /**
   * Data item merge main method
   */
  async mergeDataItems(items: any[], strategy: MergeStrategy): Promise<any> {
    try {
      // Pre-dependency checking：There must be data items to merge
      if (!items || items.length === 0) {
        return {}
      }

      // Intelligent default policy selection
      const finalStrategy = this.selectDefaultStrategy(items, strategy)
      switch (finalStrategy.type) {
        case 'object':
          const objectResult = await this.mergeAsObject(items)
          return objectResult
        case 'array':
          const arrayResult = await this.mergeAsArray(items)
          return arrayResult
        case 'select':
          const selectResult = await this.selectOne(items, (finalStrategy as any).selectedIndex)
          return selectResult
        case 'script':
          const scriptResult = await this.mergeByScript(items, finalStrategy.script)
          return scriptResult
        default:
          return {}
      }
    } catch (error) {
      return {} // Unified error handling：Return empty object
    }
  }

  /**
   * Intelligent default policy selection
   * Use default strategy for single item，Use the specified strategy when there are multiple items
   */
  private selectDefaultStrategy(items: any[], strategy: MergeStrategy): MergeStrategy {
    // 🔥 repair：Whether single or multiple，Both use user-specified policies
    // If no policy is specified，then use the default object Strategy
    if (!strategy || !strategy.type) {
      return { type: 'object' }
    }
    return strategy
  }

  /**
   * merge into large object
   * Combine multiple data items into one object by index or key
   */
  private async mergeAsObject(items: any[]): Promise<any> {
    try {
      const result: Record<string, any> = {}

      items.forEach((item, index) => {
        if (item !== null && item !== undefined) {
          // If the data item itself is an object，Expand its properties
          if (typeof item === 'object' && !Array.isArray(item)) {
            Object.assign(result, item)
          } else {
            // Otherwise place the result object by index
            result[`item_${index}`] = item
          }
        }
      })

      return result
    } catch (error) {
      return {}
    }
  }

  /**
   * 🔥 New：Select one of the data items
   * Returns a specific data item based on a user-specified index
   */
  private async selectOne(items: any[], selectedIndex?: number): Promise<any> {
    try {
      // The first data item is selected by default（index0）
      const index = selectedIndex ?? 0

      // Boundary checking
      if (index < 0 || index >= items.length) {
        return items[0] ?? {}
      }

      const selectedItem = items[index]
      return selectedItem ?? {}
    } catch (error) {
      return {}
    }
  }

  /**
   * merge into large array
   * Concatenate multiple data items into an array
   */
  private async mergeAsArray(items: any[]): Promise<any[]> {
    try {
      const result: any[] = []

      for (const item of items) {
        if (item !== null && item !== undefined) {
          // If the data item itself is an array，expand its elements
          if (Array.isArray(item)) {
            result.push(...item)
          } else {
            // Otherwise add it directly to the result array
            result.push(item)
          }
        }
      }

      return result
    } catch (error) {
      return []
    }
  }

  /**
   * Merge via custom script (use script-engine Safe execution)
   * Incoming data item list，Let user script handle it
   */
  private async mergeByScript(items: any[], script: string): Promise<any> {
    try {
      // Create script execution context
      const scriptContext = {
        items
        // script-engine Already built in JSON, console, Math, Date, Array, Object wait
      }

      // use script-engine Safe execution of scripts
      const result = await defaultScriptEngine.execute(script, scriptContext)

      if (result.success) {
        return result.data !== undefined ? result.data : {}
      } else {
        return {} // Returns an empty object when the script fails
      }
    } catch (error) {
      return {} // Returns an empty object when the script fails
    }
  }

  /**
   * Verify the effectiveness of the merge strategy
   */
  validateMergeStrategy(strategy: MergeStrategy): boolean {
    if (!strategy || !strategy.type) {
      return false
    }

    switch (strategy.type) {
      case 'object':
      case 'array':
      case 'select':
        return true
      case 'script':
        return !!(strategy as any).script
      default:
        return false
    }
  }

  /**
   * Get recommended merge strategies
   * Recommend the best merge strategy based on the type of data items
   */
  getRecommendedStrategy(items: any[]): MergeStrategy {
    if (!items || items.length === 0) {
      return { type: 'object' }
    }

    if (items.length === 1) {
      return { type: 'object' }
    }

    // If all data items are arrays，recommendarraymerge
    const allArrays = items.every(item => Array.isArray(item))
    if (allArrays) {
      return { type: 'array' }
    }

    // If all data items are objects，recommendobjectmerge
    const allObjects = items.every(item => item && typeof item === 'object' && !Array.isArray(item))
    if (allObjects) {
      return { type: 'object' }
    }

    // Used by defaultarraymerge
    return { type: 'array' }
  }
}
