/**
 * Grid Layout Plus type definition
 * based on grid-layout-plus library TypeScript type extension
 */

import type { Component } from 'vue'

// Basic grid item interface
export interface GridLayoutPlusItem {
  /** Project unique identifier */
  i: string
  /** Xaxis position (Grid units) */
  x: number
  /** Yaxis position (Grid units) */
  y: number
  /** width (Grid units) */
  w: number
  /** high (Grid units) */
  h: number

  // constraint configuration
  /** minimum width */
  minW?: number
  /** minimum height */
  minH?: number
  /** maximum width */
  maxW?: number
  /** maximum height */
  maxH?: number

  // behavior configuration
  /** Whether it can be dragged */
  isDraggable?: boolean
  /** Is it resizable? */
  isResizable?: boolean
  /** Whether it is a static project */
  static?: boolean

  // Drag and drop configuration
  /** Drag and drop ignored selector */
  dragIgnoreFrom?: string
  /** Drag-and-drop allowed selectors */
  dragAllowFrom?: string
  /** Selector ignored by resize */
  resizeIgnoreFrom?: string
  /** Whether to maintain aspect ratio */
  preserveAspectRatio?: boolean

  // Drag and resize options
  /** Drag and drop options */
  dragOption?: DragOption
  /** Resize options */
  resizeOption?: ResizeOption

  // business data
  /** Component type */
  type?: string
  /** Component title */
  title?: string
  /** Rendered component */
  component?: Component
  /** Component properties */
  props?: Record<string, any>
  /** component data */
  data?: Record<string, any>
  /** Custom style */
  style?: Record<string, string | number>
  /** Custom class name */
  className?: string
  /** Project metadata */
  metadata?: Record<string, any>
}

// Drag and drop options
export interface DragOption {
  /** Drag handle */
  handle?: string
  /** Cancel drag */
  cancel?: string
  /** Whether to enable scrolling */
  scroll?: boolean
  /** scroll sensitivity */
  scrollSensitivity?: number
  /** scroll speed */
  scrollSpeed?: number
  /** Drag transparency */
  opacity?: number
  /** When draggingz-index */
  zIndex?: number
  /** Whether to clone and drag */
  helper?: 'original' | 'clone' | ((event: Event) => HTMLElement)
  /** Drag start callback */
  start?: (event: Event, ui: any) => void
  /** Callback during dragging */
  drag?: (event: Event, ui: any) => void
  /** Drag end callback */
  stop?: (event: Event, ui: any) => void
}

// Resize options
export interface ResizeOption {
  /** resize handle */
  handles?: string
  /** minimum width */
  minWidth?: number
  /** minimum height */
  minHeight?: number
  /** maximum width */
  maxWidth?: number
  /** maximum height */
  maxHeight?: number
  /** Whether to maintain aspect ratio */
  aspectRatio?: boolean
  /** Grid adsorption */
  grid?: [number, number]
  /** Resize start callback */
  start?: (event: Event, ui: any) => void
  /** Callback during resize */
  resize?: (event: Event, ui: any) => void
  /** Resize end callback */
  stop?: (event: Event, ui: any) => void
}

// Grid layout configuration
export interface GridLayoutPlusConfig {
  /** Number of columns */
  colNum: number
  /** row height（Pixel），Used to calculate the height of each row */
  rowHeight: number
  /** Minimum number of rows（Optional）：Used to control container initialization/minimum height = minRows * rowHeight */
  minRows?: number
  /** Whether it can be dragged */
  isDraggable: boolean
  /** Is it resizable? */
  isResizable: boolean
  /** Whether to mirror */
  isMirrored: boolean
  /** Whether to automatically resize */
  autoSize: boolean
  /** Is it vertically compact? */
  verticalCompact: boolean
  /** margin [x, y] - @deprecated Please use horizontalGap and verticalGap */
  margin: [number, number]
  /** Component horizontal spacing（Pixel） */
  horizontalGap?: number
  /** Component vertical spacing（Pixel） */
  verticalGap?: number
  /** Whether to useCSStransform */
  useCssTransforms: boolean
  /** Is it responsive? */
  responsive: boolean
  /** Responsive breakpoints */
  breakpoints: Record<string, number>
  /** Number of columns for different breakpoints */
  cols: Record<string, number>
  /** Whether to prevent collision */
  preventCollision: boolean
  /** Whether to use style cursor */
  useStyleCursor: boolean
  /** Whether to restore when dragging */
  restoreOnDrag: boolean
  /** Whether it is a static mesh */
  staticGrid?: boolean
}

