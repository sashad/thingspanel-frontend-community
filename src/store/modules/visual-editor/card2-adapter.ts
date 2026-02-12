/**
 * Card 2.1 Visual Editor adapter
 * unifiedCard2.1System andVisual EditorIntegration，Addressing integration complexity
 */

import { useUnifiedEditorStore } from '@/store/modules/visual-editor/unified-editor'
import { useDataFlowManager } from '@/store/modules/visual-editor/data-flow-manager'
import type { WidgetDefinition, DataSourceConfiguration, ComponentConfiguration } from '@/store/modules/visual-editor/unified-editor'

// Card 2.1 Related type definitions
export interface ComponentDefinition {
  type: string
  name: string
  description: string
  version: string
  component: any
  category: string
  mainCategory: string
  subCategory: string
  icon: string
  author: string
  permission: string
  tags?: string[]
  dataSources?: DataSourceDefinition[]
  config?: ComponentConfig
}

export interface DataSourceDefinition {
  key: string
  name: string
  description: string
  supportedTypes: string[]
  required: boolean
  fieldMappings?: Record<string, FieldMapping>
}

export interface FieldMapping {
  targetField: string
  type: string
  required: boolean
  description: string
  defaultValue?: any
}

export interface ComponentConfig {
  width?: number
  height?: number
  style?: Record<string, any>
  properties?: Record<string, any>
}

export interface ReactiveDataBinding {
  id: string
  componentId: string
  requirement: ComponentRequirement
  isActive: boolean
  lastUpdate: Date
}

export interface ComponentRequirement {
  [key: string]: any
}

/**
 * Card 2.1 Adapter class
 * 🔥 unifiedCard2.1andVisual EditorIntegration，Eliminate complex conversion logic
 */
export class Card2VisualEditorAdapter {
  private editorStore = useUnifiedEditorStore()
  private dataFlowManager = useDataFlowManager()
  private card2System: any = null // Card 2.1 System instance

  constructor() {
    this.initializeCard2Integration()
  }

  // ==================== Card 2.1 System integration ====================

  /**
   * initializationCard2.1integrated
   */
  private async initializeCard2Integration(): Promise<void> {
    try {
      // dynamic loadingCard2.1system（Avoid circular dependencies）
      const { useComponentTree } = await import('@/card2.1/hooks')
      this.card2System = useComponentTree({ autoInit: false }) // set tofalse，Manual control initialization

      // Initialize immediately
      await this.card2System.initialize()
    } catch (error) {}
  }

  /**
   * registerCard2.1component toVisual Editor
   */
  registerCard2Component(definition: ComponentDefinition): void {
    // 1. Convert toVisual EditorFormat
    const widgetDefinition = this.adaptComponentDefinition(definition)

    // 2. Register to unified storage
    this.editorStore.registerWidget(widgetDefinition)
    this.editorStore.registerCard2Component(definition)
  }

