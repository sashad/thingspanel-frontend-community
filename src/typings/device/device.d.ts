declare namespace DeviceManagement {
  interface Group {
    id: string
    parent_id: string
    tier: number
    name: string
    description: string | null
    created_at: string
    updated_at: string
    remark: string | null
    tenant_id: string
  }

  interface TreeNode {
    group: Group
    children?: TreeNode[] // TreeNodeoptional array of types，Used to describe child nodes
  }

  // Used to describe the entire tree structure including the root node and possible child nodes
  type TreeStructure = TreeNode[]

  interface DetailData {
    detail: {
      created_at: string
      description: string
      id: string
      name: string
      parent_id: string
      remark: string
      tenant_id: string
      tier: number
      updated_at: string
    }
    tier: {
      group_path: string
    }
  }

  interface GroupDeviceData {
    any
  }

  interface DeviceData {
    id: string
    activate_flag: string
    current_version: string
    device_config_id: string
    device_number: string
    device_type: number
    group_id: string
    is_enabled: string
    label: string
    name: string
    product_id: string
    protocol: string
  }

  interface DeviceDatas {
    list: DeviceData[]
    total: number
  }

  interface DeviceDetail {
    id: string
    name: string
    voucher: string // certificate
    tenant_id: string
    is_enabled: string // enable/Disable enabled-enable disabled-Disable 默认Disable，激活后默认enable
    activate_flag: string // activation flag inactive-Not activated active-Activated
    created_at: string
    update_at: string
    device_number: string // Device number
    product_id: string // productid
    parent_id: string // gatewayid
    label: string // Label 单Label，separated by commas
    location: string // geographical location
    sub_device_addr: string // Sub-device address
    current_version: string // Firmware version
    additional_info: string // Attachment information jsonstring
    protocol_config: string // Protocol plug-in device configuration Device configuration related to protocol plug-in
    device_config_name: string
    remark1: string
    remark2: string
    remark3: string
    device_config_id: string // Device configurationid
    batch_number: string // Batch number
    activate_at: string // activation time
    is_online: number // Is online
  }

  interface telemetryData {
    device_id: string
    key: string
    tenant_id: string
    ts: string
    value: number
    unit: string
    label: string
    name: string
  }

  interface telemetryCurrent {
    data: telemetryData[]
  }

  interface ConfigData {
    id: string
    name: string
    device_template_id: string
    device_type: string
    protocol_type: string
    voucher_type: string
    protocol_config: string
    device_conn_type: string
    additional_info: string
    description: string
    tenant_id: string
    created_at: string
    updated_at: string
    remark: null
    device_count: number
  }

  interface ConfigDatas {
    list: ConfigData[]
    total: number
  }

  interface ProtocolAndServiceData {
    name: string
    service_identifier: string
  }

  interface ProtocolAndService {
    protocal: ProtocolAndServiceData[]
    service: ProtocolAndServiceData[]
  }

  interface ServiceData {
    id: string
    name: string
    service_plugin_id: string
    voucher: string
    description: string
    service_access_config: string
    remark: string
    create_at: string
    update_at: string
    tenant_id: string
  }

  interface ServiceList {
    list: ServiceData[]
    total: number
  }
}
