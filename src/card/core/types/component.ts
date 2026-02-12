/**
 * Component interface definition
 * Component architecture that implements separation of logic and views
 */

import type { RendererType, IDataNode, IComponentMeta } from './index'
import type { IRenderContext } from './renderer'

// Component logicHookinterface
export interface IComponentLogic<TProps = any, TData = any> {
  /** Hookfunction */
  (props: TProps): {
    /** processed data */
    data: TData
    /** Loading status */
    loading: boolean
    /** error message */
    error: Error | null
    /** Refresh data */
    refresh: () => void
    /** Update configuration */
    updateConfig: (config: Partial<TProps>) => void
    /** Other business logic methods */
    [key: string]: any
  }
}

// component view interface
export interface IComponentView<TProps = any> {
  /** Renderer type */
  rendererType: RendererType
  /** render function */
  render(props: TProps, context: IRenderContext): void | Promise<void>
  /** update function */
  update?(props: TProps, context: IRenderContext): void | Promise<void>
  /** destroy function */
  destroy?(context: IRenderContext): void | Promise<void>
  /** event handling */
  handleEvent?(event: Event, context: IRenderContext): void
}

// Component definition interface
export interface IComponentDefinition {
  /** Component metadata */
  meta: IComponentMeta
  /** logicHook */
  logic: IComponentLogic
  /** view mapping */
  views: {
    [K in RendererType]?: () => Promise<IComponentView>
  }
  /** Configure form components */
  configForm?: () => Promise<any>
  /** Default data node */
  defaultDataNode?: Partial<IDataNode>
}

// Component factory interface
export interface IComponentFactory {
  /** Create component instance */
  create(definition: IComponentDefinition, dataNode: IDataNode): Promise<IComponentInstance>
  /** Clone component instance */
  clone(instance: IComponentInstance): Promise<IComponentInstance>
  /** Destroy component instance */
  destroy(instance: IComponentInstance): Promise<void>
}

// Component instance interface (Extend basic interface)
export interface IComponentInstance {
  /** ExampleID */
  id: string
  /** Component definition */
  definition: IComponentDefinition
  /** data node */
  dataNode: IDataNode
  /** Current renderer type */
  currentRenderer?: RendererType
  /** logicHookExample */
  logicInstance?: any
  /** View instance */
  viewInstance?: IComponentView
  /** Has it been mounted? */
  mounted: boolean
  /** visible or not */
  visible: boolean

  /** Initialize component */
  init(rendererType: RendererType, context: IRenderContext): Promise<void>
  /** render component */
  render(context: IRenderContext): Promise<void>
  /** Update component */
  update(dataNode?: Partial<IDataNode>): Promise<void>
  /** Switch renderer */
  switchRenderer(rendererType: RendererType, context: IRenderContext): Promise<void>
  /** show/Hidden component */
  setVisible(visible: boolean): void
  /** Get component data */
  getData(): any
  /** Set component data */
  setData(data: any): void
  /** Get component properties */
  getProps(): any
  /** Set component properties */
  setProps(props: any): void
  /** Destroy component */
  destroy(): Promise<void>
  /** Export component state */
  exportState(): any
  /** Import component status */
  importState(state: any): void
}

// Component registry interface
export interface IComponentRegistry {
  /** Register component */
  register(definition: IComponentDefinition): void
  /** Unregister component */
  unregister(componentId: string): void
  /** Get component definition */
  getDefinition(componentId: string): IComponentDefinition | null
  /** Get all component definitions */
  getAllDefinitions(): IComponentDefinition[]
  /** Get components by type */
  getByType(type: string): IComponentDefinition[]
  /** Get components by renderer */
  getByRenderer(rendererType: RendererType): IComponentDefinition[]
  /** Check if the component exists */
  has(componentId: string): boolean
  /** Clear registry */
  clear(): void
}

// Component loader interface
export interface IComponentLoader {
  /** Dynamically load components */
  load(componentId: string): Promise<IComponentDefinition>
  /** Preload components */
  preload(componentIds: string[]): Promise<void>
  /** Uninstall components */
  unload(componentId: string): void
  /** Get loading status */
  getLoadingState(componentId: string): 'loading' | 'loaded' | 'error' | 'not-found'
  /** clear cache */
  clearCache(): void
}

// Component configuration interface
export interface IComponentConfig {
  /** componentsID */
  componentId: string
  /** Configuration data */
  config: Record<string, any>
  /** Configuration version */
  version: string
  /** Configuration description */
  description?: string
  /** creation time */
  createdAt: number
  /** Update time */
  updatedAt: number
}

// Component Configuration Manager Interface
export interface IComponentConfigManager {
  /** Save configuration */
  save(config: IComponentConfig): Promise<void>
  /** Load configuration */
  load(componentId: string, version?: string): Promise<IComponentConfig | null>
  /** Delete configuration */
  delete(componentId: string, version?: string): Promise<void>
  /** Get configuration history */
  getHistory(componentId: string): Promise<IComponentConfig[]>
  /** Restore configuration */
  restore(componentId: string, version: string): Promise<void>
}
