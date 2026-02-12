/**
 * Data Adapter - data adapter
 * Used to adapt editor component data toPanelV2ofBaseCanvasItemstructure
 */

import type { BaseCanvasItem, Position } from '@/components/panelv2/types/core'
import { DEFAULT_CONSTRAINTS } from '@/components/panelv2/types/core'
import { generateId } from '@/components/panelv2/utils/id'
import type { WidgetType, TextWidgetConfig, ImageWidgetConfig } from '@/components/visual-editor/types'

/**
 * Generate default component configuration
 */
export const getDefaultWidgetConfig = (type: WidgetType): Record<string, any> => {
  switch (type) {
    case 'text':
      return {
        content: 'text content',
        fontSize: 14,
        color: 'var(--n-text-color)',
        textAlign: 'left',
        fontWeight: 'normal'
      } as TextWidgetConfig

    case 'image':
      return {
        src: '',
        alt: 'picture',
        objectFit: 'cover'
      } as ImageWidgetConfig

    default:
      return {}
  }
}

/**
 * Create from component typeBaseCanvasItem
 */
export const createCanvasItemFromWidget = (
  type: WidgetType,
  position: Position,
  customConfig?: Record<string, any>
): BaseCanvasItem => {
  const defaultConfig = getDefaultWidgetConfig(type)
  const config = { ...defaultConfig, ...customConfig }

  // Set default size based on type
  const getDefaultSize = (widgetType: WidgetType) => {
    switch (widgetType) {
      case 'text':
        return { width: 200, height: 40 }
      case 'image':
        return { width: 200, height: 150 }
      default:
        return { width: 200, height: 100 }
    }
  }

  return {
    id: generateId(),
    type: 'component',
    position,
    size: getDefaultSize(type),
    constraints: {
      ...DEFAULT_CONSTRAINTS,
      minWidth: type === 'text' ? 50 : 100,
      minHeight: type === 'text' ? 20 : 100
    },
    zIndex: 1,
    visible: true,
    locked: false,
    cardData: {
      cardId: type,
      title: `${type === 'text' ? 'text' : 'picture'}components`,
      type: 'chart',
      config
    },
    rendererData: {
      // Editor-specific data can be stored here
      editorType: 'visual-editor',
      widgetType: type
    },
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: '1.0.0'
    }
  }
}

/**
 * Update component configuration
 */
export const updateItemConfig = (item: BaseCanvasItem, configUpdates: Record<string, any>): BaseCanvasItem => {
  return {
    ...item,
    cardData: {
      ...item.cardData,
      config: {
        ...item.cardData.config,
        ...configUpdates
      }
    },
    metadata: {
      ...item.metadata,
      updatedAt: Date.now()
    }
  }
}

/**
 * Check if the component was created for the editor
 */
export const isEditorItem = (item: BaseCanvasItem): boolean => {
  return item.rendererData?.editorType === 'visual-editor'
}

/**
 * Get component type
 */
export const getWidgetType = (item: BaseCanvasItem): WidgetType | null => {
  if (isEditorItem(item)) {
    return (item.rendererData?.widgetType as WidgetType) || null
  }
  return null
}
