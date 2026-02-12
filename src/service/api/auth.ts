import { request } from '../request'

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */

export function fetchLogin(email: string, password: string, salt: string | null) {
  return request.post<Api.Auth.LoginToken>('/login', { email, password, salt })
}

/** Get user info */
export function fetchGetUserInfo() {
  return request.get<Api.Auth.UserInfo>('/user/detail')
}

// Logout interface
export function logout() {
  return request.get('/user/logout')
}
/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */

export function fetchSmsCode(phone: string) {
  return request.post<string>('/getSmsCode', phone, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
  })
}

export function fetchEmailCode(email: string) {
  return request.get<{ email: string; is_register: number } | null>('/verification/code', {
    params: {
      email,
      is_register: 1
    }
  })
}
export function fetchEmailCodeByEmail(email: string) {
  return request.get<{ email: string; is_register: number } | null>('/verification/code', {
    params: {
      email,
      is_register: 2
    }
  })
}
/** Get user list */
export const fetchUserList = async (params: any) => {
  const data = await request.get<Api.UserManagement.Data | null>('/user', {
    params
  })
  return data
}

/** Add user */
export const addUser = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/user', params)
  return data
}

/** Edit user */
export const editUser = async (params: any) => {
  // delete params.password;
  const data = await request.put<Api.BaseApi.Data>('/user', params)
  return data
}

/** Delete user */
export const delUser = async (id: string) => {
  const data = await request.delete<Api.BaseApi.Data>(`/user/${id}`)
  return data
}

/** Switch user */
export const transformUser = async (params: any) => {
  const data = await request.post<Api.Auth.LoginToken>(`/user/transform`, params)
  return data
}
/** Change password */
export const editUserPassWord = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>(`/reset/password`, params)
  return data
}

export const fetchHomeData = async (params: any) => {
  const data = await request.get<{ config: string } | null>('/board/home', {
    params
  })
  return data
}

export function registerByEmail(data: {
  email: string // Mail
  verify_code: string // Email verification code
  password: string // User password
  phone_prefix: string // Mobile phone prefix
  phone_number: string // phone number
}) {
  return request.post('/tenant/email/register', data, {
    headers: {
      'Content-Type': 'application/json' // Set the request body type to application/json
    }
  })
}
