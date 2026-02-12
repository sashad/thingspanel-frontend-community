import type { AxiosInstance } from 'axios'
import { request } from '../request'

export default class Device {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  getData(name: string) {
    this.http.get('')
    return name
  }
}

/** Get device group */
export const getDeviceGroup = async (params: any) => {
  return await request.get<any>('/device/group', { params })
}

//
/** Access method drop-down menu（old） */
export const deviceDictProtocolService = async (params: any) => {
  return await request.get<DeviceManagement.TreeStructure | any>('/dict/protocol/service', params)
}
/** Access method drop-down menu */
export const deviceDictProtocolServiceFirstLevel = async (params: any) => {
  return await request.get<DeviceManagement.ProtocolAndService | any>('/service/plugin/select', params)
}
/** Access method drop-down secondary menu */
export const deviceDictProtocolServiceSecondLevel = async (params: any) => {
  return await request.get<DeviceManagement.ServiceList | any>('/service/access/list', params)
}

/** Get device group tree */
export const deviceGroupTree = async (params: any) => {
  return await request.get<DeviceManagement.TreeStructure | any>('/device/group/tree', params)
}
/** Add new device group */
export const deviceGroup = async (params: { id: string; parent_id: string; name: string; description: string }) => {
  return await request.post<Api.BaseApi.Data>('/device/group', params)
}

/** Modify device group */
export const putDeviceGroup = async (params: { id: string; parent_id: string; name: string; description: string }) => {
  return await request.put<Api.BaseApi.Data>('/device/group', params)
}

/** Activate device */
export const putDeviceActive = async (params: any) => {
  return await request.put<Api.BaseApi.Data>('/device/active', params)
}

/** Delete device group */
export const deleteDeviceGroup = async (params: { id: string }) => {
  return await request.delete<Api.BaseApi.Data>(`/device/group/${params.id}`)
}

/** Get device details */
export const deviceGroupDetail = async (params: any) => {
  return await request.get<DeviceManagement.DetailData>(`/device/group/detail/${params.id}`)
}

/** Get device list */
export const deviceList = async (params: any) => {
  return await request.get<DeviceManagement.DeviceDatas | any>(`/device`, {
    params
  })
}
/** Delete a device */
export const deviceDelete = async (params: any) => {
  return await request.put<DeviceManagement.DeviceDatas | any>(`/device/update/config`, params)
}
/** Get device list */
export const deviceListByGroup = async (params: any) => {
  return await request.get<DeviceManagement.DeviceDatas | any>(`/device/group/relation/list`, {
    params
  })
}

/** Get device details */
export const deviceDetail = async (id: any) => {
  const url = `/device/detail/${id}`
  return await request.get<DeviceManagement.DeviceDetail | any>(url)
}

/** Get device grouping relationship */
export const deviceGroupRelation = async (params: any) => {
  return await request.post<Api.BaseApi.Data>(`/device/group/relation`, params)
}

export const getDeviceGroupRelation = async (params: any) => {
  return await request.get<any>(`/device/group/relation`, { params })
}

/** Get device alarm status */
export const deviceAlarmStatus = async (params: any) => {
  return await request.get<any>(`/alarm/info/history/device`, { params })
}

/** Get device alarm history */
export const deviceAlarmHistory = async (params: any) => {
  return await request.get<any>(`/alarm/info/history`, { params })
}

/** Get device alarm configuration list */
export const deviceAlarmList = async (params: any) => {
  return await request.get<any>(`/scene_automations/alarm`, { params })
}

/** Modify device alarm description */
export const deviceAlarmHistoryPut = async (params: any) => {
  return await request.put<any>(`/alarm/info/history`, params)
}

/** Delete device alarm history */
export const deviceAlarmHistoryDelete = async (id: string) => {
  return await request.delete<any>(`/alarm/info/history/${id}`)
}

/** Get a list of device function templates */
export const deviceTemplate = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template`, {
    params
  })
}

/** Get service list */
export const getServiceList = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/service/list`, {
    params
  })
}

/** Get a list of device function templates */
export const deviceTemplateDetail = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/template/detail/${params.id}`)
}

/** Get device configuration list */
export const deviceConfig = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/device_config`, {
    params
  })
}

/** Create device configuration */
export const deviceConfigAdd = async (params: any) => {
  return await request.post<Api.BaseApi.Data | any>(`/device_config`, params)
}

/** Update device configuration */
export const deviceConfigEdit = async (params: any) => {
  return await request.put<Api.BaseApi.Data | any>(`/device_config`, params)
}

