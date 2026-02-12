/**
 * ECharts global manager
 * solve ECharts Component duplicate registration problem
 */

import * as echarts from 'echarts/core'
import {
  BarChart,
  GaugeChart,
  LineChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  ScatterChart,
  // Add more chart types
  FunnelChart,
  SankeyChart,
  TreeChart,
  TreemapChart,
  GraphChart,
  BoxplotChart,
  CandlestickChart,
  EffectScatterChart,
  HeatmapChart,
  LinesChart,
  MapChart,
  ParallelChart,
  SunburstChart,
  ThemeRiverChart
} from 'echarts/charts'
import {
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  CalendarComponent,
  GraphicComponent,
  // Add more components
  PolarComponent,
  RadarComponent,
  GeoComponent,
  SingleAxisComponent,
  ParallelComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  BrushComponent,
  AxisPointerComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

// global identity，Make sure you only register once
let isEChartsRegistered = false

// Basic required components - Register on first load
const BASIC_COMPONENTS = [
  // Most commonly used chart types
  BarChart,
  LineChart,
  PieChart,

  // Basic components
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,

  // Basic functions
  LabelLayout,
  UniversalTransition,

  // Renderer
  CanvasRenderer
]

// Extended component mapping table - Load on demand
const EXTENDED_COMPONENTS_MAP: Record<string, any[]> = {
  scatter: [ScatterChart],
  gauge: [GaugeChart, PolarComponent],
  radar: [RadarChart, RadarComponent],
  pictorial: [PictorialBarChart],
  funnel: [FunnelChart],
  sankey: [SankeyChart],
  tree: [TreeChart],
  treemap: [TreemapChart],
  graph: [GraphChart],
  boxplot: [BoxplotChart],
  candlestick: [CandlestickChart],
  effectScatter: [EffectScatterChart],
  heatmap: [HeatmapChart],
  lines: [LinesChart],
  map: [MapChart, GeoComponent],
  parallel: [ParallelChart, ParallelComponent, SingleAxisComponent],
  sunburst: [SunburstChart],
  themeRiver: [ThemeRiverChart],
  toolbox: [ToolboxComponent],
  dataZoom: [DataZoomComponent],
  visualMap: [VisualMapComponent],
  timeline: [TimelineComponent],
  calendar: [CalendarComponent],
  graphic: [GraphicComponent],
  markLine: [MarkLineComponent],
  markPoint: [MarkPointComponent],
  markArea: [MarkAreaComponent],
  brush: [BrushComponent],
  axisPointer: [AxisPointerComponent],
  svg: [SVGRenderer]
}

// Registered extension
const registeredExtensions = new Set<string>()

/**
 * initialization ECharts Basic component registration
 * Register only the most commonly used components，Reduce initial memory footprint
 */
export function initEChartsComponents() {
  if (isEChartsRegistered) {
    return
  }

  try {
    echarts.use(BASIC_COMPONENTS)

    isEChartsRegistered = true
  } catch (error) {
    // Catching duplicate registration errors，But it does not affect program execution
    if (error instanceof Error && error.message.includes('exists')) {
      isEChartsRegistered = true
    } else {
      throw error
    }
  }
}

/**
 * Register extensions on demand
 * @param componentTypes Array of component types that need to be registered
 */
export function registerEChartsExtensions(componentTypes: string[]) {
  const newComponents: any[] = []

  componentTypes.forEach(type => {
    if (!registeredExtensions.has(type) && EXTENDED_COMPONENTS_MAP[type]) {
      newComponents.push(...EXTENDED_COMPONENTS_MAP[type])
      registeredExtensions.add(type)
      if (process.env.NODE_ENV === 'development') {
      }
    }
  })

  if (newComponents.length > 0) {
    try {
      echarts.use(newComponents)
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('⚠️ ECharts Extension registration warning:', error)
    }
  }
}

/**
 * Get ECharts Example
 * Make sure the component is registered before creating an instance
 */
export function createEChartsInstance(
  dom: HTMLElement,
  theme?: string | object,
  opts?: {
    devicePixelRatio?: number
    renderer?: 'canvas' | 'svg'
    useDirtyRect?: boolean
    useCoarsePointer?: boolean
    pointerSize?: number
    ssr?: boolean
    width?: number
    height?: number
    locale?: string
  }
): echarts.ECharts {
  // Make sure the component is registered
  initEChartsComponents()

  // Create instance
  return echarts.init(dom, theme, opts)
}

/**
 * safe to use ECharts
 * Provide a unified ECharts Access interface
 */
export function useEChartsInstance() {
  // Make sure the component is registered
  initEChartsComponents()

  return {
    echarts,
    createInstance: createEChartsInstance,
    isRegistered: () => isEChartsRegistered
  }
}

/**
 * Reset registration status（Only for testing）
 */
export function resetEChartsRegistration() {
  isEChartsRegistered = false
  if (process.env.NODE_ENV === 'development') {
  }
}

// Remove automatic initialization，Change to lazy loading
// Comment out automatic initialization to reduce memory footprint at startup
// if (typeof window !== 'undefined') {
//   initEChartsComponents()
// }

export default {
  initEChartsComponents,
  createEChartsInstance,
  useEChartsInstance,
  resetEChartsRegistration
}
