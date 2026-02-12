/**
 * Internal address data generator
 * Based on realityAPIInternal address options data maintained by the interface
 */

import type { InternalAddressOptions, InternalApiItem } from '@/core/data-architecture/types/internal-api'

/**
 * telemetry data moduleAPIinterface
 */
const telemetryApis: InternalApiItem[] = [
  {
    label: 'Device telemetry current value query',
    value: '/telemetry/datas/current/{id}',
    url: '/telemetry/datas/current/{id}',
    method: 'GET',
    description: 'Equipment current value query，Get each devicekeyThe latest data of',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      { name: 'id', type: 'string', required: true, description: 'equipmentID（path parameters）', example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137' }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataCurrent'
  },
  {
    label: 'according tokeyQuery the current value of the indicator',
    value: '/telemetry/datas/current/keys',
    url: '/telemetry/datas/current/keys',
    method: 'GET',
    description: 'Equipment current value query，Get each devicekeyThe latest data of',
    hasPathParams: false,
    commonParams: [
      {
        name: 'device_id',
        type: 'string',
        required: true,
        description: 'equipmentID',
        example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137'
      },
      { name: 'keys', type: 'object', required: true, description: 'indexkeyarray', example: ['temperature', 'humidity'] }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataCurrentKeys'
  },
  {
    label: 'Indicator historical value query',
    value: '/telemetry/datas/history/pagination',
    url: '/telemetry/datas/history/pagination',
    method: 'GET',
    description: 'Equipment historical value query，Time limit is one month at most。Support all returns without pagination，This interface does not return the total number of messages，Can only operate on the previous page and next page',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: 'equipmentID', example: '5fd9b168-9e2a-d91c-a7c3-9c1f4d4b5137' },
      { name: 'key', type: 'string', required: true, description: 'indexkey', example: 'temperature' },
      { name: 'start_time', type: 'number', required: true, description: 'start time（millisecond timestamp）', example: 1742780418369 },
      { name: 'end_time', type: 'number', required: true, description: 'end time（millisecond timestamp）', example: 1711656000000 },
      { name: 'page', type: 'string', required: false, description: 'page number', example: '1' },
      { name: 'page_size', type: 'string', required: false, description: 'Quantity per page', example: '100' },
      { name: 'export_excel', type: 'string', required: false, description: 'Export toexcellogo(true/false)', example: 'false' }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataHistoryPagination'
  },
  {
    label: 'Telemetry aggregated data query',
    value: '/telemetry/datas/statistic',
    url: '/telemetry/datas/statistic',
    method: 'GET',
    description: 'Query aggregate statistics for telemetry data，Supports multiple time ranges and aggregation methods',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: 'equipmentID', example: 'f3625aae-1283-1afc-259e-f43a58ba7070' },
      { name: 'key', type: 'string', required: true, description: 'indexkey', example: 'temperature' },
      {
        name: 'time_range',
        type: 'string',
        required: true,
        description: 'time range (TODO: Later use the form to implement the selector)',
        example: 'last_1h'
        // Optional value: custom, last_5m, last_15m, last_30m, last_1h, last_3h, last_6h, last_12h, last_24h, last_3d, last_7d, last_15d, last_30d, last_60d, last_90d, last_6m, last_1y
      },
      {
        name: 'aggregate_window',
        type: 'string',
        required: true,
        description: 'aggregation interval (TODO: Later, use the form to implement thetime_rangelinkage logic)',
        example: 'no_aggregate'
        // Optional value: no_aggregate, 30s, 1m, 2m, 5m, 10m, 30m, 1h, 3h, 6h, 1d, 7d, 1mo
      },
      {
        name: 'aggregate_function',
        type: 'string',
        required: false,
        description: 'aggregation method (TODO: whenaggregate_windowNot forno_aggregateRequired when)',
        example: 'avg'
        // Optional value: avg(average), max(maximum value), min(minimum value), sum(Sum), diff(The difference between the maximum and minimum)
      },
      {
        name: 'start_time',
        type: 'number',
        required: false,
        description: 'start time（millisecond timestamp，time_rangeforcustomRequired when）',
        example: 1711864177268
      },
      {
        name: 'end_time',
        type: 'number',
        required: false,
        description: 'end time（millisecond timestamp，time_rangeforcustomRequired when）',
        example: 1711864177268
      },
      { name: 'is_export', type: 'boolean', required: false, description: 'Whether to export', example: false }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataStatistic'
  },
  {
    label: 'Batch query telemetry statistics for multiple devices',
    value: '/telemetry/datas/statistic/batch',
    url: '/telemetry/datas/statistic/batch',
    method: 'GET',
    description: 'Batch query telemetry statistics for multiple devices，onlydiffSupports numeric strings',
    hasPathParams: false,
    commonParams: [
      { name: 'device_ids', type: 'object', required: true, description: 'equipmentIDarray', example: ['device-001', 'device-002'] },
      { name: 'keys', type: 'object', required: true, description: 'telemetrykeyarray', example: ['temperature', 'humidity'] },
      {
        name: 'time_type',
        type: 'string',
        required: true,
        description: 'time type (hour/day/week/month/year)',
        example: 'hour'
      },
      {
        name: 'aggregate_method',
        type: 'string',
        required: true,
        description: 'Aggregation method (avg/sum/max/min/count/diff-The difference between the latest and oldest data in the aggregation interval)',
        example: 'avg'
      },
      { name: 'limit', type: 'number', required: false, description: 'Data quantity limit（1-1000）', example: 100 }
    ],
    module: 'telemetry',
    functionName: 'telemetryDataStatisticBatch'
  }
]

