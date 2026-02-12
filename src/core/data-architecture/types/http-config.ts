/**
 * HTTPConfiguration type definition（Perfect version）
 * based onSUBTASK-008Complete document design
 */

/**
 * HTTPParameter unified interface
 * Support path parameters、query parameters、Unified management of request header parameters
 */
export interface HttpParameter {
  /** Parameter key name */
  key: string

  /** Parameter value - Example value，type withdataTypematch */
  value: string | number | boolean

  /** default value - whenvalueFallback value to use when empty */
  defaultValue?: string | number | boolean

  /** Whether to enable this parameter */
  enabled: boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Automatically generated when dynamic：var_ + keyofsnake_case */
  variableName: string

  /** Parameter description，Required */
  description: string

  /** Parameter type：The path parameters are spliced ​​directly toURLback，query parameters asquery，The request header parameters are asheader */
  paramType: 'path' | 'query' | 'header'

  /** Parameter value mode：Manual entry、drop down selection、Property binding, etc. */
  valueMode?: string

  /** selected templateID */
  selectedTemplate?: string
}

/**
 * HTTPRequest header configuration - Reserved for backward compatibility
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'header'
 */
export interface HttpHeader extends HttpParameter {}

/**
 * HTTPQuery parameter configuration - Reserved for backward compatibility
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'query'
 */
export interface HttpParam extends HttpParameter {}

/**
 * HTTPPath parameter configuration - Reserved for backward compatibility
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'path'
 */
export interface HttpPathParam extends HttpParameter {
  /** path parameter name（without braces），like 'device_id' */
  key: string
  /** existURLplaceholder format in，like '{device_id}' */
  placeholder: string
}

/**
 * Simplified configuration of path parameters
 * Only supports a single path parameter，directly spliced ​​toURLback
 */
export interface PathParameter {
  /** Parameter value - Example value，type withdataTypematch */
  value: string | number | boolean

  /** default value - whenvalueFallback value to use when empty */
  defaultValue?: string | number | boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Automatically generated when dynamic：var_path_param */
  variableName: string

  /** Parameter description */
  description: string

  /** Parameter value mode：Manual entry、drop down selection、Property binding, etc. */
  valueMode?: string

  /** selected templateID */
  selectedTemplate?: string
}

// importEnhancedParametertype
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

/**
 * HTTPConfigure interface（Simplified path parameter version）
 */
export interface HttpConfig {
  /** Basic requestURL（The path parameters will be spliced ​​hereURLback） */
  url: string

  /** HTTPmethod */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** timeout（millisecond） */
  timeout: number

  /** Address type：Internal or external address */
  addressType?: 'internal' | 'external'

  /** Selected internal address value（whenaddressTypeforinternalused when） */
  selectedInternalAddress?: string

  /** Whether to enable parameter passing（Path parameter configuration for internal addresses） */
  enableParams?: boolean

  /** Path parameter configuration array（new format，Support multiple parameters） */
  pathParams?: EnhancedParameter[]

  /** path parameters（Optional，A single parameter is spliced ​​directly toURLback） */
  pathParameter?: PathParameter

  /** Query parameter configuration */
  params: HttpParam[]

  /** Request header configuration */
  headers: HttpHeader[]

  /** Request body（Optional） */
  body?: string

  /** Pre-request processing script（Optional） */
  preRequestScript?: string

  /** Response post-processing script（Optional） */
  postResponseScript?: string

  // backward compatibility fields（Deprecated）
  /** @deprecated Use simplified pathParameter field substitution */
  pathParams?: HttpPathParam[]
  /** @deprecated Use the new unity parameters field substitution */
  parameters?: HttpParameter[]
}

/**
 * type converter - Convert a value to a specified data type
 */
export function convertValue(value: any, dataType: string): any {
  if (value === null || value === undefined) return value

  switch (dataType) {
    case 'string':
      return String(value)
    case 'number':
      const num = Number(value)
      return isNaN(num) ? 0 : num
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value.toLowerCase() === 'true'
      return Boolean(value)
    case 'json':
      if (typeof value === 'object') return value
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }
      return value
    default:
      return value
  }
}

/**
 * Create default path parameters
 */
export function createDefaultPathParameter(): PathParameter {
  return {
    value: '',
    isDynamic: false, // Default is static
    dataType: 'string',
    variableName: 'var_path_param',
    description: 'path parameters'
  }
}

/**
 * create defaultHTTPparameter (backwards compatible)
 * @deprecated It is recommended to use specific creation functions
 */
export function createDefaultHttpParameter(paramType: 'path' | 'query' | 'header' = 'query'): HttpParameter {
  return {
    key: '',
    value: '',
    enabled: true,
    isDynamic: paramType === 'path', // Path parameters default to dynamic
    dataType: 'string',
    variableName: '',
    description: '',
    paramType
  }
}

/**
 * create defaultHttpHeader - backwards compatible
 * @deprecated use createDefaultHttpParameter('header') substitute
 */
export function createDefaultHttpHeader(): HttpHeader {
  return createDefaultHttpParameter('header') as HttpHeader
}

/**
 * create defaultHttpParam - backwards compatible
 * @deprecated use createDefaultHttpParameter('query') substitute
 */
export function createDefaultHttpParam(): HttpParam {
  return createDefaultHttpParameter('query') as HttpParam
}

/**
 * create defaultHttpPathParam - backwards compatible
 * @deprecated use createDefaultHttpParameter('path') substitute
 */
export function createDefaultHttpPathParam(): HttpPathParam {
  const baseParam = createDefaultHttpParameter('path')
  return {
    ...baseParam,
    placeholder: `{${baseParam.key}}`
  } as HttpPathParam
}

/**
 * fromURLAutomatically extract path parameters
 * @param url - Contains path parametersURL，like '/api/device/{device_id}/data/{metric_id}'
 * @returns Path parameter configuration array
 */
export function extractPathParamsFromUrl(url: string): HttpPathParam[] {
  const pathParamRegex = /\{([^}]+)\}/g
  const params: HttpPathParam[] = []
  let match

  while ((match = pathParamRegex.exec(url)) !== null) {
    const key = match[1]
    const placeholder = match[0] // complete {parameter}

    params.push({
      key,
      placeholder,
      value: `example_${key}`,
      enabled: true,
      isDynamic: true,
      dataType: 'string',
      variableName: generateVariableName(key),
      description: `path parameters：${key}`
    })
  }

  return params
}

/**
 * replaceURLpath parameters in
 * @param url - originalURL
 * @param pathParams - Path parameter configuration
 * @returns after replacementURL
 */
export function replaceUrlPathParams(url: string, pathParams: HttpPathParam[]): string {
  let resultUrl = url

  for (const param of pathParams) {
    if (param.enabled && param.value) {
      resultUrl = resultUrl.replace(param.placeholder, String(param.value))
    }
  }

  return resultUrl
}

/**
 * variable name generator - WillkeyConvert tosnake_caseformat variable name
 */
export function generateVariableName(key: string): string {
  return `var_${
    key
      .replace(/([a-z])([A-Z])/g, '$1_$2') // camelback to underline（Only when a lowercase letter is followed by an uppercase letter）
      .toLowerCase() // Convert to lower case
      .replace(/[^a-z0-9_]/g, '_') // Convert illegal characters to underline
      .replace(/_+/g, '_') // Combine multiple underscores
      .replace(/^_|_$/, '') // Remove leading and trailing underscores
  }`
}