// Default configuration
export const DEFAULT_GRID_LAYOUT_PLUS_CONFIG: GridLayoutPlusConfig = {
  colNum: 12,
  rowHeight: 100,
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  // Default no spacing：Depend on [10, 10] Adjust to [0, 0]
  margin: [0, 0],
  useCssTransforms: true,
  responsive: false,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  preventCollision: false,
  useStyleCursor: true,
  restoreOnDrag: false
}

// 🔥 New：Very large grid configuration（support0-99List）
export const EXTENDED_GRID_LAYOUT_CONFIG: GridLayoutPlusConfig = {
  colNum: 50, // default50List，Balance performance and flexibility
  rowHeight: 40, // Reduce row height to fit more content
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  autoSize: true,
  verticalCompact: true,
  margin: [5, 5], // Reduce margins to save space
  useCssTransforms: true,
  responsive: true, // Enable responsiveness to adapt to different screens
  breakpoints: {
    xxl: 2560, // 4Kmonitor
    xl: 1920, // Large screen monitor
    lg: 1200, // desktop
    md: 996, // small desktop
    sm: 768, // flat
    xs: 480, // Mobile phone landscape
    xxs: 0 // Mobile phone vertical screen
  },
  cols: {
    xxl: 99, // 4KThe maximum support is99List
    xl: 80, // Big screen80List
    lg: 50, // desktop50List
    md: 30, // small desktop30List
    sm: 20, // flat20List
    xs: 10, // Mobile phone landscape10List
    xxs: 5 // Mobile phone vertical screen5List
  },
  preventCollision: false,
  useStyleCursor: true,
  restoreOnDrag: false
}

// 🔥 Extra Large Grid Tool Function
export const GridSizePresets = {
  MINI: { colNum: 12, rowHeight: 100, margin: [10, 10] }, // 12List - Standard small grid
  STANDARD: { colNum: 24, rowHeight: 60, margin: [8, 8] }, // 24List - standard grid
  LARGE: { colNum: 50, rowHeight: 40, margin: [5, 5] }, // 50List - large grid
  MEGA: { colNum: 99, rowHeight: 20, margin: [2, 2] }, // 99List - Very large grid
  CUSTOM: (cols: number) => ({
    // Custom number of columns
    colNum: Math.max(1, Math.min(99, cols)), // limit1-99List
    rowHeight: Math.max(20, 100 - cols), // Dynamically adjust row height
    margin: [Math.max(2, 10 - Math.floor(cols / 10)), Math.max(2, 10 - Math.floor(cols / 10))] // Dynamically adjust margins
  })
}

// componentsProps
export interface GridLayoutPlusProps {
  /** layout data */
  layout: GridLayoutPlusItem[]
  /** Is it read-only? */
  readonly?: boolean
  /** Whether to display grid lines */
  showGrid?: boolean
  /** Whether to display the drag area */
  showDropZone?: boolean
  /** Whether to display the title bar */
  showTitle?: boolean
  /** Grid configuration */
  config?: Partial<GridLayoutPlusConfig>
  /** container style */
  containerStyle?: Record<string, string | number>
  /** Container class name */
  containerClass?: string
  /** Unique key field name（Used by default 'i'）。Allows external data structures to rename primary key fields to arbitrary names（like 'id'），The components will be automatically normalized internally to item.i */
  idKey?: string
}

