/**
 * Visual Editor Layout system type definition
 * Integrate original Panel System layout logic，Provide a unified layout management interface
 */

import type { ICardView, ICardData } from '@/card2.1/core2/legacy'
import type { IComponentDefinition } from '@/card2.1/core2'

// ====== Basic layout type ======

/**
 * location information
 */
export interface Position {
  x: number
  y: number
}

/**
 * size information
 */
export interface Size {
  width: number
  height: number
}

/**
 * Boundary information
 */
export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Grid configuration
 */
export interface GridConfig {
  cols: number // Number of columns
  rowHeight: number // row height
  margin: [number, number] // spacing [x, y]
  containerPadding: [number, number] // Container padding [x, y]
  breakpoints?: Record<string, number> // Breakpoint configuration
  layouts?: Record<string, LayoutItem[]> // Responsive layout
}

/**
 * layout constraints
 */
export interface LayoutConstraints {
  minSize: Size
  maxSize?: Size
  aspectRatio?: number // aspect ratio
  snapToGrid?: boolean // Whether to align to the grid
  resizable?: boolean // Is it resizable?
  draggable?: boolean // Whether it can be dragged
}

// ====== Layout item definition ======

/**
 * Visual Editor Layout items
 */
export interface LayoutItem {
  // Basic identification
  id: string
  type: string // Component type

  // location and size
  position: Position
  size: Size

  // constraint information
  constraints: LayoutConstraints

  // levels and status
  zIndex?: number
  visible?: boolean
  locked?: boolean
  selected?: boolean

  // Component configuration
  config?: Record<string, any>
  properties?: Record<string, any>

  // Data source configuration
  dataSource?: any

  // Style configuration
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    opacity?: number
    transform?: string
  }

  // metadata
  meta?: {
    name?: string
    description?: string
    category?: string
    icon?: string
    tags?: string[]
    createdAt?: Date
    updatedAt?: Date
  }

  // Compatibility field（used for Panel System compatible）
  legacy?: {
    cardView?: ICardView
    cardData?: ICardData
    componentDefinition?: IComponentDefinition
  }
}

/**
 * layout container
 */
export interface LayoutContainer {
  id: string
  name: string
  items: LayoutItem[]
  gridConfig: GridConfig

  // Container properties
  size: Size
  background?: {
    color?: string
    image?: string
    repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y'
    position?: string
    size?: string
  }

  // Theme configuration
  theme?: string
  customTheme?: Record<string, any>

  // Interactive configuration
  interaction?: {
    allowDrop?: boolean
    allowResize?: boolean
    allowDrag?: boolean
    showGrid?: boolean
    snapToGrid?: boolean
  }

  // metadata
  meta?: {
    version?: string
    description?: string
    tags?: string[]
    createdAt?: Date
    updatedAt?: Date
  }
}

// ====== Layout operation type ======

/**
 * Layout operation type
 */
export type LayoutOperation =
  | 'add'
  | 'remove'
  | 'move'
  | 'resize'
  | 'select'
  | 'deselect'
  | 'lock'
  | 'unlock'
  | 'show'
  | 'hide'
  | 'copy'
  | 'paste'
  | 'group'
  | 'ungroup'
  | 'align'
  | 'distribute'

/**
 * Layout change event
 */
export interface LayoutChangeEvent {
  type: LayoutOperation
  itemId: string | string[]
  oldValue?: any
  newValue?: any
  timestamp: number
}

/**
 * Layout history
 */
export interface LayoutHistory {
  id: string
  operation: LayoutOperation
  itemIds: string[]
  beforeState: any
  afterState: any
  timestamp: number
  description?: string
}

// ====== layout manager interface ======

/**
 * layout manager interface
 */
export interface ILayoutManager {
  // Container management
  getContainer(): LayoutContainer
  updateContainer(updates: Partial<LayoutContainer>): void

  // project management
  getItems(): LayoutItem[]
  getItem(id: string): LayoutItem | undefined
  addItem(item: LayoutItem): void
  removeItem(id: string): void
  updateItem(id: string, updates: Partial<LayoutItem>): void

  // Select management
  getSelectedItems(): LayoutItem[]
  selectItem(id: string, multiple?: boolean): void
  deselectItem(id: string): void
  selectAll(): void
  deselectAll(): void

  // Layout operations
  moveItem(id: string, position: Position): void
  resizeItem(id: string, size: Size): void
  lockItem(id: string): void
  unlockItem(id: string): void

  // Hierarchical management
  bringToFront(id: string): void
  sendToBack(id: string): void
  bringForward(id: string): void
  sendBackward(id: string): void

  // Alignment and distribution
  alignItems(ids: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void
  distributeItems(ids: string[], distribution: 'horizontal' | 'vertical'): void

  // copy and paste
  copyItems(ids: string[]): void
  pasteItems(position?: Position): void

  // Undo and redo
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean

  // History
  getHistory(): LayoutHistory[]
  clearHistory(): void

  // event handling
  on(event: string, handler: (event: LayoutChangeEvent) => void): void
  off(event: string, handler: (event: LayoutChangeEvent) => void): void
  emit(event: string, data: LayoutChangeEvent): void
}

// ====== Grid system type ======

/**
 * Grid unit
 */
export interface GridCell {
  col: number
  row: number
  width: number
  height: number
  occupied?: boolean
  item?: LayoutItem
}

/**
 * Grid layout engine interface
 */
export interface IGridLayoutEngine {
  // Grid configuration
  getGridConfig(): GridConfig
  updateGridConfig(config: Partial<GridConfig>): void

