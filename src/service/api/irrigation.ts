import type { AxiosInstance } from 'axios'
import { request } from '../request'

export default class Irrigation {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  getData(name: string) {
    this.http.get('')
    return name
  }
}

/** Get list of spaces */
export const getIrrigationSpaces = async () => {
  return await request.get<any>('irrigation/spaces')
}

/** Get list of regions */
export const getIrrigationDistricts = async (params: any) => {
  return await request.get<any>('irrigation/districts', { params })
}

/** Get device list */
export const getIrrigationDiveces = async (params: { id: string }) => {
  return await request.get<any>(`irrigation/districts/device/${params.id}`)
}

/** Create a new schedule */
export const addTimeIrrigation = async (params: any) => {
  return await request.post<any>(`irrigation/scheduled`, params)
}

/** Create a new schedule */
export const editTimeIrrigation = async (params: any) => {
  return await request.put<any>(`irrigation/scheduled`, params)
}

/** Get device list */
export const getIrrigationTimeList = async (params: any) => {
  return await request.get<any>(`irrigation/scheduled`, { params })
}

/** Scheduled irrigation-Issue */
export const irrigationTimeDistribute = async (id: string, params: { status: 2 | 3 }) => {
  return await request.get<any>(`/irrigation/scheduled/execute/${id}`, { params })
}
/** Scheduled irrigation-Cancel */
export const irrigationTimeCancle = async (params: { id: string; status: 2 | 3 }) => {
  return await request.put<any>(`/irrigation/scheduled/cancel/${params.id}`, { params })
}

/** Scheduled irrigation-delete */
export const irrigationTimeDel = async (id: string) => {
  return await request.delete<any>(`/irrigation/scheduled/${id}`)
}

/** Scheduled irrigation-log */
export const irrigationTimeHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/scheduled/historys`, { params })
}

/** rotational irrigation program */
/** Round irrigation-Device list */
export const irrigationRotationDeviceList = async () => {
  return await request.get<any>(`/irrigation/districts/device/get`, { params: { page: 1, page_size: 100 } } as any)
}

/** Round irrigation-Add plan */
export const addIrrigationRotation = async (params: any) => {
  return await request.post<any>(`/irrigation/rotation`, params)
}
/** Round irrigation-Edit plan */
export const editIrrigationRotation = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation`, params)
}

/** Round irrigation-Plan list */
export const irrigationRotationList = async (params: any) => {
  return await request.get<any>(`/irrigation/rotation`, { params })
}

/** Round irrigation-Plan issuance */
export const irrigationRotationExecute = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation/execute/${params.id}`, { status: params.stauts })
}

/** Round irrigation-Plan canceled */
export const irrigationRotationCancel = async (params: any) => {
  return await request.put<any>(`/irrigation/rotation/cancel/${params.id}`)
}

/** Round irrigation-Scheduled deletion */
export const irrigationRotationDel = async (params: any) => {
  return await request.delete<any>(`/irrigation/rotation/${params}`)
}

/** Round irrigation-log */
export const irrigationRotationHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/rotation/historys`, { params })
}

/** Round irrigation-log */
export const irrigationRotationHistorysDetail = async (params: any) => {
  return await request.get<any>(`irrigation/rotation/result/${params.id}`, { params })
}

/** Round irrigation-Details */
export const irrigationRotationDetail = async (id: any) => {
  return await request.get<any>(`/irrigation/rotation/${id}`)
}

/** Group irrigation-Add to */
export const addIrrigationGroup = async (params: any) => {
  return await request.post<any>(`/irrigation/group`, params)
}

/** Group irrigation-Plan list */
export const getIrrigationGroupList = async (params: any) => {
  return await request.get<any>(`/irrigation/group`, { params })
}

/** Group irrigation-Device list */
export const irrigationGroupDeviceList = async (params: any) => {
  return await request.get<any>(`/irrigation/districts/device/get`, { params })
}

/** Group irrigation-List details */
export const irrigationGroupDeviceDetail = async (id: any) => {
  return await request.get<any>(`/irrigation/group/${id}`)
}

/** Group irrigation-Device type */
export const irrigationGroupDeviceTypes = async () => {
  return await request.get<any>('/dict/enum', { params: { dict_code: 'PRODUCT_TYPE' } })
}

/** Group irrigation-Issue */
export const irrigationGroupExcute = async (id: string) => {
  return await request.get<any>(`irrigation/group/execute/${id}`, { params: { status: 3 } })
}

/** Group irrigation-Cancel delivery */
export const irrigationGroupCancle = async (id: string) => {
  return await request.put<any>(`/irrigation/group/cancel/${id}`, { id, status: 3 })
}

/** Group irrigation-delete */
export const irrigationGroupDel = async (id: string) => {
  return await request.delete<any>(`/irrigation/group/${id}`)
}

/** Group irrigation-log */
export const irrigationGroupHistorys = async (params: any) => {
  return await request.get<any>(`/irrigation/group/historys`, { params })
}

/** Group irrigation-Log details */
export const irrigationGroupHistoryDetail = async (params: any) => {
  return await request.get<any>(`/irrigation/group/result`, { params })
}
