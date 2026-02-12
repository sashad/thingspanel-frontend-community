/**
 * second floor：data item handler (DataItemProcessor)
 * Responsibilities：Filter and script raw data
 * Integrated script-engine Secure Script Execution System
 */

import { defaultScriptEngine } from '@/core/script-engine'

export interface ProcessingConfig {
  /** JSONPathSyntax filter path，like: $.abc.bcd[0] */
  filterPath: string
  /** Custom script processing */
  customScript?: string
  /** Default configuration */
  defaultValue?: any
}

/**
 * Data item handler interface
 */
export interface IDataItemProcessor {
  /**
   * Process raw data：Path filtering + Custom script processing
   * @param rawData raw data
   * @param config Handle configuration
   * @returns Processed data，Return on error {}
   */
  processData(rawData: any, config: ProcessingConfig): Promise<any>
}

/**
 * Data item processor implementation class
 */
export class DataItemProcessor implements IDataItemProcessor {
  /**
   * Data processing main method
   */
  async processData(rawData: any, config: ProcessingConfig): Promise<any> {
    try {
      // 🔥 repair：Improve empty data checking logic
      if (rawData === null || rawData === undefined) {
        return config.defaultValue || {}
      }

      // Allow empty arrays、Empty string etc."falsy but valid"value
      if (typeof rawData === 'object' && Object.keys(rawData).length === 0 && !Array.isArray(rawData)) {
        return config.defaultValue || {}
      }

      // first step：JSONPathPath filtering
      let filteredData = await this.applyPathFilter(rawData, config.filterPath)

      // Step 2：Custom script processing
      if (config.customScript) {
        filteredData = await this.applyCustomScript(filteredData, config.customScript)
      } else {
      }

      // 🔥 repair：allowfalsybut meaningful value（like 0、false、[]、""）
      const finalResult = filteredData !== null && filteredData !== undefined ? filteredData : config.defaultValue || {}
      return finalResult
    } catch (error) {
      return config.defaultValue || {} // Unified error handling：Returns a default value or an empty object
    }
  }

  /**
   * applicationJSONPathPath filtering
   * Simplified versionJSONPathaccomplish，Support basic$.abc.bcd[0]grammar
   */
  private async applyPathFilter(data: any, filterPath: string): Promise<any> {
    try {
      // If the path is empty or is$，Return the original data directly
      if (!filterPath || filterPath === '$') {
        return data
      }

      // Remove the beginning of$symbol
      let path = filterPath.startsWith('$') ? filterPath.substring(1) : filterPath
      if (path.startsWith('.')) {
        path = path.substring(1)
      }

      // if path is empty，Return to original data
      if (!path) {
        return data
      }

      // according to.split path
      const pathParts = path.split('.')
      let current = data

      for (const part of pathParts) {
        if (current == null) {
          return null // 🔥 repair：returnnullinstead of{}，Indicates that the path does not exist
        }

        // Handle array index，like abc[0]
        if (part.includes('[') && part.includes(']')) {
          const [key, indexPart] = part.split('[')
          const index = parseInt(indexPart.replace(']', ''))

          if (key) {
            current = current[key]
          }

          if (Array.isArray(current) && !isNaN(index)) {
            current = current[index]
          } else {
            return null // 🔥 repair：returnnullinstead of{}
          }
        } else {
          // Normal property access
          current = current[part]
        }
      }

      // 🔥 repair：Allow all types of values，includefalse、0、""、[]wait
      return current // Return results directly，Don't judgeundefined
    } catch (error) {
      return {}
    }
  }

  /**
   * Apply custom script processing (use script-engine Safe execution)
   */
  private async applyCustomScript(data: any, script: string): Promise<any> {
    try {
      // Create script execution context
      const scriptContext = {
        data
        // script-engine Already built in JSON, console, Math, Date wait
      }

      // use script-engine Safe execution of scripts
      const result = await defaultScriptEngine.execute(script, scriptContext)

      if (result.success) {
        return result.data !== undefined ? result.data : data
      } else {
        return data // Return original data when script fails
      }
    } catch (error) {
      return data // Return original data when script fails
    }
  }

  /**
   * verifyJSONPathgrammatical legality
   */
  validateFilterPath(filterPath: string): boolean {
    if (!filterPath) return true

    // Basic syntax verification：Must be$Begins with or is directly the attribute name
    const validPattern = /^(\$\.?)?[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/
    return validPattern.test(filterPath) || filterPath === '$'
  }
}
