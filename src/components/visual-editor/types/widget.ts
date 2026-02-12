/**
 * Component type definition
 */

// Component type
export type WidgetType = 'text' | 'image' | 'barchart' | 'linechart' | 'piechart'

// Component configuration base class
export interface WidgetConfig {
  [key: string]: any
}

// Text component configuration
export interface TextWidgetConfig extends WidgetConfig {
  content: string
  fontSize: number
  color: string
  textAlign: 'left' | 'center' | 'right'
}

// Picture component configuration
export interface ImageWidgetConfig extends WidgetConfig {
  src: string
  alt: string
  objectFit: 'cover' | 'contain' | 'fill'
}
