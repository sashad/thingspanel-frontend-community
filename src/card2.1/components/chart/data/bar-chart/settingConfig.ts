/**
 * Bar chart component configuration interface
 */
export interface BarChartCustomize {
  // Chart configuration
  title?: string // Chart title
  showLegend?: boolean // Show legend
  barWidth?: string // column width（Can be a number or percentage）
  showLabel?: boolean // show label

  // Axis configuration
  xAxisLabel?: string // Xaxis labels
  yAxisLabel?: string // Yaxis labels
  showGrid?: boolean // show grid

  // Color configuration
  barColor?: string // Bar color
  barGradient?: boolean // Use gradient colors
  barGradientColor?: string // gradient end color

  // Animation configuration
  animationDuration?: number // Animation duration
  animationDelay?: number // animation delay
}
