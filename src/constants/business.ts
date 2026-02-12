import { transformObjectToOption, transformRecordToOption } from '@/utils/common4'
import { $t } from '@/locales'

export const enableStatusRecord: Record<Api.Common.EnableStatus, App.I18n.I18nKey> = {
  '1': 'page.manage.common.status.enable',
  '2': 'page.manage.common.status.disable'
}

export const enableStatusOptions = transformRecordToOption(enableStatusRecord)

export const userGenderRecord: Record<Api.SystemManage.UserGender, App.I18n.I18nKey> = {
  '1': 'page.manage.user.gender.male',
  '2': 'page.manage.user.gender.female'
}

export const userGenderOptions = transformRecordToOption(userGenderRecord)

export const menuTypeRecord: Record<Api.SystemManage.MenuType, App.I18n.I18nKey> = {
  '1': 'page.manage.menu.type.directory',
  '2': 'page.manage.menu.type.menu'
}

export const menuTypeOptions = transformRecordToOption<OptionTypes>(menuTypeRecord as any)

export const menuIconTypeRecord: Record<Api.SystemManage.IconType, App.I18n.I18nKey> = {
  '1': 'page.manage.menu.iconType.iconify',
  '2': 'page.manage.menu.iconType.local'
}

export const menuIconTypeOptions = transformRecordToOption(menuIconTypeRecord)

export const userRoleLabels: Record<Api.Auth.RoleType, string> = {
  SYS_ADMIN: $t('page.login.pwdLogin.superAdmin'),
  TENANT_ADMIN: $t('page.login.pwdLogin.admin'),
  TENANT_USER: $t('page.login.pwdLogin.user')
}

export const userRoleOptions = transformRecordToOption(userRoleLabels)

/** Route management - Component type */
export const routeComponentTypeLabels: Record<'basic' | 'blank' | 'multi' | 'self' | 'base' | 'custom', string> = {
  basic: 'basic',
  blank: 'blank',
  multi: 'multi',
  self: 'self',
  base: 'base',
  custom: ''
}

export const routeComponentTypeOptions = transformObjectToOption(routeComponentTypeLabels)

/** Route management - Route type */
export const routerTypeLabels: Record<CustomRoute.routerTypeKey, string> = {
  1: $t('card.menu'),
  // 2: 'Table of contents',
  3: $t('card.route')
  // 4: 'button',
  // 5: 'hide'
}
export const routeTypeOptions = transformObjectToOption(routerTypeLabels)
/** Route management - Access ID */
export const routerSysFlagLabels: Record<CustomRoute.routerSysFlagKey, string> = {
  SYS_ADMIN: $t('card.systemAdmin'),
  TENANT_ADMIN: $t('card.tenantAdmin')
}

export const routeSysFlagOptions = transformObjectToOption(routerSysFlagLabels)

/** Application management - Service management - Service management - Device type */
export const serviceManagementDeviceTypeLabels: Record<ServiceManagement.DeviceTypeKey, string> = {
  1: $t('generate.direct-connected-device'),
  2: $t('generate.gatewayDevice')
}

export const serviceManagementDeviceTypeOptions = transformObjectToOption(serviceManagementDeviceTypeLabels)

/** Application management - Service management - Service management - protocol type */
export const serviceManagementProtocolTypeLabels: Record<ServiceManagement.ProtocolTypeKey, string> = {
  1: 'MODBUS_RTU'
}
export const serviceManagementProtocolTypeOptions = transformObjectToOption(serviceManagementProtocolTypeLabels)

/** Rule engine status status */
export const ruleEngineStatusLabels: Record<RuleEngine.StatusKey, string> = {
  1: $t('card.started'),
  2: $t('card.paused')
}
export const ruleEngineStatusOptions = transformObjectToOption(ruleEngineStatusLabels)

/** Data services-Signature method */
export const dataServiceSignModeLabels: Record<DataService.SignModeKey, string> = {
  1: 'MD5',
  2: 'HAS256'
}

export const dataServiceSignModeOptions = transformObjectToOption(dataServiceSignModeLabels)

/** Data services-Interface support flag */
export const dataServiceFlagLabels: Record<DataService.FlagKey, string> = {
  1: $t('card.httpInterface'),
  2: $t('card.httpwsInterface')
}
export const dataServiceFlagOptions = transformObjectToOption(dataServiceFlagLabels)

/** Data services-state */
export const dataServiceStatusLabels: Record<DataService.StatusKey, string> = {
  1: $t('card.started'),
  2: $t('card.stopped')
}
export const dataServiceStatusOptions = transformObjectToOption(dataServiceStatusLabels)

/** User status */
export const userStatusLabels: Record<UserManagement.UserStatusKey, string> = {
  F: 'freeze',
  N: 'normal'
}
export const userStatusOptions = transformObjectToOption(userStatusLabels)

/** System management - General settings - Data cleaning Cleanup type */
export const dataClearSettingEnabledTypeLabels: Record<GeneralSetting.EnabledTypeKey, string> = {
  1: $t('page.manage.common.status.enable'),
  2: $t('page.manage.common.status.disable')
}
export const dataClearSettingEnabledTypeOptions = transformObjectToOption(dataClearSettingEnabledTypeLabels)

/** System management - General settings - Data cleaning Cleanup type */
export const dataClearSettingCleanupTypeLabels: Record<GeneralSetting.CleanupTypeKey, string> = {
  1: $t('card.deviceData'),
  2: $t('card.operationLog')
}

export const signModeOptions = [
  {
    label: 'MD5',
    value: 'MD5'
  },
  {
    label: 'HAS256',
    value: 'HAS256'
  }
]

export const packageOptions = [
  { label: $t('page.product.update-package.diff'), value: 1 },
  { label: $t('page.product.update-package.full'), value: 2 }
]

export const memberNotificationLabels: Record<CustomRoute.routerSysFlagKey, string> = {
  EMAIL: $t('card.emailNotice'),
  APP: $t('card.appNotice'),
  WECHAT: $t('card.wechatNotice')
}

export const MemberNotificationOptions = transformObjectToOption(memberNotificationLabels)

export const notificationOptions = [
  {
    label: $t('card.memberNotice'),
    value: 'MEMBER'
  },
  {
    label: $t('card.emailNotice'),
    value: 'EMAIL'
  },
  {
    label: 'webhook',
    value: 'WEBHOOK'
  }
]

/** irrigation plan-plan status */
export const irrigationPlanStatus: Record<DataService.FlagKey, string> = {
  ISS: $t('card.issued'),
  PND: $t('card.toBeIssued'),
  CNL: $t('card.cancelled')
}
export const irrigationPlanStatusOption = transformObjectToOption(irrigationPlanStatus)

/** irrigation plan-Control type */
export const irrigationControlType: Record<DataService.FlagKey, string> = {
  A: $t('page.irrigation.duration'),
  B: $t('card.capacity')
}
export const irrigationControlTypeOption = transformObjectToOption(irrigationControlType)

/** irrigation plan-control mode */
export const irrigationScheduleType: Record<DataService.FlagKey, string> = {
  A: $t('card.singleControl'),
  B: $t('card.loopControl')
}
export const irrigationScheduleTypeOption = transformObjectToOption(irrigationScheduleType)

export const enumDataType: Record<'Number' | 'String' | 'Boolean', string> = {
  Number: 'Number',
  String: 'String',
  Boolean: 'Boolean'
}

export const enumDataTypeOption = transformObjectToOption(enumDataType)
