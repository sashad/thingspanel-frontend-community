/**
 * @file useEditor.ts
 * @description
 * Editor core Hook，Provide status management、Core functions such as component operations。
 * Used a unified WidgetRegistry to manage all components。
 */

import { inject, provide, watchEffect } from 'vue'
import { useEditorStore } from '@/components/visual-editor/store/editor'
import { useWidgetStore, type WidgetDefinition } from '@/components/visual-editor/store/widget'
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'
import { configRegistry } from '@/core/interaction-system'
// Data source registration removed
import type { GraphData, WidgetType } from '@/components/visual-editor/types'
import type { ComponentDefinition } from '@/card2.1/core2'

// Drag and drop data interface
export interface WidgetDragData {
  type: string
  name: string
  icon?: string
}

// Editor context interface
export interface EditorContext {
  editorStore: ReturnType<typeof useEditorStore>
  widgetStore: ReturnType<typeof useWidgetStore>
  stateManager: ReturnType<typeof useEditorStore> // stateManager Alias，point to editorStore
  addWidget: (type: string, position?: { x: number; y: number }) => Promise<void>
  selectNode: (id: string) => void
  updateNode: (id: string, updates: Partial<GraphData>) => void
  removeNode: (id: string) => void
  addNode: (...nodes: GraphData[]) => void
  getNodeById: (id: string) => GraphData | undefined
  card2Integration: ReturnType<typeof useCard2Integration>
  isCard2Component: (type: string) => boolean
}

// Do not automatically register basic components，Register onlyCard2.1components
// registerAllWidgets()

/**
 * Will Card2.1 The component definition is converted to WidgetDefinition Format
 */
function convertCard2ToWidgetDefinition(card2Definition: ComponentDefinition): WidgetDefinition {
  // Get default size
  const defaultSize = { width: 4, height: 3 }
  const canvasWidth = defaultSize.width * 120 // Each grid cell is approx.120px
  const canvasHeight = defaultSize.height * 80 // Each grid cell is approx.80px

  // from properties Extract default attribute values ​​from
  const defaultProperties: Record<string, any> = {}
  if (card2Definition.properties) {
    for (const [key, prop] of Object.entries(card2Definition.properties)) {
      if (typeof prop === 'object' && prop !== null && 'default' in prop) {
        defaultProperties[key] = (prop as any).default
      } else {
        defaultProperties[key] = prop
      }
    }
  }

  return {
    type: card2Definition.type,
    name: card2Definition.name,
    description: card2Definition.description || '',
    icon: card2Definition.icon || 'mdi:cube-outline',
    category: card2Definition.category || 'other',
    version: '2.1.0',
    defaultProperties,
    defaultLayout: {
      canvas: {
        width: canvasWidth,
        height: canvasHeight
      },
      gridstack: {
        w: defaultSize.width,
        h: defaultSize.height
      }
    },
    metadata: {
      isCard2Component: true,
      originalDefinition: card2Definition
    }
  }
}

// --- Editor Singleton ---
let editorInstance: EditorContext | null = null