// componentsEmits
export interface GridLayoutPlusEmits {
  /** Layout creation */
  (e: 'layout-created', layout: GridLayoutPlusItem[]): void
  /** Before layout is mounted */
  (e: 'layout-before-mount', layout: GridLayoutPlusItem[]): void
  /** Layout is mounted */
  (e: 'layout-mounted', layout: GridLayoutPlusItem[]): void
  /** layout update */
  (e: 'layout-updated', layout: GridLayoutPlusItem[]): void
  /** Layout ready */
  (e: 'layout-ready', layout: GridLayoutPlusItem[]): void
  /** Layout changes */
  (e: 'layout-change', layout: GridLayoutPlusItem[]): void
  /** Update layout */
  (e: 'update:layout', layout: GridLayoutPlusItem[]): void
  /** Breakpoint changes */
  (e: 'breakpoint-changed', breakpoint: string, layout: GridLayoutPlusItem[]): void
  /** Container size changes */
  (e: 'container-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** Project resizing */
  (e: 'item-resize', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** Project resizing completed */
  (e: 'item-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void
  /** Project is moving */
  (e: 'item-move', i: string, newX: number, newY: number): void
  /** Project move completed */
  (e: 'item-moved', i: string, newX: number, newY: number): void
  /** Project container size changes */
  (e: 'item-container-resized', i: string, newH: number, newW: number, newHPx: number, newWPx: number): void

  // business events
  /** Item added */
  (e: 'item-add', item: GridLayoutPlusItem): void
  /** Project deletion */
  (e: 'item-delete', itemId: string): void
  /** Project updates */
  (e: 'item-update', itemId: string, updates: Partial<GridLayoutPlusItem>): void
  /** Project editor */
  (e: 'item-edit', item: GridLayoutPlusItem): void
  /** Project data update */
  (e: 'item-data-update', itemId: string, data: any): void
}

// Responsive layout configuration
export interface ResponsiveLayout {
  lg?: GridLayoutPlusItem[]
  md?: GridLayoutPlusItem[]
  sm?: GridLayoutPlusItem[]
  xs?: GridLayoutPlusItem[]
  xxs?: GridLayoutPlusItem[]
}

// Layout operation results
export interface LayoutOperationResult<T = any> {
  success: boolean
  data?: T
  error?: Error
  message?: string
}

// Utility function type
export type LayoutValidator = (layout: GridLayoutPlusItem[]) => LayoutOperationResult<boolean>
export type ItemValidator = (item: GridLayoutPlusItem) => LayoutOperationResult<boolean>
export type PositionFinder = (w: number, h: number, layout: GridLayoutPlusItem[]) => { x: number; y: number }

// Theme configuration
export interface GridTheme {
  /** Main background color */
  backgroundColor: string
  /** grid line color */
  gridLineColor: string
  /** Project background color */
  itemBackgroundColor: string
  /** Item border color */
  itemBorderColor: string
  /** Project shadow */
  itemShadow: string
  /** Item hover shadow */
  itemHoverShadow: string
  /** Drag prompt color */
  dragHintColor: string
  /** text color */
  textColor: string
  /** Secondary text color */
  secondaryTextColor: string
}

// Predefined themes
export const LIGHT_THEME: GridTheme = {
  backgroundColor: '#f8f9fa',
  gridLineColor: '#ddd',
  itemBackgroundColor: '#ffffff',
  itemBorderColor: '#e1e5e9',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  dragHintColor: '#007bff',
  textColor: '#495057',
  secondaryTextColor: '#6c757d'
}

export const DARK_THEME: GridTheme = {
  backgroundColor: '#1a1a1a',
  gridLineColor: '#333',
  itemBackgroundColor: '#2d2d2d',
  itemBorderColor: '#404040',
  itemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  itemHoverShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  dragHintColor: '#4dabf7',
  textColor: '#ffffff',
  secondaryTextColor: '#b0b0b0'
}

// Performance configuration
export interface PerformanceConfig {
  /** Anti-shake delay */
  debounceDelay: number
  /** throttling delay */
  throttleDelay: number
  /** Whether to enable lazy loading */
  enableLazyLoading: boolean
  /** Lazy loading buffer */
  lazyLoadingBuffer: number
}

// Export all types
export type {
  GridLayoutPlusItem as GridItem,
  GridLayoutPlusConfig as GridConfig,
  GridLayoutPlusProps as GridProps,
  GridLayoutPlusEmits as GridEmits
}