/**
 * device data moduleAPIinterface
 */
const deviceApis: InternalApiItem[] = [
  {
    label: 'Simple information query of equipment（With telemetry data）',
    value: '/device/map/telemetry/{id}',
    url: '/device/map/telemetry/{id}',
    method: 'GET',
    description: 'Telemetry interface on the map，Return basic device information and telemetry data，likelabelDisplay if not returnedkey',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      { name: 'id', type: 'string', required: true, description: 'equipmentID（path parameters）', example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b' }
    ],
    module: 'device',
    functionName: 'deviceMapTelemetry'
  },
  {
    label: 'Equipment single indicator chart data query',
    value: '/device/metrics/chart',
    url: '/device/metrics/chart',
    method: 'GET',
    description: 'Query the latest and historical data of the device',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: 'equipmentID', example: 'af13ac2c-3a9e-5ab9-cd31-0cf01f984b3c' },
      {
        name: 'data_type',
        type: 'string',
        required: true,
        description: 'Device data type (TODO: Later use the form to implement the selector)',
        example: 'telemetry'
        // Optional value: telemetry(telemetry), attribute(property), command(Order), event(event)
      },
      {
        name: 'data_mode',
        type: 'string',
        required: true,
        description: 'data schema (TODO: Later use the form to implement the selector)',
        example: 'latest'
        // Optional value: latest(latest value), history(historical data-needdata_typeyestelemetryandkeyThe value is a number)
      },
      {
        name: 'key',
        type: 'string',
        required: true,
        description: 'data identifier（according todata_typeDifferent means different meanings：Telemetry metric name、attribute key name、command identifier or event identifier）',
        example: 'temperature'
      },
      {
        name: 'time_range',
        type: 'string',
        required: false,
        description: 'time range，defaultlast_5m (TODO: Later use the form to implement the selector)',
        example: 'last_5m'
        // Optional value: last_5m, last_15m, last_30m, last_1h, last_3h, last_6h, last_12h, last_24h, last_3d, last_7d, last_15d, last_30d, last_60d, last_90d, last_6m, last_1y
      },
      {
        name: 'aggregate_window',
        type: 'string',
        required: false,
        description: 'aggregation interval，defaultno_aggregate (TODO: Later, use the form to implement thetime_rangelinkage logic)',
        example: 'no_aggregate'
        // Optional value: no_aggregate, 30s, 1m, 2m, 5m, 10m, 30m, 1h, 3h, 6h, 1d, 7d, 1mo
      },
      {
        name: 'aggregate_function',
        type: 'string',
        required: false,
        description: 'aggregation method，defaultavg (TODO: whenaggregate_windowNot forno_aggregateused when)',
        example: 'avg'
        // Optional value: avg(average), max(maximum value), min(minimum value), sum(Sum), diff(The difference between the maximum and minimum)
      }
    ],
    module: 'device',
    functionName: 'deviceMetricsChart'
  },
  {
    label: '【tenant/user】Equipment summary',
    value: '/board/tenant/device/info',
    url: '/board/tenant/device/info',
    method: 'GET',
    description: 'Total number of devices under the tenant、Online and activation statistics',
    hasPathParams: false,
    commonParams: [
      // This interface does not require query parameters，Just needtokenCertification
    ],
    module: 'device',
    functionName: 'boardTenantDeviceInfo'
  }
]

/**
 * attribute data moduleAPIinterface
 */