export function createEditor() {
  const editorStore = useEditorStore()
  const widgetStore = useWidgetStore()
  const card2Integration = useCard2Integration({ autoInit: true })

  // ... (initialization Promise and watchEffect logic remains the same)
  let resolveInitialization: () => void
  const initialization = new Promise<void>(resolve => {
    resolveInitialization = resolve
  })

  let stopWatch: (() => void) | null = null

  stopWatch = watchEffect(() => {
    // Modify conditions：You can continue as long as it is not loading
    if (!card2Integration.isLoading.value) {
      // Clean the registry，only keepCard2.1components
      const allWidgets = widgetStore.getAllWidgets()

      allWidgets.forEach(widget => {
        if (!widget.metadata?.isCard2Component) {
          // Remove nonCard2.1components
          widgetStore.unregister(widget.type)
        }
      })
      // security check：make sure availableComponents exist and have value property
      const availableComponents = card2Integration.filteredComponents.value || []
      availableComponents.forEach(componentDef => {
        if (!widgetStore.getWidget(componentDef.type)) {
          // 🔥 repair：Handle it correctlyCard2.1configuration structure
          const defaultProperties: Record<string, any> = {}

          // examineconfigwhether it isCard2.1Format（havecustomizeField）
          if (componentDef.config && componentDef.config.customize) {
            // Card2.1Format：keep it structuredconfigused forcustomConfig
            if (process.env.NODE_ENV === 'development') {
            }
            // Do not put indefaultProperties，letCard2WrapperUse directlystructured config
          } else if (componentDef.config) {
            // flat format：put indefaultProperties
            Object.assign(defaultProperties, componentDef.config)
          }

          if (process.env.NODE_ENV === 'development') {
          }

          const widgetDef = {
            type: componentDef.type,
            name: componentDef.name,
            description: componentDef.description,
            version: componentDef.version,
            icon: componentDef.icon,
            category: componentDef.category,
            source: 'card2',
            defaultLayout: {
              canvas: { width: 300, height: 200 },
              gridstack: { w: 4, h: 4 }
            },
            defaultProperties,
            metadata: {
              isCard2Component: true,
              card2ComponentId: componentDef.type,
              card2Definition: componentDef // 🔥 repair：componentDefitself is the definition
            }
          }

          widgetStore.register(widgetDef)
          if (process.env.NODE_ENV === 'development') {
          }
          // 🔥 repair：Register configuration components to configRegistry
          if (componentDef.configComponent) {
            if (!configRegistry.has(componentDef.type)) {
              configRegistry.register(componentDef.type, componentDef.configComponent)
              if (process.env.NODE_ENV === 'development') {
              }
            }
          } else {
          }
        }
      })
      resolveInitialization()
      if (stopWatch) {
        stopWatch()
      }
    }
  })

  const getNodeById = (id: string) => {
    return editorStore.nodes.find(node => node.id === id)
  }

  const addWidget = async (type: string, position?: { x: number; y: number }) => {
    // force trigger availableWidgets calculate
    // If initialized Promise not yet parsed，manual trigger
    if (card2Integration.isLoading.value) {
      await card2Integration.initialize()
    }

    await initialization
    // First try from widgetStore Get traditional component definition
    let widgetDef = widgetStore.getWidget(type)
    let isCard2Component = false

    // If not found in traditional registry，Check if it is Card2.1 components
    if (!widgetDef) {
      // Check if it is card21- type of prefix
      let card2Type = type
      if (type.startsWith('card21-')) {
        card2Type = type.replace('card21-', '')
      }

      if (process.env.NODE_ENV === 'development') {
      }
      if (process.env.NODE_ENV === 'development') {
      }

      // Find the component definition of the specified type from the component list
      const card2Definition = card2Integration.filteredComponents.value?.find(comp => comp.type === card2Type)
      if (process.env.NODE_ENV === 'development') {
      }

      if (card2Definition) {
        isCard2Component = true
        // 🔥 repair：Handle it correctlyCard2.1configuration structure
        const defaultProperties: Record<string, any> = {}

        // examineconfigwhether it isCard2.1Format（havecustomizeField）
        if (card2Definition.config && card2Definition.config.customize) {
          // Card2.1Format：keep it structuredconfigused forcustomConfig
          if (process.env.NODE_ENV === 'development') {
          }
          // Do not put indefaultProperties，letCard2WrapperUse directlystructured config
        } else if (card2Definition.config) {
          // flat format：put indefaultProperties
          Object.assign(defaultProperties, card2Definition.config)
        }

        // fromlayoutGet the default size in configuration
        const defaultSize = card2Definition.layout?.defaultSize || { width: 4, height: 3 }

        widgetDef = {
          type: card2Definition.type,
          name: card2Definition.name,
          description: card2Definition.description,
          version: card2Definition.version,
          icon: card2Definition.icon,
          category: card2Definition.category,
          source: 'card2',
          defaultLayout: {
            canvas: {
              width: defaultSize.width * 120, // Each grid cell is approx.120px
              height: defaultSize.height * 80 // Each grid cell is approx.80px
            },
            gridstack: {
              w: defaultSize.width,
              h: defaultSize.height
            }
          },
          defaultProperties,
          metadata: {
            isCard2Component: true,
            card2ComponentId: card2Definition.type,
            card2Definition: card2Definition
          }
        }
        if (process.env.NODE_ENV === 'development') {
        }
      } else {
        console.error(`❌ [useEditor] Card2Component not found: ${card2Type}`)
        if (process.env.NODE_ENV === 'development') {
        }
      }
    }

    if (!widgetDef) {
      console.error(`❌ [Editor] Component type "${type}" Not registered。`)
      throw new Error(`Component type "${type}" Not registered。`)
    }

    // 🔥 repair：secure access defaultLayout，Provide default value
    const defaultLayout = widgetDef.defaultLayout || {
      canvas: { width: 300, height: 200 },
      gridstack: { w: 4, h: 4 }
    }
    const { w: newItemW, h: newItemH } = defaultLayout.gridstack

    if (process.env.NODE_ENV === 'development') {
    }
    const colNum = 12

    const { x, y } = findNextAvailablePosition(editorStore.nodes, newItemW, newItemH, colNum)
    const finalPos = position || { x, y }

    // repair：Correctly extract attribute values ​​instead of attribute definitions
    const defaultProperties: Record<string, any> = {}
    if (widgetDef.defaultProperties) {
      for (const [key, prop] of Object.entries(widgetDef.defaultProperties)) {
        if (typeof prop === 'object' && prop !== null && 'default' in prop) {
          // If it is a property definition object，extract default value
          defaultProperties[key] = (prop as any).default
        } else {
          // if already the value，Use directly
          defaultProperties[key] = prop
        }
      }
    }

    const node: GraphData = {
      id: `${type}_${Date.now()}`,
      type: widgetDef.type,
      x: finalPos.x,
      y: finalPos.y,
      width: defaultLayout.canvas.width,
      height: defaultLayout.canvas.height,
      label: widgetDef.name,
      showLabel: false,
      properties: defaultProperties, // Use the repaired property values
      renderer: ['canvas', 'gridstack'],
      layout: {
        canvas: { ...defaultLayout.canvas, ...finalPos },
        gridstack: { ...defaultLayout.gridstack, w: newItemW, h: newItemH, ...finalPos }
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: widgetDef.version,
        isCard2Component, // Is the mark Card2.1 components
        ...widgetDef.metadata
      },
      dataSource: null // The initial data source is empty
    }

    editorStore.addNode(node)
  }

  const selectNode = (id: string) => widgetStore.selectNodes([id])
  const updateNode = (id: string, updates: Partial<GraphData>) => editorStore.updateNode(id, updates)
  const removeNode = (id: string) => editorStore.removeNode(id)
  const addNode = (...nodes: GraphData[]) => editorStore.addNode(...nodes)

  editorInstance = {
    editorStore,
    widgetStore,
    stateManager: editorStore, // Add to stateManager Alias，point to editorStore
    addWidget,
    selectNode,
    updateNode,
    removeNode,
    addNode,
    getNodeById,
    card2Integration,
    // Check if it isCard2Component functions
    isCard2Component: (type: string) => {
      return card2Integration.filteredComponents.value?.some(comp => comp.type === type) || false
    }
  }

  return editorInstance
}

