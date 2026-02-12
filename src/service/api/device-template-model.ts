import { request } from '../request'

/** Get a list of device function templates */
export const deviceTemplate = async (params: { page: number; page_size: number; name?: string }) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template`, { params })
}

/** Delete device feature template */
export const deleteDeviceTemplate = async (id: string) => {
  return await request.delete<Api.BaseApi.Data | any>(`/device/template/${id}`)
}

export const getDeviceTemplateDetail = async (id: string) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template/detail/${id}`)
}

export const getDeviceModel = async (params: { page: number; page_size: number; device_template_id: string }) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params })
}

export const postDeviceModel = async (params: {
  device_template_id: string
  data_identifier: string
  data_name?: string
  data_type?: string
  unit?: string
  description?: string
}) => {
  return await request.post<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params })
}

export const putDeviceModel = async (params: {
  device_template_id: string
  data_identifier: string
  data_name?: string
  data_type?: string
  unit?: string
  description?: string
}) => {
  return await request.put<Api.BaseApi.Data | any>(`/device/model/telemetry`, { params })
}

/**
 * Get a list of devices for drop-down selection (Updated based on documentation)
 *
 * @param params - query parameters (Optional)
 */
export const getDeviceListForSelect = async (params?: Api.Device.DeviceSelectorParams) => {
  // Use the documentation provided URL and parameter types
  // APIReturn format: { code: 200, message: "Operation successful", data: { total: number, list: DeviceSelectItem[] } }
  return await request.get<{
    total: number
    list: Api.Device.DeviceSelectItem[]
  }>(`/device/selector`, { params })
}
