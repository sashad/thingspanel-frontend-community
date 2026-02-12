/**
 * Type compatibility checking mechanism
 * Used to verify type compatibility between different components and configurations，Ensure correctness of system integration
 */

import type {
  HttpConfig,
  HttpParameter,
  PathParameter,
  ComponentDataRequirement,
  DataSourceRequirement,
  FieldRequirement,
  StaticParamRequirement,
  ValidationResult,
  DataType,
  ParamType,
  ValueMode,
  FieldType
} from './types/unified-types'

/**
 * Compatibility check results
 */
export interface CompatibilityCheckResult extends ValidationResult {
  /** Compatibility level */
  level: 'compatible' | 'warning' | 'incompatible'
  /** Check type */
  checkType: string
  /** Affected components/Field */
  affectedItems: string[]
  /** Suggested fix */
  suggestions: string[]
  /** Check timestamp */
  timestamp: number
}

/**
 * Type map compatibility
 */
interface TypeMappingCompatibility {
  /** Source type */
  sourceType: string
  /** target type */
  targetType: string
  /** Is it compatible */
  isCompatible: boolean
  /** Do you need to convert */
  needsConversion: boolean
  /** Conversion function name */
  conversionFunction?: string
}

/**
 * Component interface compatibility
 */
interface ComponentInterfaceCompatibility {
  /** Component type */
  componentType: string
  /** Expected interface signature */
  expectedInterface: Record<string, any>
  /** actual interface signature */
  actualInterface: Record<string, any>
  /** missing fields */
  missingFields: string[]
  /** extra fields */
  extraFields: string[]
  /** Fields with mismatched types */
  mismatchedFields: Array<{
    field: string
    expected: string
    actual: string
  }>
}

/**
 * Type Compatibility Checker
 */
export class TypeCompatibilityChecker {
  private static instance: TypeCompatibilityChecker | null = null

  /** type mapping table */
  private typeMappingTable = new Map<string, TypeMappingCompatibility[]>()

  /** Component interface cache */
  private componentInterfaceCache = new Map<string, ComponentInterfaceCompatibility>()

  /** Check history */
  private checkHistory: CompatibilityCheckResult[] = []

  private constructor() {
    this.initializeTypeMappingTable()
  }

  public static getInstance(): TypeCompatibilityChecker {
    if (!this.instance) {
      this.instance = new TypeCompatibilityChecker()
    }
    return this.instance
  }

  /**
   * Initialize type mapping table
   */
  private initializeTypeMappingTable(): void {
    // Basic type compatibility mapping
    const basicTypeMappings: TypeMappingCompatibility[] = [
      // stringtype mapping
      { sourceType: 'string', targetType: 'string', isCompatible: true, needsConversion: false },
      {
        sourceType: 'string',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'stringToNumber'
      },
      {
        sourceType: 'string',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'stringToBoolean'
      },

      // numbertype mapping
      { sourceType: 'number', targetType: 'number', isCompatible: true, needsConversion: false },
      {
        sourceType: 'number',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'numberToString'
      },
      {
        sourceType: 'number',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'numberToBoolean'
      },

      // booleantype mapping
      { sourceType: 'boolean', targetType: 'boolean', isCompatible: true, needsConversion: false },
      {
        sourceType: 'boolean',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'booleanToString'
      },
      {
        sourceType: 'boolean',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'booleanToNumber'
      },

      // jsontype mapping
      { sourceType: 'json', targetType: 'json', isCompatible: true, needsConversion: false },
      { sourceType: 'json', targetType: 'object', isCompatible: true, needsConversion: false },
      { sourceType: 'object', targetType: 'json', isCompatible: true, needsConversion: false },

      // anytype mapping（Compatible with all types）
      {
        sourceType: 'any',
        targetType: 'string',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToString'
      },
      {
        sourceType: 'any',
        targetType: 'number',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToNumber'
      },
      {
        sourceType: 'any',
        targetType: 'boolean',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'anyToBoolean'
      },
      { sourceType: 'any', targetType: 'object', isCompatible: true, needsConversion: false },
      { sourceType: 'any', targetType: 'array', isCompatible: true, needsConversion: false }
    ]

    this.typeMappingTable.set('basic', basicTypeMappings)

    // HTTPParameter type mapping
    const httpParameterMappings: TypeMappingCompatibility[] = [
      { sourceType: 'path', targetType: 'query', isCompatible: false, needsConversion: false },
      {
        sourceType: 'query',
        targetType: 'header',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'queryToHeader'
      },
      {
        sourceType: 'header',
        targetType: 'query',
        isCompatible: true,
        needsConversion: true,
        conversionFunction: 'headerToQuery'
      }
    ]

    this.typeMappingTable.set('httpParameter', httpParameterMappings)
  }

