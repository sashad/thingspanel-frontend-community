import { request } from '../request'
/** Get device list dropdown menu */
export const deviceListAll = async (params: any) => {
  return await request.get<any>('/device/tenant/list', { params })
}

/** Get device configuration drop-down menu */
export const deviceConfigAll = async (params: any) => {
  return await request.get<any>('/device_config/menu', { params })
}

/** Individual device condition selection drop-down menu */
export const deviceMetricsConditionMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/condition/menu`, { params })
}

/** Single type device condition selection drop-down menu */
export const configMetricsConditionMenu = async (params: any) => {
  return await request.get<any>(`/device_config/metrics/condition/menu`, { params })
}

/** Single device action selection drop-down menu */
export const deviceMetricsMenu = async (params: any) => {
  return await request.get<any>(`/device/metrics/menu`, { params })
}

/** Single type device action selection drop-down menu */
export const deviceConfigMetricsMenu = async (params: any) => {
  return await request.get<any>(`/device_config/metrics/menu`, { params })
}

/** Create a scene */
export const sceneAdd = async (params: any) => {
  return await request.post<any>(`/scene`, params)
}

/** Modify scene */
export const sceneEdit = async (params: any) => {
  return await request.put<any>(`/scene`, params)
}

/** Get scene list */
export const sceneGet = async (params: any) => {
  return await request.get<any>(`/scene`, { params })
}

/** delete scene */
export const sceneDel = async (id: any) => {
  return await request.delete<any>(`/scene/${id}`)
}

/** Get scene details */
export const sceneInfo = async (id: any) => {
  return await request.get<any>(`/scene/detail/${id}`)
}

/** Get scene log */
export const sceneLog = async (params: any) => {
  return await request.get<any>(`/scene/log`, { params })
}

/** Activate scene */
export const sceneActive = async (id: any) => {
  return await request.post<any>(`/scene/active/${id}`)
}

/** Create a scene */
export const sceneAutomationsAdd = async (params: any) => {
  return await request.post<any>(`/scene_automations`, params)
}

/** Modify scene */
export const sceneAutomationsEdit = async (params: any) => {
  return await request.put<any>(`/scene_automations`, params)
}

/** Get scene list */
export const sceneAutomationsGet = async (params: any) => {
  return await request.get<any>(`/scene_automations/list`, { params })
}

/** delete scene */
export const sceneAutomationsDel = async (id: any) => {
  return await request.delete<any>(`/scene_automations/${id}`)
}

/** Get scene details */
export const sceneAutomationsInfo = async (id: any) => {
  return await request.get<any>(`/scene_automations/detail/${id}`)
}

/** Get scene log */
export const sceneAutomationsLog = async (params: any) => {
  return await request.get<any>(`/scene_automations/log`, { params })
}

/** Activate scene */
export const sceneAutomationsSwitch = async (id: any) => {
  return await request.post<any>(`/scene_automations/switch/${id}`)
}
