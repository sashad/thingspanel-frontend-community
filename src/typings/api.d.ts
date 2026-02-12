/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace BaseApi {
    /** Route data type returned by the backend */
    interface Data {
      name: string
      code: number
      message: string
    }
  }
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number
      /** page size */
      size: number
      /** total count */
      total: number
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T extends NonNullable<unknown>> extends PaginatingCommonParams {
      records: T[]
    }

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = '1' | '2'

    /** common record */
    type CommonRecord<T extends NonNullable<unknown>> = {
      /** record id */
      id: number
      /** record creator */
      createBy: string
      /** record create time */
      createTime: string
      /** record updater */
      updateBy: string
      /** record update time */
      updateTime: string
      /** record status */
      status: EnableStatus | null
    } & T
  }
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    /**
     * User role type(Front-end static routing uses role types to control routing permissions)
     *
     * - SYS_ADMIN: system administrator(This permission has all routing data)
     * - TENANT_ADMIN: Tenant Administrator
     * - TENANT_USER: user
     */
    type RoleType = 'SYS_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER'

    interface LoginToken {
      token: string
      refreshToken: string
      expires_in: number
    }

    /** User information */
    interface UserInfo {
      /** userid */
      id?: string
      userId?: string
      /** username */
      userName: string
      /** User role type */
      roles?: string[]
      authority: string

      [key: string]: any
    }
  }
  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute

    interface MenuRoute extends ElegantConstRoute {
      id: string
      /** parent nodeID */
      parent_id: string
      /** title */
      title: string
      /** internationalization */
      multilingual: App.I18n.I18nKey
      /** icon */
      param2: string
      /** Component name */
      element_code: string
      /** component path */
      param1: string
      /** Whether to hide 0 1 */
      param3: string
      /** sort */
      orders: number
      /** type */
      // element_type: 1 | 2 | 3 | 4 | 5;
      element_type: 1 | 3
      /** Access ID */
      authority: any
      /** describe */
      description: string
      /** describe */
      remark: string
      /** Component address */
      route_path: string
      /** child node */
      children: MenuRoute[]
    }

    interface Data {
      list: MenuRoute[]
      total: number
    }

    interface UserRoute {
      list: ElegantConstRoute[]
      home: import('@elegant-router/types').LastLevelRouteKey
    }
  }
  /**
   * namespace SystemManage
   *
   * backend api module: "systemManage"
   */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>

    /** role */
    type Role = Common.CommonRecord<{
      /** role name */
      roleName: string
      /** role code */
      roleCode: string
      /** role description */
      roleDesc: string
    }>

    /** role search params */
    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'status'> & CommonSearchParams
    >

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>

    /** all role */
    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = '1' | '2'

    /** user */
    type User = Common.CommonRecord<{
      /** user name */
      userName: string
      /** user gender */
      userGender: UserGender | null
      /** user nickname */
      nickName: string
      /** user phone */
      userPhone: string
      /** user email */
      userEmail: string
      /** user role code collection */
      userRoles: string[]
    }>

    /** user search params */
    type UserSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.User, 'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'status'> &
        CommonSearchParams
    >

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = '1' | '2'

    type MenuButton = {
      /**
       * button code
       *
       * it can be used to control the button permission
       */
      code: string
      /** button description */
      desc: string
    }

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = '1' | '2'

    type Menu = Common.CommonRecord<{
      /** parent menu id */
      parentId: number
      /** menu type */
      menuType: MenuType
      /** menu name */
      menuName: string
      /** route name */
      routeName: string
      /** route path */
      routePath: string
      /** component */
      component?: string
      /**
       * i18n key
       *
       * it is for internationalization
       */
      i18nKey?: App.I18n.I18nKey
      /** iconify icon name or local icon name */
      icon: string
      /** icon type */
      iconType: IconType
      /** menu order */
      order: number
      /** whether to cache the route */
      keepAlive?: boolean
      /** outer link */
      href?: string
      /** whether to hide the route in the menu */
      hideInMenu?: boolean
      /**
       * The menu key will be activated when entering the route
       *
       * The route is not in the menu
       *
       * @example
       *   the route is "user_detail", if it is set to "user_list", the menu "user_list" will be activated
       */
      activeMenu?: import('@elegant-router/types').LastLevelRouteKey
      /** By default, the same route path will use one tab, if set to true, it will use multiple tabs */
      multiTab?: boolean
      /** If set, the route will be fixed in tabs, and the value is the order of fixed tabs */
      fixedIndexInTab?: number
      /** menu buttons */
      buttons?: MenuButton[]
      /** children menu */
      children?: Menu[]
    }>

    type SystemLogSearchParams = {
      page: number
      page_size: number
      username?: string | null
      start_time?: string | null
      end_time?: string | null
    }

    type SystemLogList = {
      id?: string
      ip?: string
      path?: string
      user_id?: string
      name?: null | string
      created_at?: Date
      latency?: number
      request_message?: string
      response_message?: string
      tenant_id?: string
      remark?: null
    }
  }
  /** System settings-Route management */
  namespace ApiApplyManagement {
    interface Service {
      /** id */
      id: string
      /** Service name */
      name: string | null
      /** Device type */
      device_type: string | number
      /** protocol type */
      protocol_type: string
      /** introduce */
      description: string | null
      /** HTTPService address */
      http_address: string | null
      /** Access address */
      access_address: string | null
      /** Plugin subscription topic prefix */
      sub_topic_prefix: string | null
      /** link parameters */
      additional_info: string
      ts: string
      language_code: string
    }

    interface Data {
      list: Service[]
      total: number
    }
  }
  /** General settings */
  namespace GeneralSetting {
    /** Theme settings */
    interface ThemeSetting {
      /** id */
      id: string
      /** system title */
      system_name: string | null
      /** Home page and backend logo */
      logo_background: string | undefined
      /** Load page logo */
      logo_loading: string | undefined
      /** Site logo logo */
      logo_cache: string | undefined
      /** background image */
      home_background: string | undefined
    }

    /** Data cleaning settings */
    interface DataClearSetting {
      /** id */
      id: string
      /** Cleanup type */
      data_type: string
      /** Whether to enable */
      enabled: string
      /** retention days */
      retention_days: number
      /** Last clean time */
      last_cleanup_time: string | null
      /** Last data cleaning time node */
      last_cleanup_data_time: string | null
      /** Remark */
      remark: string | null
    }

    interface DataClear {
      list: DataClearSetting[]
      total: number
    }

    interface Theme {
      list: ThemeSetting[]
      total: number
    }
  }
  namespace NotificationServices {
    interface Email {
      id: string
      config: string
      email_config: any
      notice_type: string
      remark: string
      status: string
    }
    interface PushNotification {
      url: string
    }
  }
  namespace UserManagement {
    interface User {
      /** userid */
      id: string
      /** User email */
      email: string | null
      /** username */
      name: string | null
      description: string | null
      /** User mobile phone number */
      phone_number: string
      /**
       * User status
       *
       * - N: normal
       * - F: freeze
       */
      status: 'F' | 'N' | null
      /**
       * User gender
       *
       * - 0: female
       * - 1: male
       */
      gender: '0' | '1' | null

      /** Remark */
      remark: string | null
      /** creation time */
      created_at: string | null
      /** Update time */
      updated_at: string | null
      /** last access time */
      lastVisitTime: string | null
    }
    interface UserKey {
      /** userid */
      id: string
      /** username */
      name: string | null
      /** key */
      api_key: string | null
      /**
       * User status
       *
       * - N: normal
       * - F: freeze
       */
      status: 0 | 1 | null
      /** creation time */
      created_at: string | null
      /** Update time */
      updated_at: string | null
      /** Whether to display in clear text */
      show: boolean | false
      /** tenantid */
      tenant_id: string | null
    }

    interface Data {
      list: User[]
      total: number
    }
    interface KeyData {
      list: UserKey[]
      total: number
    }
  }
  /** rules engine */
  namespace RuleEngine {
    interface Rule {
      /** id */
      id: string
      /** Rule name */
      name: string | null
      /**
       * Rule status
       *
       * - 1: Started
       * - 2: Suspended
       */
      status: '1' | '2' | null
    }
  }
  namespace DataService {
    interface Data {
      /** id */
      id: string
      /** Rule name */
      name: string | null
      /** app_key */
      appKey: string | null
      /** Signature method */
      signMode: string | null
      /** IPwhitelist */
      ip: string | null
      /** Interface support flag */
      flag: string | null
      /** Push data interval */
      dataInterval: string | null
      /** describe */
      desc: string | null
      /** creation time */
      createTime: string | null
      /**
       * Rule status
       *
       * - 1: Started
       * - 2: Stopped
       */
      status: '1' | '2' | null
    }
  }
  namespace ApplyManagement {
    interface Service {
      /** id */
      id: string
      /** Service name */
      name: string | null
      /** Service Category */
      serviceType: string | null
      /** introduce */
      desc: string | null
      /** author */
      author: string | null
      /** Version */
      version: string | null
      /**
       * Rule status
       *
       * - 1: Started
       * - 2: Stopped
       */
      status: '1' | '2' | null
    }
  }

  /** Device management */
  namespace device {
    interface addDeviceModel {
      additional_info: string
      created_at: string
      data_identifier: string
      data_name: string
      data_type: string
      description: string
      device_template_id: string
      id: string
      read_write_flag: string
      remark: string
      tenant_id: string
      unit: string
      updated_at: string

      [property: string]: any
    }
  }

  /** Alarm */
  namespace Alarm {
    interface NotificationGroupParams {
      name?: string
      notification_type?: string
      page: number
      page_size: number
      status?: string
      tenant_id?: string
    }

    interface AddNotificationGroupParams {
      name: string
      description?: string
      notification_config?: string
      notification_type: string
      remark?: string
      status: string
      tenant_id?: string
    }

    interface NotificationGroupList {
      created_at: Date
      description: string
      id: string
      name: string
      notification_config: string
      notification_type: string
      remark: string
      status: string
      tenant_id: string
      updated_at: Date
    }

    interface NotificationHistoryParams {
      page: number
      page_size: number
      notification_type: string
      send_target?: string
      send_time_start?: string
      send_time_stop?: string
    }

    interface NotificationHistoryList {
      page: number
      page_size: number
      notification_type: string
      send_target?: string
      send_time_start?: string
      send_time_stop?: string
    }
  }
  /** irrigation plan */
  namespace Irrigation {
    interface AddTimeIrrigation {
      name: string | null
      space_id: string | null
      district_id: string | null
      device_id: string | null
      irrigation_time: string | null
      schedule: string | null
      control_type: string | null
      irrigation_duration: number | null
      valve_opening: number | null
      status?: string | null
      remark: string | null
      [key: string]: any
    }
  }

  /**
   * namespace Device
   *
   * backend api module: "device"
   */
  namespace Device {
    // Define the type of device selector item
    interface DeviceSelectItem {
      device_id: string
      device_name: string
      device_type: string
    }

    // Defines the type of device selector request parameter
    interface DeviceSelectorParams {
      page?: string // Note that the document type is string
      page_size?: string // Note that the document type is string
      has_device_config?: boolean
      search?: string // Search keywords
    }

    // ... (Here you can add other device Related types)
  }
}
