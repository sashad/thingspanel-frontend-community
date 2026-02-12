import { request } from '../request'

/** Get general settings - Theme settings */
export const fetchThemeSetting = async () => {
  const data = await request.get<Api.GeneralSetting.Theme | null>('/logo')
  return data
}

/** Get general settings - Theme editor */
export const editThemeSetting = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/logo', params)
  return data
}

/** Get general settings - Data cleaning settings list */
export const fetchDataClearList = async (params: any) => {
  const data = await request.get<Api.GeneralSetting.DataClear | null>('/datapolicy', {
    params
  })
  return data
}

/** Edit cleaning settings */
export const editDataClear = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/datapolicy', params)
  return data
}

/** Edit cleaning settings */
export const dictQuery = async (params: any) => {
  return await request.get<Api.BaseApi.Data | any>('dict/enum', { params })
}
/** Edit cleaning settings */
export const getFunction = async () => {
  return await request.get<Api.BaseApi.Data | any>('/sys_function')
}
/** Edit cleaning settings */
export const editFunction = async (param: { function_id: string }) => {
  return await request.put<Api.BaseApi.Data | any>(`/sys_function/${param.function_id}`)
}
