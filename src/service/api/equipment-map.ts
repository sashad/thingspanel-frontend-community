/*
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-23 09:35:32
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-04-08 11:31:40
 */
import { request } from '../request'

/** Get list of spaces */
export const spacesList = async (params: any): Promise<any> => {
  return await request.get<Api.BaseApi.Data>('http://47.251.45.205:9999/api/v1/irrigation/spaces', { params })
}

/** Get list of regions */
export const areasList = async (params: any): Promise<any> => {
  return await request.get<Api.BaseApi.Data>('http://47.251.45.205:9999/api/v1/irrigation/districts', { params })
}

/** Get area details */
export const areaDetail = async (id: any): Promise<any> => {
  return await request.get<Api.BaseApi.Data>(`http://47.251.45.205:9999/api/v1/irrigation/districts/${id}`)
}
/** Get space details */
export const apaceDetail = async (id: any): Promise<any> => {
  return await request.get<Api.BaseApi.Data>(`http://47.251.45.205:9999/api/v1/irrigation/spaces/${id}`)
}
/** Get area details */
export const areaData = async (id: any): Promise<any> => {
  return await request.get<Api.BaseApi.Data>(`http://47.251.45.205:9999/api/v1/irrigation/districts/${id}`)
}
/** Modify space */
// export const editSpaces = async (id: any) => {
//   const data = await request.put<any>(
//     `http://47.251.45.205:9999/api/v1/irrigation/spaces/${id}`,
//   );
//   return data;
// };
export const editSpaces = async (params: any) => {
  return await request.put<Api.BaseApi.Data>(`http://47.251.45.205:9999/api/v1/irrigation/spaces/${params.id}`, params)
}
/** add space */
export const addSpace = async (data: any): Promise<any> => {
  return await request.post<Api.BaseApi.Data>('http://47.251.45.205:9999/api/v1/irrigation/spaces', data)
}

// Add area
export const addArea = async (data: any): Promise<any> => {
  return await request.post<Api.BaseApi.Data>('http://47.251.45.205:9999/api/v1/irrigation/districts', data)
}

/** delete area */
export const deleteArea = async (id: any): Promise<any> => {
  return await request.delete<Api.BaseApi.Data>(`http://47.251.45.205:9999/api/v1/irrigation/districts/${id}`)
}

/** Device map-Spatial area list filter */

export const spacesData = async (params: any): Promise<any> => {
  return await request.get('http://47.251.45.205:9999/api/v1/irrigation/devices/spaces', { params })
}

/** Device map-Total number of devices */

export const sumData = async (params: any): Promise<any> => {
  return await request.get('http://47.251.45.205:9999/api/v1/board/tenant/device/info', { params })
}

/** Modify area */
// export const editArea = async (id: any) => {
//   const data = await request.put<any>(
//     `http://47.251.45.205:9999/api/v1/irrigation/districts/${id}`,
//   );
//   return data;
// };
/** Modify area */

export const editArea = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>(
    `http://47.251.45.205:9999/api/v1/irrigation/districts/${params.spaces_id}`
  )
  return data
}
