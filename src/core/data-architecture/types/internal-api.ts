/**
 * internalAPIInterface type definition
 * used forHTTPConfigure form's internal address selection and template functionality
 */

/**
 * HTTPmethod type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Parameter type
 */
export interface ApiParameter {
  name: string // Parameter name
  type: 'string' | 'number' | 'boolean' | 'object' // Parameter type
  required: boolean // Is it required?
  description?: string // Parameter description
  example?: any // Example value
}

/**
 * internalAPIinterface item
 */
export interface InternalApiItem {
  label: string // Interface name description
  value: string // URLpath（as selectorvalue）
  url: string // wholeURLpath
  method: HttpMethod // HTTPRequest method
  description?: string // Brief description
  commonParams?: ApiParameter[] // Common parameter list
  hasPathParams: boolean // Whether to include path parameter placeholders
  pathParamNames?: string[] // List of path parameter names (like ['id', 'deviceId'])
  module: string // Belonging module
  functionName?: string // Original function name
}

/**
 * APIModule grouping
 */
export interface ApiModule {
  type: 'group'
  label: string
  key: string
  children: InternalApiItem[]
}

/**
 * internalAPIdata structure（for dropdown selector）
 */
export type InternalAddressOptions = ApiModule[]

/**
 * Path parameter extraction tool function
 */
export function extractPathParams(url: string): string[] {
  const matches = url.match(/\{([^}]+)\}/g)
  if (!matches) return []

  return matches.map(match => match.slice(1, -1)) // remove { }
}

/**
 * DetectionURLWhether to include path parameters
 */
export function hasPathParameters(url: string): boolean {
  return /\{[^}]+\}/.test(url)
}

/**
 * according toURLandHTTPMethod generation interface description
 */
export function generateApiDescription(url: string, method: HttpMethod, functionName?: string): string {
  const pathSegments = url.split('/').filter(segment => segment.length > 0)
  const lastSegment = pathSegments[pathSegments.length - 1]

  // If there are function names and comments，priority use
  if (functionName) {
    const descriptions: Record<string, string> = {
      get: 'Get',
      post: 'create',
      put: 'renew',
      delete: 'delete'
    }

    const action = descriptions[method.toLowerCase()] || method
    return `${action}${lastSegment.replace(/\{[^}]+\}/g, '')}`
  }

  return `${method} ${url}`
}

/**
 * APIMapping of function name to Chinese description
 */
export const API_DESCRIPTION_MAP: Record<string, string> = {
  // Device management
  getDeviceGroup: 'Get device group',
  deviceGroupTree: 'Get device group tree',
  deviceGroup: 'Device grouping operations',
  deviceGroupDetail: 'Get device group details',
  deviceList: 'Get device list',
  deviceDetail: 'Get device details',
  deviceDelete: 'Remove device',
  deviceAdd: 'Add device',
  deviceUpdate: 'Update device',
  telemetryDataCurrent: 'Get the current telemetry data of the device',
  telemetryDataHistoryList: 'Get device historical telemetry data',

  // Panel management
  getBoardList: 'Get panel list',
  getBoard: 'Get panel details',
  PostBoard: 'Create panel',
  PutBoard: 'Update panel',
  DelBoard: 'Delete panel',
  deviceListForPanel: 'Get panel device list',
  deviceMetricsList: 'Get a list of device metrics',

  // System management
  fetchGetRoleList: 'Get role list',
  fetchGetAllRoles: 'Get all roles',
  fetchGetUserList: 'Get user list',
  fetchGetMenuList: 'Get menu list',

  // System data
  totalNumber: 'Get total device statistics',
  sumData: 'Get tenant device statistics',
  tenantNum: 'Get tenant message statistics',
  tenant: 'Get tenant statistics',
  telemetryApi: 'Get telemetry data',
  telemetryLatestApi: 'Get the latest telemetry data'
}