const attributeApis: InternalApiItem[] = [
  {
    label: 'according toKEYQuery attribute information',
    value: '/attribute/datas/key',
    url: '/attribute/datas/key',
    method: 'GET',
    description: 'According to the specifiedkeyQuery attribute information',
    hasPathParams: false,
    commonParams: [],
    module: 'attribute',
    functionName: 'attributeDataByKey'
  },
  {
    label: 'Device attribute list query',
    value: '/attribute/datas/{id}',
    url: '/attribute/datas/{id}',
    method: 'GET',
    description: 'Query the attribute list of the specified device',
    hasPathParams: true,
    pathParamNames: ['id'],
    commonParams: [
      { name: 'id', type: 'string', required: true, description: 'equipmentID（path parameters）', example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b' }
    ],
    module: 'attribute',
    functionName: 'attributeDataList'
  }
]

/**
 * event data moduleAPIinterface
 */
const eventApis: InternalApiItem[] = [
  {
    label: 'Event data paging query',
    value: '/event/datas',
    url: '/event/datas',
    method: 'GET',
    description: 'Event data query（Pagination）',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: 'equipmentID', example: 'ca33926c-5ee5-3e9f-147e-94e188fde65b' },
      { name: 'page', type: 'number', required: true, description: 'page number', example: 1 },
      { name: 'page_size', type: 'number', required: true, description: 'Quantity per page', example: 10 },
      { name: 'identify', type: 'string', required: false, description: 'event identifier', example: 'event_001' }
    ],
    module: 'event',
    functionName: 'eventDataPagination'
  }
]

/**
 * Alarm data moduleAPIinterface
 */
const alarmApis: InternalApiItem[] = [
  {
    label: '【tenant】Number of devices in current alarm status',
    value: '/alarm/device/counts',
    url: '/alarm/device/counts',
    method: 'GET',
    description: 'Query statistics on the number of devices with current alarm status under the tenant',
    hasPathParams: false,
    commonParams: [
      // This interface does not require query parameters，Just needtokenCertification
    ],
    module: 'alarm',
    functionName: 'alarmDeviceCounts'
  },
  {
    label: 'Get device alarm status',
    value: '/alarm/info/history/device',
    url: '/alarm/info/history/device',
    method: 'GET',
    description: 'Get the alarm status of the specified device',
    hasPathParams: false,
    commonParams: [
      { name: 'device_id', type: 'string', required: true, description: 'equipmentID', example: '41b44d60-305f-f559-1d8d-61c040b63b1e' }
    ],
    module: 'alarm',
    functionName: 'alarmInfoHistoryDevice'
  },
  {
    label: 'Get the alarm history list',
    value: '/alarm/info/history',
    url: '/alarm/info/history',
    method: 'GET',
    description: 'Get the alarm history list（Pagination）',
    hasPathParams: false,
    commonParams: [
      { name: 'page', type: 'number', required: true, description: 'page number', example: 1 },
      { name: 'page_size', type: 'number', required: true, description: 'Quantity per page', example: 10 },
      { name: 'device_id', type: 'string', required: false, description: 'equipmentID（Filter criteria）', example: '41b44d60-305f-f559-1d8d-61c040b63b1e' },
      { name: 'alarm_status', type: 'string', required: false, description: 'Alarm status（Filter criteria）', example: '' },
      { name: 'start_time', type: 'string', required: false, description: 'start time（Filter criteria）', example: '' },
      { name: 'end_time', type: 'string', required: false, description: 'end time（Filter criteria）', example: '' }
    ],
    module: 'alarm',
    functionName: 'alarmInfoHistory'
  }
]

/**
 * Internal address option data
 * grouped by moduleAPIinterface list
 */
export const internalAddressOptions: InternalAddressOptions = [
  {
    type: 'group',
    label: 'telemetry data',
    key: 'telemetry',
    children: telemetryApis
  },
  {
    type: 'group',
    label: 'Device data',
    key: 'device',
    children: deviceApis
  },
  {
    type: 'group',
    label: 'attribute data',
    key: 'attribute',
    children: attributeApis
  },
  {
    type: 'group',
    label: 'event data',
    key: 'event',
    children: eventApis
  },
  {
    type: 'group',
    label: 'Alarm data',
    key: 'alarm',
    children: alarmApis
  }
]

/**
 * Get based on moduleAPIlist
 */
export function getApisByModule(module: string): InternalApiItem[] {
  const moduleGroup = internalAddressOptions.find(group => group.key === module)
  return moduleGroup ? moduleGroup.children : []
}

/**
 * according toAPIvalue getAPIDetails
 */
export function getApiByValue(value: string): InternalApiItem | undefined {
  for (const group of internalAddressOptions) {
    const api = group.children.find(item => item.value === value)
    if (api) return api
  }
  return undefined
}

/**
 * Get allAPIflat list of interfaces
 */
export function getAllApis(): InternalApiItem[] {
  return internalAddressOptions.reduce((acc, group) => {
    return acc.concat(group.children)
  }, [] as InternalApiItem[])
}

/**
 * searchAPIinterface
 */
export function searchApis(keyword: string): InternalApiItem[] {
  const allApis = getAllApis()
  const lowerKeyword = keyword.toLowerCase()

  return allApis.filter(
    api =>
      api.label.toLowerCase().includes(lowerKeyword) ||
      api.url.toLowerCase().includes(lowerKeyword) ||
      (api.description && api.description.toLowerCase().includes(lowerKeyword)) ||
      (api.functionName && api.functionName.toLowerCase().includes(lowerKeyword))
  )
}
