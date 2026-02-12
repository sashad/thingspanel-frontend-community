import { request } from '../request'

/** Get list of protocol plugins */
export const fetchProtocolPluginList = async (params: any) => {
  const data = await request.get<Api.ApiApplyManagement.Data | null>('/protocol_plugin', {
    params
  })
  return data
}

/** Create protocol plug-in */
export const addProtocolPlugin = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/protocol_plugin', params)
  return data
}

/** Edit protocol plugin */
export const editProtocolPlugin = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/protocol_plugin', params)
  return data
}

/** Remove protocol plugin */
export const delProtocolPlugin = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/protocol_plugin/${id}`)
  return data
}