  /**
   * examineHTTPConfiguration compatibility
   */
  public checkHttpConfigCompatibility(config: HttpConfig): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    try {
      // 1. examineURLFormat compatibility
      const urlCheck = this.checkUrlFormat(config.url)
      if (!urlCheck.isValid) {
        errors.push(`URLFormat error: ${urlCheck.error}`)
        affectedItems.push('url')
        suggestions.push('Please use standardHTTP URLFormat')
      }

      // 2. examineHTTPMethod compatibility
      const methodCheck = this.checkHttpMethod(config.method)
      if (!methodCheck.isValid) {
        errors.push(`HTTPMethod not supported: ${config.method}`)
        affectedItems.push('method')
        suggestions.push('Please use standardHTTPmethod: GET, POST, PUT, DELETE, PATCH')
      }

      // 3. Check parameter type compatibility
      if (config.params) {
        const paramsCheck = this.checkHttpParametersCompatibility(config.params, 'query')
        errors.push(...paramsCheck.errors)
        warnings.push(...paramsCheck.warnings)
        affectedItems.push(...paramsCheck.affectedItems)
        suggestions.push(...paramsCheck.suggestions)
      }

      // 4. Check request header compatibility
      if (config.headers) {
        const headersCheck = this.checkHttpParametersCompatibility(config.headers, 'header')
        errors.push(...headersCheck.errors)
        warnings.push(...headersCheck.warnings)
        affectedItems.push(...headersCheck.affectedItems)
        suggestions.push(...headersCheck.suggestions)
      }

      // 5. Check path parameter compatibility
      if (config.pathParameter) {
        const pathParamCheck = this.checkPathParameterCompatibility(config.pathParameter, config.url)
        if (!pathParamCheck.isValid) {
          errors.push(...pathParamCheck.errors)
          warnings.push(...pathParamCheck.warnings)
          affectedItems.push('pathParameter')
          suggestions.push(...pathParamCheck.suggestions)
        }
      }

      // 6. Check the reasonableness of the timeout value
      if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
        warnings.push(`The timeout setting may be unreasonable: ${config.timeout}ms`)
        affectedItems.push('timeout')
        suggestions.push('It is recommended that the timeout be set at1Seconds to arrive5between minutes')
      }