  /**
   * Batch registrationCard2.1components
   */
  registerCard2Components(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => this.registerCard2Component(def))
  }

  // ==================== Component definition conversion ====================

  /**
   * ConvertCard2.1The component is defined asVisual EditorFormat
   * 🔥 Unified component definition conversion logic
   */
  private adaptComponentDefinition(card2Def: ComponentDefinition): WidgetDefinition {
    return {
      type: card2Def.type,
      name: card2Def.name,
      description: card2Def.description,
      version: card2Def.version,
      component: card2Def.component,

      // Classified information
      category: card2Def.category,
      mainCategory: card2Def.mainCategory,
      subCategory: card2Def.subCategory,
      icon: card2Def.icon,

      // Author and permissions
      author: card2Def.author,
      permission: card2Def.permission,
      tags: card2Def.tags || [],

      // Standardized default layout
      defaultLayout: this.createStandardLayout(card2Def),

      // Standardized attribute configuration
      defaultProperties: this.extractDefaultProperties(card2Def),

      // Data source configuration
      dataSources: this.adaptDataSources(card2Def.dataSources || []),

      // Adapter metadata
      metadata: {
        source: 'card2',
        adapter: 'Card2VisualEditorAdapter',
        adapterVersion: '1.0.0',
        originalDefinition: card2Def,
        isCard2Component: true,
        hasDataSources: (card2Def.dataSources?.length || 0) > 0,
        createdAt: new Date().toISOString()
      }
    }
  }

  /**
   * Create a standardized default layout
   */
  private createStandardLayout(card2Def: ComponentDefinition): Record<string, any> {
    const config = card2Def.config || {}
    const defaultWidth = config.width || 300
    const defaultHeight = config.height || 200

    return {
      canvas: {
        width: defaultWidth,
        height: defaultHeight,
        x: 0,
        y: 0
      },
      gridstack: {
        w: Math.ceil(defaultWidth / 150), // Convert to grid units
        h: Math.ceil(defaultHeight / 150),
        x: 0,
        y: 0,
        minW: 1,
        minH: 1
      },
      gridLayoutPlus: {
        w: Math.ceil(defaultWidth / 100),
        h: Math.ceil(defaultHeight / 100),
        x: 0,
        y: 0
      }
    }
  }

  /**
   * Extract default property configuration
   */
  private extractDefaultProperties(card2Def: ComponentDefinition): ComponentConfiguration {
    const config = card2Def.config || {}

    return {
      properties: config.properties || {},
      style: {
        width: config.width || 300,
        height: config.height || 200,
        ...config.style
      },
      events: {}
    }
  }

  /**
   * Adapt data source definition
   */
  private adaptDataSources(dataSources: DataSourceDefinition[]): DataSourceDefinition[] {
    return dataSources.map(ds => ({
      ...ds,
      // Ensure the integrity of the data source configuration
      supportedTypes: ds.supportedTypes.length > 0 ? ds.supportedTypes : ['static'],
      fieldMappings: ds.fieldMappings || {}
    }))
  }

  // ==================== Data binding integration ====================

  /**
   * createCard2.1data binding
   * 🔥 Unified data binding creation logic
   */
  async createDataBinding(
    widgetId: string,
    dataSourceConfig: DataSourceConfiguration
  ): Promise<ReactiveDataBinding | null> {
    if (!this.card2System) {
      return null
    }

    try {
      // 1. Get component definition
      const card2Definition = this.editorStore.card2Components.get(widgetId)
      if (!card2Definition) {
        return null
      }

      // 2. Create component requirements
      const requirement = this.createComponentRequirement(card2Definition, dataSourceConfig)

      // 3. Register to Requirements Manager（if available）
      // Notice：Use what is actually availableAPI
      // 4. Create data binding
      const binding: ReactiveDataBinding = {
        id: `${widgetId}_binding`,
        componentId: widgetId,
        requirement,
        isActive: true,
        lastUpdate: new Date()
      }

      // 5. Store to unified state
      this.editorStore.createDataBinding(widgetId, binding)
      return binding
    } catch (error) {
      return null
    }
  }

  /**
   * renewCard2.1data binding
   */
  async updateDataBinding(widgetId: string, dataSourceConfig: DataSourceConfiguration): Promise<void> {
    // Delete old binding
    this.destroyDataBinding(widgetId)

    // Create new binding
    await this.createDataBinding(widgetId, dataSourceConfig)
  }

  /**
   * destroyCard2.1data binding
   */
  destroyDataBinding(widgetId: string): void {
    // Remove from unified status
    this.editorStore.dataBindings.delete(widgetId)
  }

  /**
   * Create component requirement definitions
   */
  private createComponentRequirement(
    card2Definition: ComponentDefinition,
    dataSourceConfig: DataSourceConfiguration
  ): ComponentRequirement {
    const requirement: ComponentRequirement = {}

    // Create requirements based on the component's data source definition
    if (card2Definition.dataSources) {
      card2Definition.dataSources.forEach(ds => {
        // Check whether there is a corresponding data source configuration
        const configBinding = dataSourceConfig.bindings?.[ds.key]
        if (configBinding) {
          requirement[ds.key] = {
            type: 'object', // Simplified type handling
            required: ds.required,
            description: ds.description,
            mapping: ds.fieldMappings || {},
            defaultValue: this.extractDefaultValue(ds),
            config: configBinding
          }
        }
      })
    }

    return requirement
  }

  /**
   * Extract default value
   */
  private extractDefaultValue(dataSource: DataSourceDefinition): any {
    if (dataSource.fieldMappings) {
      const firstMapping = Object.values(dataSource.fieldMappings)[0]
      return firstMapping?.defaultValue || null
    }
    return null
  }

  // ==================== Runtime data processing ====================

  /**
   * deal withCard2.1Runtime data updates for components
   */
  handleRuntimeDataUpdate(widgetId: string, data: any): void {
    // Update runtime data via Data Flow Manager
    this.dataFlowManager.handleUserAction({
      type: 'SET_RUNTIME_DATA',
      targetId: widgetId,
      data
    })
  }

  /**
   * GetCard2.1The current data of the component
   */
  getComponentCurrentData(widgetId: string): any {
    const runtimeData = this.editorStore.getRuntimeData(widgetId)

    return runtimeData
  }

  // ==================== life cycle management ====================

  /**
   * Processing when components are added to the canvas
   */
  onComponentAdded(widgetId: string, componentType: string): void {
    // Check if it isCard2.1components
    const card2Definition = this.editorStore.card2Components.get(componentType)
    if (card2Definition) {
      // initializationCard2.1The default configuration of the component
      this.initializeCard2ComponentConfig(widgetId, card2Definition)
    }
  }

  /**
   * Handling when a component is removed from the canvas
   */
  onComponentRemoved(widgetId: string): void {
    // clean upCard2.1Related resources
    this.destroyDataBinding(widgetId)
  }

  /**
   * initializationCard2.1Component configuration
   */
  private initializeCard2ComponentConfig(widgetId: string, card2Definition: ComponentDefinition): void {
    // Set default component configuration
    const defaultConfig = this.extractDefaultProperties(card2Definition)
    this.editorStore.setComponentConfiguration(widgetId, defaultConfig)

    // If there is a data source definition，Create a default data source configuration
    if (card2Definition.dataSources && card2Definition.dataSources.length > 0) {
      const defaultDataSourceConfig: DataSourceConfiguration = {
        type: 'static',
        config: {},
        bindings: this.createDefaultBindings(card2Definition.dataSources)
      }

      this.editorStore.setDataSourceConfiguration(widgetId, defaultDataSourceConfig)
    }
  }

  /**
   * Create default data binding
   */
  private createDefaultBindings(dataSources: DataSourceDefinition[]): Record<string, any> {
    const bindings: Record<string, any> = {}

    dataSources.forEach(ds => {
      if (ds.fieldMappings) {
        const firstMapping = Object.values(ds.fieldMappings)[0]
        if (firstMapping?.defaultValue !== undefined) {
          bindings[ds.key] = {
            rawData: JSON.stringify(firstMapping.defaultValue)
          }
        }
      }
    })

    return bindings
  }

  // ==================== Tool method ====================

  /**
   * 检查components是否为Card2.1components
   */
  isCard2Component(widgetId: string): boolean {
    return this.editorStore.card2Components.has(widgetId)
  }

  /**
   * Get all registeredCard2.1components
   */
  getAllCard2Components(): ComponentDefinition[] {
    return Array.from(this.editorStore.card2Components.values())
  }

  /**
   * GetCard2.1Number of components
   */
  getCard2ComponentCount(): number {
    return this.editorStore.card2ComponentCount
  }

  /**
   * make sureCard2.1System has been initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (this.card2System) {
      return // Already initialized
    }
    // Wait for some time for asynchronous initialization to complete
    let retries = 0
    const maxRetries = 50 // most wait5Second

    while (!this.card2System && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100))
      retries++
    }

    if (!this.card2System) {
      // Try to reinitialize
      await this.initializeCard2Integration()
    }
  }

  /**
   * GetCard2.1Component instance
   * 🔥 entrusted toCard2.1systematicgetComponentmethod
   */
  async getComponent(componentType: string): Promise<any> {
    // Wait for initialization to complete
    await this.ensureInitialized()

    if (!this.card2System) {
      return null
    }

    try {
      return this.card2System.getComponent(componentType)
    } catch (error) {
      return null
    }
  }

  /**
   * GetCard2.1Component definition
   * 🔥 entrusted toCard2.1systematicgetComponentDefinitionmethod
   */
  getComponentDefinition(componentType: string): any {
    if (!this.card2System) {
      return null
    }

    try {
      return this.card2System.getComponentDefinition(componentType)
    } catch (error) {
      return null
    }
  }

  /**
   * GetCard2.1System instance
   */
  getCard2System(): any {
    return this.card2System
  }
}

// ==================== Singleton pattern ====================

let card2AdapterInstance: Card2VisualEditorAdapter | null = null

/**
 * GetCard2.1adapter instance（Singleton）
 */
export function useCard2Adapter(): Card2VisualEditorAdapter {
  if (!card2AdapterInstance) {
    card2AdapterInstance = new Card2VisualEditorAdapter()
  }

  return card2AdapterInstance
}

/**
 * resetCard2.1adapter instance（for testing）
 */
export function resetCard2Adapter(): void {
  card2AdapterInstance = null
}
