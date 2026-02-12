/**
 * EditorLayout Component related type definitions
 */

/** Drawer location */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

/** drawer status */
export interface DrawerState {
  /** visible or not */
  visible: boolean
  /** Drawer width */
  width: number | string
  /** Drawer title */
  title: string
  /** Can it be closed */
  closable: boolean
}

/** Editor layout configuration */
export interface EditorLayoutConfig {
  /** Left drawer configuration */
  left: DrawerState
  /** Right drawer configuration */
  right: DrawerState
  /** Whether to display the toolbar */
  showToolbar: boolean
  /** Whether to display the mask */
  showMask: boolean
  /** Click on whether the mask is closed */
  maskClosable: boolean
  /** ESCIs the key off? */
  closeOnEsc: boolean
}

/** Layout theme variables */
export interface LayoutThemeVars {
  /** Editor background color */
  '--editor-bg-color': string
  /** Toolbar background color */
  '--toolbar-bg-color': string
  /** Toolbar border color */
  '--toolbar-border-color': string
  /** toolbar shadow */
  '--toolbar-shadow': string
}

/** Drawer state change event */
export interface DrawerChangeEvent {
  /** Drawer location */
  placement: DrawerPlacement
  /** Current status */
  visible: boolean
  /** Timestamp */
  timestamp: number
}

/** Editor layout instance methods */
export interface EditorLayoutInstance {
  /** Left drawer shows status */
  leftDrawerVisible: boolean
  /** Right drawer shows status */
  rightDrawerVisible: boolean
  /** Open left drawer */
  openLeftDrawer: () => void
  /** Close left drawer */
  closeLeftDrawer: () => void
  /** Switch left drawer */
  toggleLeftDrawer: () => void
  /** Open the right drawer */
  openRightDrawer: () => void
  /** Close the right drawer */
  closeRightDrawer: () => void
  /** Switch right drawer */
  toggleRightDrawer: () => void
}

/** Toolbar button configuration */
export interface ToolbarButtonConfig {
  /** Button logo */
  key: string
  /** button title */
  title: string
  /** icon */
  icon?: string
  /** Whether to activate the status */
  active?: boolean
  /** Whether to disable */
  disabled?: boolean
  /** click event */
  onClick?: () => void
}

/** Layout responsive breakpoints */
export const LAYOUT_BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
} as const

export type LayoutBreakpoint = keyof typeof LAYOUT_BREAKPOINTS

/** Responsive configuration */
export interface ResponsiveConfig {
  /** breakpoint */
  breakpoint: LayoutBreakpoint
  /** Left drawer configuration */
  leftDrawer?: Partial<DrawerState>
  /** Right drawer configuration */
  rightDrawer?: Partial<DrawerState>
  /** Whether to display the toolbar */
  showToolbar?: boolean
}
