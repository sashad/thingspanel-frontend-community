/**
 * Verification tool function
 */

/**
 * Verify component definition
 */
export function validateComponentDefinition(definition: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!definition) {
    errors.push('Component definition cannot be empty')
    return { isValid: false, errors }
  }

  if (typeof definition.type !== 'string' || !definition.type.trim()) {
    errors.push('Component type (type) Must be a non-empty string')
  }

  if (typeof definition.name !== 'string' || !definition.name.trim()) {
    errors.push('Component name (name) Must be a non-empty string')
  }

  if (!definition.component) {
    errors.push('Component instance (component) cannot be empty')
  } else if (typeof definition.component !== 'object' && typeof definition.component !== 'function') {
    errors.push('Component instance (component) must be valid Vue components')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Verify data source requirements
 */
export function validateDataSourceRequirements(dataSources: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Array.isArray(dataSources)) {
    errors.push('The data source requirement must be an array')
    return { isValid: false, errors }
  }

  dataSources.forEach((ds, index) => {
    if (!ds.key || typeof ds.key !== 'string') {
      errors.push(`data source ${index} Missing valid key Field`)
    }
    if (!ds.type || !['static', 'dynamic', 'websocket'].includes(ds.type)) {
      errors.push(`data source ${index} of type must be static、dynamic or websocket`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Verify attribute whitelist
 */
export function validatePropertyWhitelist(whitelist: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!whitelist || typeof whitelist !== 'object') {
    errors.push('Property whitelist must be an object')
    return { isValid: false, errors }
  }

  Object.entries(whitelist).forEach(([propName, config]) => {
    if (!config || typeof config !== 'object') {
      errors.push(`property ${propName} The configuration must be an object`)
      return
    }

    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) {
      errors.push(`property ${propName} of type Must be a valid type`)
    }

    if (!config.label || typeof config.label !== 'string') {
      errors.push(`property ${propName} of label Must be a non-empty string`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}