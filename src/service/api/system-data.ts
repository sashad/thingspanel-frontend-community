import { request } from '../request'
// Remove the incorrect import, as DeviceData is defined locally
// import type { DeviceData } from '@/views/device/utils/types';

// --- Add interface definition ---
// (If these types are defined globally，For example src/types/api.d.ts，then it should be imported from there)
export interface TelemetryItem {
  key: string
  label: string | null
  unit: string | null
  value: any
}

export interface DeviceData {
  device_id: string
  device_name: string
  is_online: number
  last_push_time: string
  telemetry_data: TelemetryItem[]
}

export interface ApiLatestTelemetryResponse {
  data: DeviceData[] | null
  error: string | object | null // Allow different error types
}

// Reintroduce the interface for the expected API response structure
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// --- End of interface definition ---

// --- definition /board/tenant returned data type ---
interface TenantMonthData {
  mon: number
  num: number
}

interface TenantBoardData {
  user_total: number
  user_added_yesterday: number
  user_added_month: number
  user_list_month: TenantMonthData[]
}
// --- End of type definition ---

/** Get the total number of devices and activations */
export const totalNumber = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/device')
  return data
}

/** Get the total number of tenant devices */
export const sumData = async (): Promise<any> => {
  return await request.get<any>('/board/tenant/device/info')
}

/** Get the total number of tenant messages */
export const tenantNum = async (): Promise<any> => {
  return await request.get<any>('/telemetry/datas/msg/count')
}

/** Get the total number of tenants、Added yesterday、New additions this month and monthly historical data */
export const tenant = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/tenant')
  return data
}

/** Get tenant dashboard data /board/tenant */

/** Added device function template information */
export const addTemplat = async (params: any): Promise<any> => {
  const data = await request.post('/device/template', params)
  return data
}
/** Update model details data */
export const putTemplat = async (params: any) => {
  const data = await request.put<any>(`/device/template`, params)
  return data
}

/** Get detailed data of object model */
export const getTemplat = async (id: any) => {
  const data = await request.get<any>(`/device/template/detail/${id}`)
  return data
}

/** Get telemetry data */
export const telemetryApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/telemetry', { params })
  return data
}
/** Get telemetry data */
export const telemetryLatestApi = async (id: any) => {
  const data = await request.get<Api.BaseApi.Data | null>(`/telemetry/datas/current/${id}`)
  return data
}

/** Get the latest telemetry data - Simplified Implementation */
export const getLatestTelemetryData = async () => {
  // 1. call request.get，Get the wrapped response
  const data = await request.get<any>(`/device/telemetry/latest`) // use any Avoid complex packaging types

  // 3. Check the extracted data Is it an array or null，then return
  return data
}

/** Get attribute data */
export const attributesApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/attributes', { params })
  return data
}

/** Get event data */
export const eventsApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/events', { params })
  return data
}

/** Get command data */
export const commandsApi = async (params: any) => {
  const data = await request.get<Api.BaseApi.Data | null>('/device/model/commands', { params })
  return data
}

/** Add telemetry data */
export const addTelemetry = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/telemetry', params)
  return data
}

/** Delete telemetry data */
export const delTelemetry = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/telemetry/${id}`)
  return data
}

/** Delete attribute data */
export const delAttributes = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/attributes/${id}`)
  return data
}

/** Delete event data */
export const delEvents = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/events/${id}`)
  return data
}

/** Delete command data */
export const delCommands = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/device/model/commands/${id}`)
  return data
}

/** Edit telemetry data */
export const putTelemetry = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/telemetry', params)
  return data
}

/** Add attribute data */
export const addAttributes = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/attributes', params)
  return data
}

/** Edit attribute data */
export const putAttributes = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/attributes', params)
  return data
}

/** Add event data */
export const addEvents = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/events', params)
  return data
}

/** Edit event data */
export const putEvents = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/events', params)
  return data
}

/** Add new command data */
export const addCommands = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/commands', params)
  return data
}

/** Edit command data */
export const putCommands = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/commands', params)
  return data
}

/** Edit command data */
export const deviceCustomCommandsList = async (params: any): Promise<any> => {
  const data = await request.get('/device/model/custom/commands', { params })
  return data
}

/** Delete custom command */
export const deviceCustomCommandsDel = async (paramsId: any): Promise<any> => {
  const data = await request.delete(`/device/model/custom/commands/${paramsId}`)
  return data
}

/** Create a new custom command */
export const deviceCustomCommandsAdd = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/custom/commands', params)
  return data
}

/** Edit custom command */
export const deviceCustomCommandsPut = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/custom/commands', params)
  return data
}

/** Custom control list */
export const deviceCustomControlList = async (params: any): Promise<any> => {
  const data = await request.get('/device/model/custom/control', { params })
  return data
}

/** Delete custom control */
export const deviceCustomControlDel = async (paramsId: any): Promise<any> => {
  const data = await request.delete(`/device/model/custom/control/${paramsId}`)
  return data
}

/** Create a new custom control */
export const deviceCustomControlAdd = async (params: any): Promise<any> => {
  const data = await request.post('/device/model/custom/control', params)
  return data
}

/** Edit custom command */
export const deviceCustomControlPut = async (params: any): Promise<any> => {
  const data = await request.put('/device/model/custom/control', params)
  return data
}

/** Get device online trends */
export const getOnlineDeviceTrend = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/board/trend')
  return data
}

/** Get the number of alarms */
export const getAlarmCount = async () => {
  const data = await request.get<Api.BaseApi.Data | null>('/alarm/device/counts')
  return data
}

/** Get current system indicators */
export const getSystemMetricsCurrent = async (params?: any): Promise<any> => {
  // Assuming the endpoint returns a generic structure or the exact structure is unknown
  const data = await request.get<any>('/system/metrics/current', { params })
  return data
}

/** Get current system indicators */
export const getSysVersion = async (params?: any): Promise<any> => {
  // Assuming the endpoint returns a generic structure or the exact structure is unknown
  const data = await request.get<any>('/sys_version', {
    params
  })
  return data
}

/** Get historical data of system indicators */
export const getSystemMetricsHistory = async (params?: any): Promise<any> => {
  if (process.env.NODE_ENV === 'development') {
  }
  try {
    const data = await request.get<any>('/system/metrics/history', { params })
    if (process.env.NODE_ENV === 'development') {
    } // Log raw response
    return data
  } catch (error) {
    console.error('Error fetching system metrics history:', error)
    throw error // Re-throw the error after logging
  }
}