  // Position calculation
  pixelToGrid(pixel: Position): { col: number; row: number }
  gridToPixel(grid: { col: number; row: number }): Position

  // Collision detection
  checkCollision(item: LayoutItem, position: Position, size: Size): boolean
  findAvailablePosition(size: Size): Position | null

  // autolayout
  autoLayout(items: LayoutItem[]): LayoutItem[]
  compactLayout(items: LayoutItem[]): LayoutItem[]

  // Grid management
  getOccupiedCells(): GridCell[]
  getAvailableCells(): GridCell[]
  markCellsOccupied(position: Position, size: Size, item: LayoutItem): void
  markCellsAvailable(position: Position, size: Size): void
}

// ====== Responsive layout type ======

/**
 * breakpoint definition
 */
export interface Breakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  cols: number
  margin?: [number, number]
  containerPadding?: [number, number]
}

/**
 * Responsive layout configuration
 */
export interface ResponsiveLayoutConfig {
  breakpoints: Breakpoint[]
  defaultBreakpoint: string
  autoResize?: boolean
  maintainAspectRatio?: boolean
}

/**
 * Responsive layout manager interface
 */
export interface IResponsiveLayoutManager extends ILayoutManager {
  // Breakpoint management
  getBreakpoints(): Breakpoint[]
  getCurrentBreakpoint(): Breakpoint
  switchBreakpoint(breakpointName: string): void

  // Responsive operations
  getLayoutForBreakpoint(breakpointName: string): LayoutItem[]
  setLayoutForBreakpoint(breakpointName: string, items: LayoutItem[]): void
  syncLayoutAcrossBreakpoints(sourceBreakpoint: string): void

  // Adaptive
  autoAdjustForBreakpoint(breakpointName: string): void
  previewBreakpoint(breakpointName: string): void
  resetBreakpointPreview(): void
}

// ====== Layout tool function type ======

/**
 * Layout tool function collection
 */
export interface LayoutUtils {
  // Geometric calculations
  calculateBounds(items: LayoutItem[]): Bounds
  isPointInside(point: Position, item: LayoutItem): boolean
  getIntersection(item1: LayoutItem, item2: LayoutItem): Bounds | null

  // Sort and search
  sortItemsByZIndex(items: LayoutItem[]): LayoutItem[]
  findItemsInArea(area: Bounds, items: LayoutItem[]): LayoutItem[]
  findItemAt(position: Position, items: LayoutItem[]): LayoutItem | null

  // Alignment calculation
  calculateAlignmentOffset(items: LayoutItem[], alignment: string): Position[]
  calculateDistributionOffset(items: LayoutItem[], distribution: string): Position[]

  // Size calculation
  calculateOptimalSize(content: any, constraints: LayoutConstraints): Size
  maintainAspectRatio(currentSize: Size, newSize: Partial<Size>, aspectRatio: number): Size

  // grid computing
  snapToGrid(position: Position, gridSize: Size): Position
  calculateGridPosition(pixelPosition: Position, gridConfig: GridConfig): { col: number; row: number }

  // conversion tools
  convertPanelLayoutToEditor(panelLayout: ICardView[]): LayoutItem[]
  convertEditorLayoutToPanel(editorLayout: LayoutItem[]): ICardView[]
}

// ====== Export type definition ======

/**
 * layout serialization format
 */
export interface SerializedLayout {
  version: string
  container: LayoutContainer
  items: LayoutItem[]
  metadata?: {
    exportedAt: string
    exportedBy?: string
    source: 'visual-editor' | 'panel-system'
    compatibility: string[]
  }
}

/**
 * Layout import and export interface
 */
export interface ILayoutSerializer {
  // serialization
  serialize(container: LayoutContainer): SerializedLayout
  deserialize(data: SerializedLayout): LayoutContainer

  // format conversion
  convertFromPanelFormat(panelConfig: string): SerializedLayout
  convertToPanelFormat(layout: SerializedLayout): string

  // verify
  validate(data: SerializedLayout): { valid: boolean; errors: string[] }

  // Versioning
  migrate(data: SerializedLayout, targetVersion: string): SerializedLayout
  getCompatibleVersions(): string[]
}

// ====== Default layout type ======

/**
 * layout template
 */
export interface LayoutTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail?: string
  layout: LayoutItem[]
  gridConfig: GridConfig
  tags?: string[]
  isBuiltIn?: boolean
  createdAt?: Date
}

/**
 * Layout template manager interface
 */
export interface ILayoutTemplateManager {
  // Template management
  getTemplates(): LayoutTemplate[]
  getTemplate(id: string): LayoutTemplate | undefined
  saveTemplate(template: Omit<LayoutTemplate, 'id' | 'createdAt'>): LayoutTemplate
  deleteTemplate(id: string): boolean

  // Template application
  applyTemplate(templateId: string, container: LayoutContainer): boolean
  createTemplateFromLayout(name: string, description: string, layout: LayoutItem[]): LayoutTemplate

  // Sort and search
  getTemplatesByCategory(category: string): LayoutTemplate[]
  searchTemplates(query: string): LayoutTemplate[]

  // Import and export
  exportTemplate(templateId: string): string
  importTemplate(templateData: string): LayoutTemplate | null
}