      const level = errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible'

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        level,
        checkType: 'HttpConfig',
        affectedItems,
        suggestions,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`HTTPConfiguration compatibility check failed: ${error.message}`],
        warnings: [],
        level: 'incompatible',
        checkType: 'HttpConfig',
        affectedItems: ['entire_config'],
        suggestions: ['Check, pleaseHTTPIs the configuration format correct?'],
        timestamp: Date.now()
      }
    }
  }

  /**
   * Check component data requirements compatibility
   */
  public checkComponentDataRequirementCompatibility(requirement: ComponentDataRequirement): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    try {
      // 1. Check componentsIDFormat
      if (!requirement.componentId || typeof requirement.componentId !== 'string') {
        errors.push('componentsIDInvalid or missing')
        affectedItems.push('componentId')
        suggestions.push('Please provide a valid componentIDstring')
      }

      // 2. Check static parameter compatibility
      if (requirement.staticParams) {
        for (let i = 0; i < requirement.staticParams.length; i++) {
          const param = requirement.staticParams[i]
          const paramCheck = this.checkStaticParamCompatibility(param, i)
          if (!paramCheck.valid) {
            errors.push(...paramCheck.errors)
            warnings.push(...paramCheck.warnings)
            affectedItems.push(`staticParams[${i}]`)
            suggestions.push(...paramCheck.suggestions)
          }
        }
      }

      // 3. Check data source requirements compatibility
      if (requirement.dataSources && requirement.dataSources.length > 0) {
        for (let i = 0; i < requirement.dataSources.length; i++) {
          const dataSource = requirement.dataSources[i]
          const dataSourceCheck = this.checkDataSourceRequirementCompatibility(dataSource, i)
          if (!dataSourceCheck.valid) {
            errors.push(...dataSourceCheck.errors)
            warnings.push(...dataSourceCheck.warnings)
            affectedItems.push(`dataSources[${i}]`)
            suggestions.push(...dataSourceCheck.suggestions)
          }
        }
      } else {
        warnings.push('The component does not define any data source requirements')
        suggestions.push('Consider adding data source requirements to support dynamic data')
      }

      // 4. Check for field naming conflicts
      const fieldNames = new Set<string>()
      if (requirement.staticParams) {
        requirement.staticParams.forEach(param => {
          if (fieldNames.has(param.key)) {
            errors.push(`Duplicate static parameter field names: ${param.key}`)
            affectedItems.push(`staticParams.${param.key}`)
            suggestions.push(`Please provide the field ${param.key} Use a unique name`)
          }
          fieldNames.add(param.key)
        })
      }

      const level = errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible'

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        level,
        checkType: 'ComponentDataRequirement',
        affectedItems,
        suggestions,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Component data requirement compatibility check failed: ${error.message}`],
        warnings: [],
        level: 'incompatible',
        checkType: 'ComponentDataRequirement',
        affectedItems: ['entire_requirement'],
        suggestions: ['Please check whether the component data requirement format is correct'],
        timestamp: Date.now()
      }
    }
  }

  /**
   * Check data type compatibility
   */
  public checkDataTypeCompatibility(
    sourceType: DataType | FieldType,
    targetType: DataType | FieldType
  ): CompatibilityCheckResult {
    const basicMappings = this.typeMappingTable.get('basic') || []
    const mapping = basicMappings.find(m => m.sourceType === sourceType && m.targetType === targetType)

    if (!mapping) {
      return {
        valid: false,
        errors: [`Not supported from ${sourceType} arrive ${targetType} type conversion`],
        warnings: [],
        level: 'incompatible',
        checkType: 'DataTypeCompatibility',
        affectedItems: [sourceType, targetType],
        suggestions: [`Consider using compatible data types or adding type conversion logic`],
        timestamp: Date.now()
      }
    }

    const warnings: string[] = []
    const suggestions: string[] = []

    if (mapping.needsConversion) {
      warnings.push(`Type conversion required: ${sourceType} -> ${targetType}`)
      suggestions.push(`Use conversion functions: ${mapping.conversionFunction}`)
    }

    return {
      valid: mapping.isCompatible,
      errors: [],
      warnings,
      level: mapping.isCompatible ? (warnings.length > 0 ? 'warning' : 'compatible') : 'incompatible',
      checkType: 'DataTypeCompatibility',
      affectedItems: [sourceType, targetType],
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * Check compatibility in batches
   */
  public batchCompatibilityCheck(
    items: Array<{
      type: 'httpConfig' | 'componentRequirement' | 'dataType'
      data: any
      id: string
    }>
  ): CompatibilityCheckResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const allSuggestions: string[] = []
    const allAffectedItems: string[] = []

    for (const item of items) {
      let result: CompatibilityCheckResult

      switch (item.type) {
        case 'httpConfig':
          result = this.checkHttpConfigCompatibility(item.data)
          break
        case 'componentRequirement':
          result = this.checkComponentDataRequirementCompatibility(item.data)
          break
        case 'dataType':
          result = this.checkDataTypeCompatibility(item.data.sourceType, item.data.targetType)
          break
        default:
          continue
      }

      if (!result.valid) {
        allErrors.push(...result.errors.map(error => `[${item.id}] ${error}`))
      }
      allWarnings.push(...result.warnings.map(warning => `[${item.id}] ${warning}`))
      allSuggestions.push(...result.suggestions.map(suggestion => `[${item.id}] ${suggestion}`))
      allAffectedItems.push(...result.affectedItems.map(item => `${item.id}.${item}`))
    }

    const level = allErrors.length > 0 ? 'incompatible' : allWarnings.length > 0 ? 'warning' : 'compatible'

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      level,
      checkType: 'BatchCompatibilityCheck',
      affectedItems: allAffectedItems,
      suggestions: allSuggestions,
      timestamp: Date.now()
    }
  }

  /**
   * URLFormat check
   */
  private checkUrlFormat(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URLcannot be empty' }
    }

    try {
      // Check if it is a relative path（allow）
      if (url.startsWith('/')) {
        return { isValid: true }
      }

      // Check if it is completeURL
      const urlObj = new URL(url)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'Only supportsHTTPandHTTPSprotocol' }
      }

      return { isValid: true }
    } catch {
      return { isValid: false, error: 'URLIncorrect format' }
    }
  }

  /**
   * HTTPmethod check
   */
  private checkHttpMethod(method: string): { isValid: boolean } {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    return { isValid: validMethods.includes(method.toUpperCase()) }
  }

  /**
   * HTTPParameter compatibility check
   */
  private checkHttpParametersCompatibility(
    parameters: HttpParameter[],
    paramType: ParamType
  ): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    const affectedItems: string[] = []

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i]

      // Check required fields
      if (!param.key) {
        errors.push(`parameter[${i}]LackkeyField`)
        affectedItems.push(`params[${i}].key`)
        suggestions.push(`as parameters[${i}]provide validkeyvalue`)
      }

      // Check data type
      if (!['string', 'number', 'boolean', 'json'].includes(param.dataType)) {
        errors.push(`parameter[${i}]Invalid data type: ${param.dataType}`)
        affectedItems.push(`params[${i}].dataType`)
        suggestions.push(`Use valid data types: string, number, boolean, json`)
      }

      // Check parameter type match
      if (param.paramType && param.paramType !== paramType) {
        warnings.push(`parameter[${i}]type mismatch，expect: ${paramType}, actual: ${param.paramType}`)
        affectedItems.push(`params[${i}].paramType`)
        suggestions.push(`The unified parameter type is: ${paramType}`)
      }

      // Check variable names of dynamic parameters
      if (param.isDynamic && !param.variableName) {
        errors.push(`dynamic parameters[${i}]LackvariableName`)
        affectedItems.push(`params[${i}].variableName`)
        suggestions.push(`is a dynamic parameter[${i}]Provide variable name`)
      }

      // Check value pattern compatibility
      if (param.valueMode && !['manual', 'dropdown', 'property', 'component'].includes(param.valueMode)) {
        errors.push(`parameter[${i}]Invalid value pattern: ${param.valueMode}`)
        affectedItems.push(`params[${i}].valueMode`)
        suggestions.push(`Use valid value pattern: manual, dropdown, property, component`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      level: errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      checkType: `HttpParameter_${paramType}`,
      affectedItems,
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * Path parameter compatibility check
   */
  private checkPathParameterCompatibility(pathParam: PathParameter, url: string): CompatibilityCheckResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // examineURLWhether to include path parameter placeholders
    if (pathParam.isDynamic && !url.includes('{') && !url.includes(':')) {
      warnings.push('URLPath parameter placeholder not found in，But the parameter is marked as dynamic')
      suggestions.push('pleaseURLAdd path parameter placeholders in，like: /api/device/{id}')
    }

    // Check data type
    if (!['string', 'number', 'boolean', 'json'].includes(pathParam.dataType)) {
      errors.push(`Path parameter data type is invalid: ${pathParam.dataType}`)
      suggestions.push('Use valid data types: string, number, boolean, json')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      level: errors.length > 0 ? 'incompatible' : warnings.length > 0 ? 'warning' : 'compatible',
      checkType: 'PathParameter',
      affectedItems: ['pathParameter'],
      suggestions,
      timestamp: Date.now()
    }
  }

  /**
   * Static parameter compatibility check
   */
  private checkStaticParamCompatibility(param: StaticParamRequirement, index: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!param.key) {
      errors.push('Static parameters are missingkeyField')
      suggestions.push('Provide unique parameter key names')
    }

    if (!param.name) {
      errors.push('Static parameters are missingnameField')
      suggestions.push('Provide parameter display name')
    }

    if (!['string', 'number', 'boolean', 'object', 'array'].includes(param.type)) {
      errors.push(`Invalid static parameter type: ${param.type}`)
      suggestions.push('Use valid types: string, number, boolean, object, array')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Data source requirement compatibility check
   */
  private checkDataSourceRequirementCompatibility(requirement: DataSourceRequirement, index: number): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    if (!requirement.key) {
      errors.push('Data source requirements are missingkeyField')
      suggestions.push('Provide a unique data source key name')
    }

    if (!requirement.supportedTypes || requirement.supportedTypes.length === 0) {
      errors.push('Data source requirement does not define supported types')
      suggestions.push('Define at least one supported data source type')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get inspection history
   */
  public getCheckHistory(): CompatibilityCheckResult[] {
    return [...this.checkHistory]
  }

  /**
   * Clear inspection history
   */
  public clearCheckHistory(): void {
    this.checkHistory = []
  }

  /**
   * Get type mapping statistics
   */
  public getTypeMappingStats() {
    const stats = new Map<string, number>()

    for (const [category, mappings] of this.typeMappingTable) {
      stats.set(category, mappings.length)
    }

    return {
      categories: Array.from(this.typeMappingTable.keys()),
      totalMappings: Array.from(stats.values()).reduce((sum, count) => sum + count, 0),
      categoryStats: Object.fromEntries(stats)
    }
  }
}

/**
 * Export singleton instance
 */
export const typeCompatibilityChecker = TypeCompatibilityChecker.getInstance()

/**
 * Convenient way to check compatibility
 */
export function checkHttpConfigCompatibility(config: HttpConfig): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkHttpConfigCompatibility(config)
}

export function checkComponentDataRequirementCompatibility(
  requirement: ComponentDataRequirement
): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkComponentDataRequirementCompatibility(requirement)
}

export function checkDataTypeCompatibility(
  sourceType: DataType | FieldType,
  targetType: DataType | FieldType
): CompatibilityCheckResult {
  return typeCompatibilityChecker.checkDataTypeCompatibility(sourceType, targetType)
}

// Development environment debugging interface
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).__TYPE_COMPATIBILITY_CHECKER__ = {
    checker: typeCompatibilityChecker,
    checkHttpConfig: checkHttpConfigCompatibility,
    checkComponentRequirement: checkComponentDataRequirementCompatibility,
    checkDataType: checkDataTypeCompatibility,
    getStats: () => typeCompatibilityChecker.getTypeMappingStats(),
    getHistory: () => typeCompatibilityChecker.getCheckHistory(),
    clearHistory: () => typeCompatibilityChecker.clearCheckHistory()
  }
}
