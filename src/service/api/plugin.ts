import { request } from '../request'

// Get service list data
export const getServices = async (params: any) => {
  return await request.get<Panel.Data>('/service/list', { params })
}

// Registration service
export const registerService = async (params: any) => {
  return await request.post<Panel.Data>('/service', params)
}

// Update service
export const putRegisterService = async (params: any) => {
  return await request.put<Panel.Data>('/service', params)
}

// Delete service
export const delRegisterService = async (id: any) => {
  return await request.delete<Panel.Data>(`/service/${id}`)
}

// Get the tenant's third-party access point list
export const getServiceAccess = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/list', { params })
}

// Obtain tenant third-party access point form
export const getServiceAccessForm = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/voucher/form', {
    params
  })
}

// Delete a tenant's third-party access point
export const delServiceAccess = async (id: any) => {
  return await request.delete<Panel.Data>(`/service/access/${id}`)
}

// Create a three-party access point
export const createServiceDrop = async (params: any) => {
  return await request.post<Panel.Data>('/service/access', params)
}

// Update third-party access points
export const putServiceDrop = async (params: any) => {
  return await request.put<Panel.Data>('/service/access', params)
}

// Third-party service equipment list query
export const getServiceListDrop = async (params: any) => {
  return await request.get<Panel.Data>('/service/access/device/list', {
    params
  })
}

// Device configuration drop-down menu✅
export const getSelectServiceMenuList = async (params: any) => {
  return await request.get<Panel.Data>('/device_config/menu', {
    params
  })
}

// Add services in batches
export const batchAddServiceMenuList = async (params: any) => {
  return await request.post<Panel.Data>('/device/service/access/batch', params)
}

// // Modify third-party access point
// export const putServiceMenuDrop = async (params: any) => {
//   return await request.put<Panel.Data>("/service/access", params);
// };
