import { request } from '../request'

/** Get the role management paginated list */
export const rlesList = async (params: any) => {
  const data = await request.get<Api.UserManagement.Data | null>('role', {
    params
  })
  return data
}

/** Update role management */
export const addrles = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/role', params)
  return data
}

/** Create role management */
export const editrles = async (params: any) => {
  const data = await request.put<Api.BaseApi.Data>('/role', params)
  return data
}

/** Delete role management */
export const delrles = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/role/${id}`)
  return data
}

/** Get role permissions */
export const getRolePermissions = async (id: string): Promise<string[]> => {
  const response = await request.get<any>(`/casbin/function?role_id=${id}`)
  return response?.data || []
}

/** Add role permissions */
export const addRolePermissions = async (id: string, functions_ids: Array<string>) => {
  const data = await request.post<Api.BaseApi.Data>(`/casbin/function`, {
    role_id: id,
    functions_ids
  })
  return data
}

/** Modify role permissions */
export const modifyRolePermissions = async (id: string, functions_ids: Array<string>) => {
  const data = await request.put<Api.BaseApi.Data>(`/casbin/function`, {
    role_id: id,
    functions_ids
  })
  return data
}

/** Delete role permissions */
export const delRolePermissions = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/casbin/function/${id}`)
  return data
}
