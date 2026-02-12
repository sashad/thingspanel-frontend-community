/**
 * Visual Editor Integrated configuration
 * for Card 2.1 Component provides standard configuration of editor integration
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { getAllComponents, getCategories } from '@/card2.1/index'

// ============ Editor component converter ============

/**
 * Card2Widget Interface definition（andVisual Editorcompatible）
 */
export interface Card2Widget {
  type: string
  name: string
  category: string
  icon: string
  description: string
  version?: string
  tags?: string[]

  // Editor layout configuration
  defaultLayout: {
    canvas: {
      width: number
      height: number
      x?: number
      y?: number
    }
    gridstack: {
      w: number // grid width
      h: number // grid height
      minW?: number
      minH?: number
      maxW?: number
      maxH?: number
    }
  }

  // Default property configuration
  defaultProperties: Record<string, any>

  // metadata
  metadata: {
    isCard2Component: boolean
    card2ComponentId: string
    card2Definition: ComponentDefinition
    supportedDataSources?: string[]
    examples?: Array<{
      name: string
      description: string
      config: Record<string, any>
    }>
  }
}

/**
 * Will Card 2.1 ComponentDefinition Convert to Visual Editor Widget
 * @param definition Card 2.1 Component definition
 * @returns Visual Editor Compatible component configurations
 */
export function convertToCard2Widget(definition: ComponentDefinition): Card2Widget {
  // Calculate default layout dimensions
  const defaultWidth = definition.config?.style?.width || definition.defaultSize?.width || 300
  const defaultHeight = definition.config?.style?.height || definition.defaultSize?.height || 200

  return {
    type: definition.type,
    name: definition.name,
    category: definition.mainCategory || definition.category,
    icon: definition.icon,
    description: definition.description,
    version: definition.version,
    tags: definition.tags,

    // Layout configuration conversion
    defaultLayout: {
      canvas: {
        width: defaultWidth,
        height: defaultHeight,
        x: 0,
        y: 0
      },
      gridstack: {
        w: Math.ceil(defaultWidth / 100), // Assume that each raster cell100pxWidth
        h: Math.ceil(defaultHeight / 100),
        minW: definition.minSize ? Math.ceil(definition.minSize.width / 100) : 2,
        minH: definition.minSize ? Math.ceil(definition.minSize.height / 100) : 2,
        maxW: 12,
        maxH: 8
      }
    },

    // Default property configuration
    defaultProperties: definition.config || {},

    // Component metadata
    metadata: {
      isCard2Component: true,
      card2ComponentId: definition.type,
      card2Definition: definition,
      supportedDataSources: definition.supportedDataSources,
      examples: definition.examples
    }
  }
}

// ============ Available component conversions ============

/**
 * all Card 2.1 component Visual Editor Compatible configurations
 */
export const AvailableCard2Widgets: Card2Widget[] = Object.values(Card2ComponentMap).map(convertToCard2Widget)

/**
 * Component configuration organized by category
 */
export const Card2WidgetsByCategory: Record<string, Card2Widget[]> = Object.fromEntries(
  Object.entries(Card2Components).map(([category, definitions]) => [category, definitions.map(convertToCard2Widget)])
)

// ============ Editor integrated tool functions ============

/**
 * Get based on component type Widget Configuration
 * @param type Component type
 * @returns Widget configure or undefined
 */
export function getCard2Widget(type: string): Card2Widget | undefined {
  const definition = Card2ComponentMap[type]
  return definition ? convertToCard2Widget(definition) : undefined
}

/**
 * Check if it is Card 2.1 components
 * @param type Component type
 * @returns Is it Card 2.1 components
 */
export function isCard2Component(type: string): boolean {
  return type in Card2ComponentMap
}

/**
 * Get the original component Card 2.1 definition
 * @param type Component type
 * @returns Original component definition
 */
export function getCard2Definition(type: string): ComponentDefinition | undefined {
  return Card2ComponentMap[type]
}

/**
 * Filter components based on supported data source types
 * @param dataSourceType Data source type
 * @returns List of components that support this data source
 */
export function getWidgetsByDataSource(dataSourceType: string): Card2Widget[] {
  return AvailableCard2Widgets.filter(widget => widget.metadata.supportedDataSources?.includes(dataSourceType))
}

// ============ Editor integration configuration ============

/**
 * Visual Editor Integrated master configuration
 */
export const VisualEditorIntegrationConfig = {
  // Component related
  widgets: AvailableCard2Widgets,
  categories: Card2WidgetsByCategory,
  componentCount: ComponentStats.total,

  // Utility function
  getWidget: getCard2Widget,
  isCard2Component,
  getDefinition: getCard2Definition,
  getWidgetsByDataSource,

  // Editor specific configuration
  editorSettings: {
    // Palette title
    panelTitle: 'Card 2.1 components',

    // Default component size
    defaultComponentSize: {
      width: 300,
      height: 200
    },

    // Grid system configuration
    gridConfig: {
      cellHeight: 100,
      cellWidth: 100,
      // Default no spacing：from [10, 10] Adjust to [0, 0]
      margin: [0, 0],
      outerMargin: true,
      resizable: true,
      draggable: true
    },

    // Supported renderers
    supportedRenderers: ['canvas', 'gridstack', 'grid-layout-plus'],

    // Component preview settings
    previewSettings: {
      showInteractionIndicator: true,
      enableDebugMode: true,
      autoStartDataSimulator: true
    }
  },

  // Version information
  version: '2.1.0',
  compatibleEditorVersions: ['>=1.0.0'],

  // Statistics
  stats: ComponentStats
}

// ============ Default export ============

export default VisualEditorIntegrationConfig
