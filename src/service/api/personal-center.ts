/*
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-18 09:47:03
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-18 11:34:34
 */
import { request } from '../request'

/** Obtain personal information */
export const fetchUserInfo = async () => {
  return await request.get<Api.BaseApi.Data | any>('/board/user/info', {})
}
/** Modify basic personal information */
export const changeInformation = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/board/user/update', params)
  return data
}
/** Change password */
export const passwordModification = async (params: any): Promise<any> => {
  const data = await request.post('/board/user/update/password', params)
  return data
}
/** Upload files */
export const uploadFile = async (params: any): Promise<any> => {
  const data = await request.post<Api.BaseApi.Data>('/file/up', params)
  return data
}