/** Get device configuration */
export const deviceConfigInfo = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`device_config/${params.id}`)
}
/** Delete device configuration */
export const deviceConfigDel = async (params: any) => {
  return await request.delete<Api.BaseApi.Data | any>(`device_config/${params.id}`)
}
/** Device configuration-Voucher type drop-down */
export const deviceConfigVoucherType = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/device_config/voucher_type`, { params })
}
/** Device configuration-Get device configuration form */
export const protocolPluginConfigForm = async (params: any) => {
  return await request.get<any>(`/protocol_plugin/config_form`, { params })
}
/** Batch new device configuration associated devices */
export const deviceConfigBatch = async (params: any) => {
  return await request.put<Api.BaseApi.Data | any>(`/device_config/batch`, params)
}

/** Get device list */
export const deleteDeviceGroupRelation = async (params: any) => {
  return await request.delete2<Api.BaseApi.Data>(`/device/group/relation`, params)
}

/** Get device connection information */
export const getDeviceConnectInfo = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/device/connect/info`, {
    params
  })
}

/** Get device connection information */
export const getPlugininfoByService = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>(`/service/plugin/info`, {
    params
  })
}

/** Get device configuration list */
export const getDeviceConfigList = async (params: any) => {
  return await request.get<DeviceManagement.ConfigDatas>(`/device_config`, {
    params
  })
}

/** Update device credentials */
export const updateDeviceVoucher = async (params: any) => {
  return await request.post<any>(`/device/update/voucher`, params)
}
export const deviceAdd = async (params: any) => {
  return await request.post<any>(`/device`, params)
}
export const devicCeonnectForm = async (params: any) => {
  return await request.get<any>(`/device/connect/form`, { params })
}

export const checkDevice = async (deviceNumber: { deviceNumber: any }) => {
  const url = `/device/check/${deviceNumber}`
  return await request.get<any>(url)
}
export const deleteDevice = async (params: any) => {
  return await request.delete<Api.BaseApi.Data | any>(`/device/${params.id}`)
}

export const setDeviceScriptEnable = async (params: any) => {
  return await request.put<any>(`/data_script/enable`, params)
}

/** Get data processing list */
export const getDataScriptList = async (params: any) => {
  return await request.get<DeviceManagement.ConfigDatas | any>(`/data_script`, {
    params
  })
}

/** Create data processing */
export const dataScriptAdd = async (params: any) => {
  return await request.post<Api.BaseApi.Data | any>(`/data_script`, params)
}

/** Update data processing */
export const dataScriptEdit = async (params: any) => {
  return await request.put<Api.BaseApi.Data | any>(`/data_script`, params)
}

/** Debugging data processing */
export const dataScriptQuiz = async (params: any) => {
  return await request.post<Api.BaseApi.Data | any>(`/data_script/quiz`, params, { needMessage: true } as any)
}
/** Deletion of data processing */
export const dataScriptDel = async (params: any) => {
  return await request.delete<Api.BaseApi.Data | any>(`data_script/${params.id}`)
}

/** Device telemetry current value query * */

export const telemetryDataCurrent = async (id: any) => {
  const url = `/telemetry/datas/current/${id}`
  return await request.get<DeviceManagement.telemetryCurrent | any>(url)
}

/**
 * @param params {device_id:string,keys:string}
 * @returns
 */
export const telemetryDataCurrentKeys = async (params: any) => {
  return await request.get<any>('/telemetry/datas/current/keys', { params })
}

/**
 * @param params { device_id: string, key: string, start_time: string, end_time: string, aggregate_window: string,
 *   aggregate_function: string, time_range: string }
 * @returns
 */
export const telemetryDataHistoryList = async (params: any) => {
  return await request.get<any>('/telemetry/datas/statistic', { params })
}

/** Telemetry delete data processing */
export const telemetryDataDel = async (params: any) => {
  return await request.delete2<Api.BaseApi.Data | any>(`telemetry/datas`, params)
}
/** Device telemetry current value query * */

export const getTelemetryLogList = async (params: any) => {
  return await request.get<any>(`/telemetry/datas/set/logs`, { params })
}
/** Debugging data processing */
export const telemetryDataPub = async (params: any) => {
  return await request.post<any>(`/telemetry/datas/pub`, params)
}

/** Add desired message */
export const expectMessageAdd = async (params: any) => {
  return await request.post<any>(`/expected/data`, params)
}
/** Expected message list */
export const expectMessageList = async (params: any) => {
  return await request.get<any>(`/expected/data/list`, { params })
}

/** Expect message to be deleted */
export const expectMessageDelete = async (params: any) => {
  return await request.delete<any>(`/expected/data/${params}`)
}
export const getAttributeDataSet = async (params: any) => {
  return await request.get<any>(`attribute/datas/${params.device_id}`)
}

export const deleteAttributeDataSet = async (params: any) => {
  return await request.delete<any>(`attribute/datas/${params}`)
}

/** Attribute delivery record query（Pagination） */
export const getAttributeDataSetLogs = async (params: any) => {
  return await request.get<any>(`/attribute/datas/set/logs`, { params })
}

