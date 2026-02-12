/**
 * Line chart component configuration interface
 */
export interface LineChartCustomize {
  // Chart configuration
  title?: string // Chart title
  showLegend?: boolean // Show legend
  smooth?: boolean // smooth curve
  showArea?: boolean // display area

  // Axis configuration
  xAxisLabel?: string // Xaxis labels
  yAxisLabel?: string // Yaxis labels
  showGrid?: boolean // show grid

  // Color configuration
  lineColor?: string // line color
  areaColor?: string // area color

  // Data point configuration
  showDataPoints?: boolean // Show data points
  dataPointSize?: number // data point size

  // Animation configuration
  animationDuration?: number // Animation duration
}
