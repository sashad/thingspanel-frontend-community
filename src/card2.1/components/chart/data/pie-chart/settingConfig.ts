/**
 * Pie chart component configuration interface
 */
export interface PieChartCustomize {
  // Chart configuration
  title?: string // Chart title
  showLegend?: boolean // Show legend
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' // legend position

  // Pie chart style configuration
  radius?: [string, string] // pie radius [inner radius, outer radius]
  isDonut?: boolean // Is it a donut chart?
  roseType?: boolean | 'radius' | 'area' // Nightingale Rose Chart Type

  // Label configuration
  showLabel?: boolean // show label
  labelPosition?: 'outside' | 'inside' | 'center' // label position
  showLabelLine?: boolean // Show label guides

  // Color configuration
  colorScheme?: 'default' | 'warm' | 'cool' | 'pastel' | 'custom' // color scheme
  customColors?: string[] // Custom color array

  // Interactive configuration
  enableHighlight?: boolean // Enable highlighting
  selectedMode?: boolean | 'single' | 'multiple' // selected mode
  selectedOffset?: number // Offset distance of selected sector

  // Data display configuration
  showPercentage?: boolean // Show percentage
  minAngle?: number // Minimum sector angle

  // Animation configuration
  animationDuration?: number // Animation duration
}
