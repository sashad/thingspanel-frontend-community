/** Custom route type Used for permission management module */
declare namespace CustomRoute {
  interface Route extends Api.Route.MenuRoute {}

  /**
   * Cleanup type
   *
   * - 1: menu
   * - 2: Table of contents
   * - 3: routing
   * - 4: button
   */
  type routerTypeKey = NonNullable<Route['element_type']>

  /**
   * type
   *
   * - SYS_ADMIN: system administrator
   * - TENANT_USER: Tenant user
   * - TENANT_ADMIN: Tenant Administrator
   */
  type routerSysFlagKey = string
}
/** Application management-Service management module */
declare namespace ServiceManagement {
  interface Service extends Api.ApiApplyManagement.Service {}
  /** Device type */
  type DeviceTypeKey = NonNullable<Service['device_type']>
  /** protocol type */
  type ProtocolTypeKey = NonNullable<Service['protocol_type']>
}

/** Rule engine module */
declare namespace RuleEngine {
  interface Rule extends Api.RuleEngine.Rule {
    /** serial number */
    index: number
  }

  /**
   * Rule engine status
   *
   * - 1: Enabled
   * - 2: Suspended
   */
  type StatusKey = NonNullable<Rule['status']>
}

/** Data service module */
declare namespace DataService {
  interface Data extends Api.DataService.Data {
    /** serial number */
    index: number
    /** SQL */
    SQL: string | null
    /** SQLwriting aid */
    SQLWritingAid: string | null
  }

  /**
   * Signature method
   *
   * - 1: MD5
   * - 2: HAS256
   */
  type SignModeKey = NonNullable<Data['signMode']>

  /**
   * Interface support flag
   *
   * - 1: httpinterface
   * - 2: httpandwsinterface
   */
  type FlagKey = NonNullable<Data['flag']>

  /**
   * Rule engine status
   *
   * - 1: Enabled
   * - 2: Stopped
   */
  type StatusKey = NonNullable<Data['status']>
}

/** General settings */
declare namespace GeneralSetting {
  interface ThemeSetting extends Api.GeneralSetting.ThemeSetting {}
  interface DataClearSetting extends Api.GeneralSetting.DataClearSetting {}

  /**
   * Cleanup type
   *
   * - 1: Operation log
   * - 2: Device data
   */
  type CleanupTypeKey = NonNullable<DataClearSetting['data_type']>
  /**
   * Whether to enable
   *
   * - 1: enable
   * - 2: deactivate
   */
  type EnabledTypeKey = NonNullable<DataClearSetting['enabled']>
}

declare namespace NotificationServices {
  interface Email extends Api.NotificationServices.Email {}
  interface PushNotification extends Api.NotificationServices.PushNotification {}

  /**
   * turn on/closure Serve
   *
   * - OPEN-turn on
   * - CLOSE-closure
   */
  type StatusKey = NonNullable<Email['status']>
}

declare namespace UserManagement {
  interface User extends Api.UserManagement.User {}

  interface UserKey extends Api.UserManagement.UserKey {}

  /**
   * User gender
   *
   * - 0: female
   * - 1: male
   */
  type GenderKey = NonNullable<User['gender']>

  /**
   * User status
   *
   * - N: normal
   * - F: freeze
   */
  type UserStatusKey = NonNullable<User['status']>
}

// Device information
declare namespace AddDeviceModel {
  interface Device extends Api.device.addDeviceModel {}
}
