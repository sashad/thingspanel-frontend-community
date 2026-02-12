import { request } from '../request'

/** Notification service configuration */
export const fetchNotificationServicesEmail = async () => {
  const data = await request.get<Api.NotificationServices.Email | null>(`/notification/services/config/EMAIL`)
  return data
}

/** Modify notification service configuration */
export const editNotificationServices = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/notification/services/config', params)
  return data
}

/** Send test email */
export const sendTestEmail = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>('/notification/services/config/e-mail/test', params)
  return data
}

/** Push service configuration */
export const fetchPushNotificationServices = async () => {
  const data = await request.get<Api.NotificationServices.PushNotification>(`/message_push/config `)
  return data
}

/** Modify push service configuration */
export const editPushNotificationServices = async (params: any) => {
  const data = await request.post<Api.BaseApi.Data>(`/message_push/config `, params)
  return data
}
