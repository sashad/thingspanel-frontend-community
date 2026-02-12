import { request } from '../request'

/** Getkeyslist */
export const fetchKeyList = async (params: any) => {
  const data = await request.get<Api.UserManagement.KeyData | null>('/open/keys', {
    params
  })
  return data
}

/** Add tokey */
export const addKey = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/open/keys', params)
  return data
}

/** renewkey */
export const updateKey = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/open/keys', params)
  return data
}
/** deletekey */
export const apiKeyDel = async (params: any) => {
  return await request.delete<Api.BaseApi.Data | any>(`/open/keys/${params}`)
}
