/**
 * Theme system integration
 * Integrate the theme functions of the original panel system into Visual Editor middle，Provide unified theme management
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { createLogger } from '@/utils/logger'
import type { LayoutContainer, LayoutItem } from '@/components/visual-editor/types/layout'

const logger = createLogger('ThemeIntegration')

// ====== Topic type definition ======

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  shadow: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeGradients {
  primary: string
  secondary: string
  accent: string
  card: string
  background: string
}

export interface ThemeTypography {
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    snug: number
    normal: number
    relaxed: number
    loose: number
  }
}

export interface ThemeSpacing {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  '4xl': string
}

export interface ThemeBorderRadius {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  full: string
}

export interface ThemeShadows {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  inner: string
  none: string
}

export interface PanelTheme {
  id: string
  name: string
  displayName: string
  description?: string
  category: 'light' | 'dark' | 'auto'
  isBuiltIn: boolean

  // color system
  colors: ThemeColors
  gradients: ThemeGradients

  // Typesetting system
  typography: ThemeTypography

  // space system
  spacing: ThemeSpacing

  // fillet system
  borderRadius: ThemeBorderRadius

  // shadow system
  shadows: ThemeShadows

  // Component specific styles
  components?: {
    card?: Record<string, any>
    button?: Record<string, any>
    input?: Record<string, any>
    chart?: Record<string, any>
    [key: string]: Record<string, any> | undefined
  }

  // Customize CSS variable
  customVars?: Record<string, string>

  // metadata
  meta?: {
    version: string
    author?: string
    createdAt?: string
    updatedAt?: string
  }
}

// ====== Built-in theme definition ======

const BUILT_IN_THEMES: PanelTheme[] = [
  {
    id: 'default',
    name: 'default',
    displayName: 'default theme',
    description: 'System default light theme',
    category: 'light',
    isBuiltIn: true,
    colors: {
      primary: '#1890ff',
      secondary: '#722ed1',
      accent: '#13c2c2',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#262626',
      textSecondary: '#8c8c8c',
      border: '#d9d9d9',
      shadow: 'rgba(0, 0, 0, 0.1)',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      secondary: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
      accent: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
      card: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '96px'
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none'
    }
  },
  {
    id: 'dark',
    name: 'dark',
    displayName: 'dark theme',
    description: 'dark mode theme',
    category: 'dark',
    isBuiltIn: true,
    colors: {
      primary: '#1890ff',
      secondary: '#722ed1',
      accent: '#13c2c2',
      background: '#141414',
      surface: '#1f1f1f',
      text: '#ffffff',
      textSecondary: '#a6a6a6',
      border: '#434343',
      shadow: 'rgba(0, 0, 0, 0.3)',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      secondary: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
      accent: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
      card: 'linear-gradient(135deg, #1f1f1f 0%, #262626 100%)',
      background: 'linear-gradient(180deg, #141414 0%, #1f1f1f 100%)'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
      '4xl': '96px'
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
      none: 'none'
    }
  }
]

// ====== theme manager ======

export class ThemeIntegrationManager {
  private themes = new Map<string, PanelTheme>()
  private currentTheme = ref<PanelTheme | null>(null)
  private customThemes = reactive<Record<string, PanelTheme>>({})
  private themeStore = useThemeStore()

  constructor() {
    this.initializeBuiltInThemes()
    this.syncWithThemeStore()
    this.setupCSSVariables()
  }

  // ====== initialization ======

  /**
   * Initialize built-in theme
   */
  private initializeBuiltInThemes(): void {
    BUILT_IN_THEMES.forEach(theme => {
      this.themes.set(theme.id, theme)
    })

    // Set default theme
    this.currentTheme.value = this.themes.get('default') || null

    logger.info(`initialization ${BUILT_IN_THEMES.length} built-in themes`)
  }

  /**
   * Sync with global topic store
   */
  private syncWithThemeStore(): void {
    // Monitor global theme changes
    watch(
      () => this.themeStore.themeScheme,
      newScheme => {
        this.switchToScheme(newScheme)
      },
      { immediate: true }
    )
  }

  /**
   * set up CSS variable
   */
  private setupCSSVariables(): void {
    watch(
      () => this.currentTheme.value,
      newTheme => {
        if (newTheme) {
          this.applyCSSVariables(newTheme)
        }
      },
      { immediate: true }
    )
  }

  // ====== Topic management ======

  /**
   * Switch to the specified theme
   */
  switchToTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme) {
      logger.warn(`Topic does not exist: ${themeId}`)
      return false
    }

    this.currentTheme.value = theme
    logger.info(`switch to topic: ${theme.displayName}`)
    return true
  }

  /**
   * Switch to the specified theme plan
   */
  switchToScheme(scheme: 'light' | 'dark' | 'auto'): void {
    let targetTheme: PanelTheme | undefined

    if (scheme === 'auto') {
      // Choose a theme based on system preferences
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      targetTheme = this.getThemesByCategory(prefersDark ? 'dark' : 'light')[0]
    } else {
      targetTheme = this.getThemesByCategory(scheme)[0]
    }

    if (targetTheme) {
      this.switchToTheme(targetTheme.id)
    }
  }

  /**
   * Get the current topic
   */
  getCurrentTheme(): PanelTheme | null {
    return this.currentTheme.value
  }

  /**
   * Get all topics
   */
  getAllThemes(): PanelTheme[] {
    return Array.from(this.themes.values())
  }

  /**
   * Get topics based on category
   */
  getThemesByCategory(category: 'light' | 'dark' | 'auto'): PanelTheme[] {
    return Array.from(this.themes.values()).filter(theme => theme.category === category)
  }

  /**
   * Get topic
   */
  getTheme(themeId: string): PanelTheme | undefined {
    return this.themes.get(themeId)
  }

  // ====== Custom theme ======

  /**
   * Create a custom theme
   */
  createCustomTheme(baseThemeId: string, customizations: Partial<PanelTheme>): PanelTheme | null {
    const baseTheme = this.themes.get(baseThemeId)
    if (!baseTheme) {
      logger.error(`The base theme does not exist: ${baseThemeId}`)
      return null
    }

    const customTheme: PanelTheme = {
      ...baseTheme,
      ...customizations,
      id: customizations.id || `custom-${Date.now()}`,
      isBuiltIn: false,
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        ...customizations.meta
      }
    }

    this.themes.set(customTheme.id, customTheme)
    this.customThemes[customTheme.id] = customTheme

    logger.info(`Create a custom theme: ${customTheme.displayName}`)
    return customTheme
  }

  /**
   * Update custom theme
   */
  updateCustomTheme(themeId: string, updates: Partial<PanelTheme>): boolean {
    const theme = this.themes.get(themeId)
    if (!theme || theme.isBuiltIn) {
      logger.warn(`Unable to update theme: ${themeId}`)
      return false
    }

    const updatedTheme = {
      ...theme,
      ...updates,
      meta: {
        ...theme.meta,
        updatedAt: new Date().toISOString()
      }
    }

    this.themes.set(themeId, updatedTheme)
    this.customThemes[themeId] = updatedTheme

    // If it is the current topic，Apply updates now
    if (this.currentTheme.value?.id === themeId) {
      this.currentTheme.value = updatedTheme
    }

    logger.info(`Update custom theme: ${themeId}`)
    return true
  }

  /**
   * Delete custom theme
   */
  deleteCustomTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme || theme.isBuiltIn) {
      logger.warn(`Unable to delete topic: ${themeId}`)
      return false
    }

    this.themes.delete(themeId)
    delete this.customThemes[themeId]

    // If the current topic is deleted，Switch to default theme
    if (this.currentTheme.value?.id === themeId) {
      this.switchToTheme('default')
    }

    logger.info(`Delete custom theme: ${themeId}`)
    return true
  }

  // ====== CSS Variable application ======

  /**
   * Apply theme CSS variable
   */
  private applyCSSVariables(theme: PanelTheme): void {
    const root = document.documentElement

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-color-${key}`, value)
    })

    // Apply gradient variable
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--theme-gradient-${key}`, value)
    })

    // Apply font variables
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily)
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-size-${key}`, value)
    })
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-weight-${key}`, String(value))
    })
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--theme-line-height-${key}`, String(value))
    })

    // Apply spatial variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value)
    })

    // Apply rounded variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--theme-border-radius-${key}`, value)
    })

    // Apply shadow variable
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--theme-shadow-${key}`, value)
    })

    // Apply custom variables
    if (theme.customVars) {
      Object.entries(theme.customVars).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value)
      })
    }

    logger.debug(`Apply theme CSS variable: ${theme.displayName}`)
  }

  // ====== Theme applied to layout ======

  /**
   * Apply a theme to a layout container
   */
  applyThemeToContainer(container: LayoutContainer): void {
    if (!this.currentTheme.value) return

    const theme = this.currentTheme.value

    // Update container theme configuration
    container.theme = theme.id
    container.customTheme = {
      colors: theme.colors,
      gradients: theme.gradients,
      typography: theme.typography,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows
    }

    // If the container has background configuration，Apply theme colors
    if (container.background) {
      if (!container.background.color) {
        container.background.color = theme.colors.background
      }
    } else {
      container.background = {
        color: theme.colors.background
      }
    }

    logger.debug(`Apply theme to container: ${container.name}`)
  }

  /**
   * Apply a theme to a layout item
   */
  applyThemeToItems(items: LayoutItem[]): void {
    if (!this.currentTheme.value) return

    const theme = this.currentTheme.value

    items.forEach(item => {
      // Apply theme styles
      if (!item.style) {
        item.style = {}
      }

      // Apply default style（If there is no custom style）
      if (!item.style.backgroundColor) {
        item.style.backgroundColor = theme.colors.surface
      }
      if (!item.style.borderColor) {
        item.style.borderColor = theme.colors.border
      }
      if (!item.style.borderRadius) {
        item.style.borderRadius = parseInt(theme.borderRadius.md)
      }

      // Component specific styles
      if (theme.components && item.type) {
        const componentStyles = theme.components[item.type]
        if (componentStyles) {
          Object.assign(item.style, componentStyles)
        }
      }
    })

    logger.debug(`Apply theme to ${items.length} layout items`)
  }

  // ====== Theme import and export ======

  /**
   * Export theme
   */
  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId)
    if (!theme) {
      logger.error(`Topic does not exist: ${themeId}`)
      return null
    }

    try {
      return JSON.stringify(theme, null, 2)
    } catch (error) {
      logger.error('Failed to export topic:', error)
      return null
    }
  }

  /**
   * Import theme
   */
  importTheme(themeData: string): PanelTheme | null {
    try {
      const theme: PanelTheme = JSON.parse(themeData)

      // Validate subject data
      if (!this.validateTheme(theme)) {
        logger.error('Topic data is invalid')
        return null
      }

      // Make sure it’s a custom theme
      theme.isBuiltIn = false
      theme.id = theme.id || `imported-${Date.now()}`

      this.themes.set(theme.id, theme)
      this.customThemes[theme.id] = theme

      logger.info(`Import theme: ${theme.displayName}`)
      return theme
    } catch (error) {
      logger.error('Importing theme failed:', error)
      return null
    }
  }

  /**
   * Validate subject data
   */
  private validateTheme(theme: any): theme is PanelTheme {
    return (
      theme &&
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.displayName === 'string' &&
      theme.colors &&
      typeof theme.colors === 'object' &&
      theme.gradients &&
      typeof theme.gradients === 'object'
    )
  }

  // ====== Responsive data ======

  /**
   * Responsive references to the current theme
   */
  get currentThemeRef() {
    return computed(() => this.currentTheme.value)
  }

  /**
   * Responsive quotes for all themes
   */
  get allThemesRef() {
    return computed(() => Array.from(this.themes.values()))
  }

  /**
   * Responsive quotes for custom themes
   */
  get customThemesRef() {
    return computed(() => Object.values(this.customThemes))
  }

  // ====== Clean up resources ======

  /**
   * Clean up resources
   */
  dispose(): void {
    this.themes.clear()
    Object.keys(this.customThemes).forEach(key => {
      delete this.customThemes[key]
    })
    this.currentTheme.value = null
  }
}

// ====== Combined functions ======

let themeManager: ThemeIntegrationManager | null = null

/**
 * Use theme integration
 */
export function useThemeIntegration() {
  if (!themeManager) {
    themeManager = new ThemeIntegrationManager()
  }

  return {
    // state
    currentTheme: themeManager.currentThemeRef,
    allThemes: themeManager.allThemesRef,
    customThemes: themeManager.customThemesRef,

    // method
    switchToTheme: themeManager.switchToTheme.bind(themeManager),
    switchToScheme: themeManager.switchToScheme.bind(themeManager),
    getCurrentTheme: themeManager.getCurrentTheme.bind(themeManager),
    getAllThemes: themeManager.getAllThemes.bind(themeManager),
    getThemesByCategory: themeManager.getThemesByCategory.bind(themeManager),
    getTheme: themeManager.getTheme.bind(themeManager),

    // Custom theme
    createCustomTheme: themeManager.createCustomTheme.bind(themeManager),
    updateCustomTheme: themeManager.updateCustomTheme.bind(themeManager),
    deleteCustomTheme: themeManager.deleteCustomTheme.bind(themeManager),

    // Apply theme
    applyThemeToContainer: themeManager.applyThemeToContainer.bind(themeManager),
    applyThemeToItems: themeManager.applyThemeToItems.bind(themeManager),

    // Import and export
    exportTheme: themeManager.exportTheme.bind(themeManager),
    importTheme: themeManager.importTheme.bind(themeManager),

    // clean up
    dispose: themeManager.dispose.bind(themeManager)
  }
}

/**
 * Reset theme manager
 */
export function resetThemeIntegration(): void {
  if (themeManager) {
    themeManager.dispose()
    themeManager = null
  }
}

export default ThemeIntegrationManager