export function useEditor(): EditorContext {
  if (!editorInstance) {
    throw new Error('useEditor must be in createEditor Use after calling')
  }
  return editorInstance
}

function findNextAvailablePosition(
  nodes: GraphData[],
  newItemW: number,
  newItemH: number,
  colNum: number
): { x: number; y: number } {
  const grid: boolean[][] = []
  const maxRows =
    nodes.length > 0
      ? Math.max(...nodes.map(n => (n.layout?.gridstack?.y ?? 0) + (n.layout?.gridstack?.h ?? 0))) + newItemH
      : newItemH

  for (let i = 0; i < maxRows; i++) {
    grid[i] = new Array(colNum).fill(false)
  }

  nodes.forEach(node => {
    const { x, y, w, h } = node.layout?.gridstack || { x: 0, y: 0, w: 0, h: 0 }
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        if (r < maxRows && c < colNum) {
          grid[r][c] = true
        }
      }
    }
  })

  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c <= colNum - newItemW; c++) {
      let isVacant = true
      for (let i = 0; i < newItemH; i++) {
        for (let j = 0; j < newItemW; j++) {
          if (r + i >= maxRows || grid[r + i][c + j]) {
            isVacant = false
            break
          }
        }
        if (!isVacant) break
      }
      if (isVacant) {
        return { x: c, y: r }
      }
    }
  }

  const y =
    nodes.length > 0 ? Math.max(...nodes.map(n => (n.layout?.gridstack?.y ?? 0) + (n.layout?.gridstack?.h ?? 0))) : 0
  return { x: 0, y }
}
