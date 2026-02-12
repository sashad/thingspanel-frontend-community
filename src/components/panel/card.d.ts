export type DeviceSourceItem = {
  cardId?: string
  deviceId?: string
  deviceMetrics?: string
  name?: string
  metricsId?: string
  metricsType?: string // telemetry | attributes | event | command
  metricsDataType?: string // number | string | boolean
  metricsName?: string
  metricsOptions?: any[]
  metricsShow: boolean
  aggregate_function: string
}

export interface ICardData {
  type?: ICardDefine['type']
  cardId?: string
  // Component custom configuration
  config?: Record<string, any>
  title?: string
  // Basic configuration
  basicSettings?: {
    showTitle?: boolean
    title?: string
  }
  layout?: {
    w?: number
    h?: number
    minW?: number
    minH?: number
  }
  // data source
  dataSource?: {
    // system or equipment
    origin: 'system' | 'device'
    sourceNum?: number // Just leave it blank 1-as many as you want，most9indivual，If you need a fixed quantity，Fill in the integer
    systemSource?: { type?: number; name?: string }[]
    deviceCount?: number
    isSupportTimeRange: boolean // Whether to support specified time range
    dataTimeRange: string // time range，custom，last_5m，last_15m，last_30m，last_1h，last_3h，last_6h，last_12h，last_24h，last_3d，last_7d，last_15d，last_30d，last_60d，last_90d，last_6m，last_1y
    isSupportAggregate: boolean // Whether to support aggregation
    dataAggregateRange: string // Aggregation time range
    deviceSource?: DeviceSourceItem[]
  }
}

export interface ICardView {
  x: number
  y: number
  w: number
  h: number
  i: number
  minW?: number
  minH?: number
  data?: ICardData
}

export interface ICardDefine {
  component: any // card component，Usually ./component.vue
  remoteId?: string
  id: string // Card unique identifier，according tocard_type_cardNameThe naming is correct
  title: string // card title，English，later as internationalizationkey
  poster: string // Example diagram size193*120
  type: 'builtin' | 'device' | 'plugin' | 'chart' // Card type
  // Doesn't existall
  scene?: 'mobile' | 'pc' | 'all'
  configForm?: any // Card configuration file，Usually card-config.vue
  // Initialization setting parameters（Optional）
  preset?: {
    config?: object
    dataSource?: ICardData['dataSource']
    basicSettings?: ICardData['basicSettings']
    iCardViewDefault?: {
      w?: number // How many rows does the card initially occupy?，Try to match it as much as possible
      h?: number // The initial columns of the card，Try to match it as much as possible
      minW?: number // The minimum number of lines a card should occupy
      minH?: number // The smallest and largest columns of a card
    }
  }
}

export interface ICardFormIns {
  setCard: (card?: ICardData | null) => void
}

export interface IConfigCtx {
  config: Record<string, any>
  view?: boolean // preview mode
}

export interface ICardItem {
  getComponent(): any
}

export interface ICardRender {
  addCard(data: ICardData): void
  getCardComponent(cardView: ICardView): ICardItem | null
}