/** Deliver attributes */
export const attributeDataPub = async (params: any) => {
  return await request.post<any>(`/attribute/datas/pub`, params)
}

/**
 * @param params {device_id:string,key:string}
 * @returns
 */
export const getAttributeDatasKey = async (params: any) => {
  return await request.get<any>('/attribute/datas/key', { params })
}

/** Attribute delivery record query（Pagination） */
export const getEventDataSet = async (params: any) => {
  return await request.get<any>(`/event/datas`, { params })
}

/** Attribute delivery record query（Pagination） */
export const getCommandDataSetLogs = async (params: any) => {
  return await request.get<any>(`/command/datas/set/logs`, { params })
}

/** Issue orders */
export const commandDataPub = async (params: any) => {
  return await request.post<any>(`/command/datas/pub`, params)
}
/** Command identifier drop-down menu */
export const commandDataById = async (id: any) => {
  const url = `/command/datas/${id}`
  return await request.get<DeviceManagement.telemetryCurrent | any>(url)
}

/** Devices with diagramslist */
export const deviceTemplateSelect = async () => {
  const url = `/device/template/chart/select`
  return await request.get<any>(url)
}

export const telemetryHistoryData = async (params: any) => {
  return await request.get<any>(`/telemetry/datas/history/page`, {
    params
  })
}

export const deviceUpdateConfig = async (params: any) => {
  return await request.put<any>(`/device/update/config`, params)
}

export const deviceConfigMenu = async (params: any) => {
  return await request.get<any>(`/device/template/menu`, { params })
}

// Save device location
export const deviceLocation = async (params: any) => {
  return await request.put<any>(`/device`, params)
}
/** Modify device name */
export const deviceUpdate = async (params: any) => {
  return await request.put<Api.BaseApi.Data>('/device', params)
}
/** List of sub-devices under the gateway */
export const childDeviceTableList = async (params: any) => {
  return await request.get<any>(`/device/sub-list/${params.id}`, {
    params
  })
}
/** Add sub-device selection list */
export const childDeviceSelectList = async () => {
  return await request.get<any>(`/device/list`, {})
}
/** Add sub-device */
export const addChildDevice = async (params: any) => {
  return await request.post<any>(`/device/son/add`, params)
}
/** Remove child device */
export const removeChildDevice = async (params: any) => {
  return await request.put<any>(`/device/sub-remove`, params)
}
/** Get device Get telemetry data command */
export const getSimulation = async (params: any) => {
  return await request.get<any>(`/telemetry/datas/simulation`, { params })
}
/** Get the device to send telemetry data command */
export const sendSimulation = async (params: any) => {
  return await request.post<any>(`/telemetry/datas/simulation`, params)
}

// According to deviceidCheck the custom command list
export const deviceCustomCommandsIdList = async (paramsId: any) => {
  return await request.get<any>(`/device/model/custom/commands/${paramsId}`)
}

export const deviceProtocalServiceList = async (params: any) => {
  return await request.get<any>(`/service/plugin/select`, { params })
}

/** Get device status history */
export const deviceStatusHistory = async (params: {
  device_id: string
  page: number
  page_size: number
  start_time?: number
  end_time?: number
  status?: number
}) => {
  return await request.get<any>(`/device/status/history`, { params })
}

/** Get device diagnostic information */
export const deviceDiagnostics = async (deviceId: string) => {
  return await request.get<any>(`/devices/${deviceId}/diagnostics`)
}

export interface TopicMappingPayload {
  device_config_id: string
  name: string
  direction: 'up' | 'down'
  source_topic: string
  target_topic: string
  description?: string
  priority?: number
  enabled?: boolean
}

export const getTopicMappingList = async (params: {
  device_config_id: string
  page?: number
  page_size?: number
}) => {
  return await request.get<any>(`/device/topic-mappings`, { params })
}

export const createTopicMapping = async (data: TopicMappingPayload) => {
  return await request.post<any>(`/device/topic-mappings`, data)
}

export const updateTopicMapping = async (
  id: string | number,
  data: Partial<TopicMappingPayload>
) => {
  return await request.put<any>(`/device/topic-mappings/${id}`, data)
}

export const deleteTopicMapping = async (id: string | number) => {
  return await request.delete<any>(`/device/topic-mappings/${id}`)
}

/** Device debugging log switch status query */
export const getDeviceDebugStatus = async (deviceId: string) => {
  return await request.get<any>(`/device/${deviceId}/debug/status`)
}

/** Device debugging log switch */
export const setDeviceDebugStatus = async (deviceId: string, data: { enabled: boolean }) => {
  return await request.post<any>(`/device/${deviceId}/debug`, data)
}

/** Device debugging log query */
export const getDeviceDebugLogs = async (deviceId: string, params?: { limit?: number; offset?: number }) => {
  return await request.get<any>(`/device/${deviceId}/debug/logs`, { params })
}
