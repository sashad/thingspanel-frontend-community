/*
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-18 15:57:57
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-19 10:08:22
 */
import { request } from '../request'

/** Add new alarm */
export const addWarningMessage = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/alarm/config', params)
  return data
}
/** Configure alarm list */
export const warningMessageList = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/config', {
    params
  })
  return data
}
/** Alarm configuration editor:enable stop */
export const editInfo = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/config', params)
  return data
}

/** Alarm configuration editor:enable stop */
export const editInfoText = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/config', params)
  return data
}

/** Delete alarm configuration */
export const delInfo = async (id: string): Promise<any> => {
  const data = await request.delete<Api.BaseApi.Data>(`/alarm/config/${id}`)
  return data
}

/** Alarm information list */
export const infoList = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/info', {
    params
  })
  return data
}
/** Alarm history list */
export const alarmHistory = async (params: any): Promise<any> => {
  const data = await request.get<Api.UserManagement.Data | null>('/alarm/info/history', {
    params
  })
  return data
}

/** Alarm information processing */
export const processingOperation = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/info', params)
  return data
}
/** Alarm information batch processing */
export const batchProcessing = async (params: any): Promise<any> => {
  const data = await request.put<Api.BaseApi.Data>('/alarm/info/batch', params)
  return data
}
