# Dynamic parameter binding system implementation plan

## Project background

based on existing `DynamicParameterEditor.vue` components，Implement a complete dynamic parameter binding system。该系统允许components属性与HTTPBind the dynamic parameters of the request，当components属性变化时，Automatically trigger newHTTPrequest execution。

## core needs

1. **Property binding mechanism**：Component properties can be bound toHTTPdynamic parameters（headers、query、pathwait）
2. **Real-time update trigger**：Automatically update the configuration when attributes change and trigger the executor to re-execute
3. **Multiple data sources support**：Manage dynamic parameter binding by data source and interface classification
4. **default value mechanism**：Use default value when attribute has no value，Use the attribute value if it has a value
5. **Configure persistence**：Binding configuration needs to be saved and restored

## Technical architecture

### 1. Analysis of existing infrastructure components

**DynamicParameterEditor.vue** provided：
- Parameter template system（Manual entry、drop down selection、Property binding）
- `ParameterTemplateType.PROPERTY` Mode support
- `EnhancedParameter` The interface contains `valueMode`、`variableName`、`description` Field
- Property binding configurationUIinterface

### 2. System architecture design

```
Dynamic parameter binding system architecture
├── DynamicParameterEditor.vue      # Parameter editor（Already，Need to be enhanced）
├── ParameterBindingManager.ts      # core binding manager（New）
├── ComponentPropertyExposer.ts     # Component property exposer（New）
├── ConfigurationChangeNotifier.ts  # Configuration change notifier（New）
├── DataItemFetcher.ts              # actuator（Need to enhance dynamic analysis）
└── integration point
    ├── HttpConfigForm.vue          # HTTPConfigure form integration
    ├── Card2.1 attribute system           # Card attribute exposure interface
    └── Visual Editor integrated         # Get editor component properties
```

## Detailed implementation plan

### stage1：enhance existing DynamicParameterEditor

#### 1.1 Expand EnhancedParameter interface

```typescript
// exist DynamicParameterEditor.vue Medium expansion interface
interface EnhancedParameter {
  key: string
  value: string | number | boolean
  enabled: boolean
  valueMode: ParameterTemplateType
  selectedTemplate?: string
  variableName?: string
  description?: string
  dataType: 'string' | 'number' | 'boolean' | 'json'
  
  // New：Attribute binding related fields
  bindingInfo?: {
    componentId?: string           // bound componentsID
    propertyPath?: string          // Property path（like 'config.deviceId'）
    propertyType?: string          // Property type
    fallbackValue?: any           // Fallback to default
    isActive?: boolean            // Is the binding activated?
  }
}
```

#### 1.2 Attribute selector component

```typescript
// Added component attribute selection logic
const availableProperties = computed(() => {
  if (!props.componentId) return []
  return getComponentProperties(props.componentId)
})

const onPropertyBinding = (param: EnhancedParameter, propertyPath: string) => {
  const updatedParam = { ...param }
  updatedParam.bindingInfo = {
    componentId: props.componentId,
    propertyPath,
    isActive: true,
    fallbackValue: param.value
  }
  // Registration binding is related to ParameterBindingManager
  parameterBindingManager.registerBinding(param.key, updatedParam.bindingInfo)
  updateParameter(updatedParam, index)
}
```

#### 1.3 UIInterface enhancement

```vue
<!-- Property binding modeUIEnhance -->
<div v-if="param.valueMode === 'property'" class="property-binding-config">
  <n-space vertical size="small">
    <!-- existingUIremain unchanged -->
    <div class="binding-info">
      <n-tag size="small" type="info">Property binding - Dynamically obtain values ​​at runtime</n-tag>
    </div>
    
    <!-- New：attribute selector -->
    <n-space align="center" size="small">
      <n-text depth="3" style="font-size: 11px; width: 60px">Binding properties:</n-text>
      <n-select
        :value="param.bindingInfo?.propertyPath"
        :options="availableProperties"
        placeholder="Select the component properties to bind"
        size="small"
        style="flex: 1"
        @update:value="path => onPropertyBinding(param, path)"
      />
    </n-space>
    
    <!-- New：Binding status display -->
    <n-space align="center" size="small" v-if="param.bindingInfo?.isActive">
      <n-text depth="3" style="font-size: 11px; width: 60px">current value:</n-text>
      <n-tag size="small" :type="getBindingValueType(param)">
        {{ getCurrentBindingValue(param) || 'Use default value' }}
      </n-tag>
    </n-space>
  </n-space>
</div>
```

### stage2：Core binding management system

#### 2.1 ParameterBindingManager.ts

```typescript
/**
 * Parameter binding manager
 * Responsible for managing component properties andHTTPParameter binding relationship
 */
export class ParameterBindingManager {
  private bindingRegistry = new Map<string, BindingConfiguration>()
  private propertyWatchers = new Map<string, WatchStopHandle>()
  private configurationNotifier: ConfigurationChangeNotifier
  
  constructor() {
    this.configurationNotifier = new ConfigurationChangeNotifier()
  }
  
  /**
   * Register parameter binding
   */
  registerBinding(
    parameterId: string, 
    componentId: string, 
    propertyPath: string,
    fallbackValue: any
  ): void {
    const binding: BindingConfiguration = {
      parameterId,
      componentId,
      propertyPath,
      fallbackValue,
      isActive: true
    }
    
    this.bindingRegistry.set(parameterId, binding)
    this.setupPropertyWatch(binding)
  }
  
  /**
   * Set property monitoring
   */
  private setupPropertyWatch(binding: BindingConfiguration): void {
    const component = this.getComponentInstance(binding.componentId)
    if (!component) return
    
    const stopWatcher = watch(
      () => this.getNestedProperty(component, binding.propertyPath),
      (newValue) => {
        this.onPropertyChange(binding.parameterId, newValue)
      },
      { immediate: true, deep: true }
    )
    
    this.propertyWatchers.set(binding.parameterId, stopWatcher)
  }
  
  /**
   * Property change processing
   */
  private onPropertyChange(parameterId: string, newValue: any): void {
    const binding = this.bindingRegistry.get(parameterId)
    if (!binding) return
    
    const effectiveValue = newValue !== undefined ? newValue : binding.fallbackValue
    
    // Notify configuration changes
    this.configurationNotifier.notifyParameterChange(parameterId, effectiveValue)
  }
  
  /**
   * Get the current binding value
   */
  getCurrentBindingValue(parameterId: string): any {
    const binding = this.bindingRegistry.get(parameterId)
    if (!binding) return undefined
    
    const component = this.getComponentInstance(binding.componentId)
    if (!component) return binding.fallbackValue
    
    const propertyValue = this.getNestedProperty(component, binding.propertyPath)
    return propertyValue !== undefined ? propertyValue : binding.fallbackValue
  }
  
  /**
   * Unbind
   */
  unregisterBinding(parameterId: string): void {
    const watcher = this.propertyWatchers.get(parameterId)
    if (watcher) {
      watcher()
      this.propertyWatchers.delete(parameterId)
    }
    this.bindingRegistry.delete(parameterId)
  }
  
  /**
   * Get component instance（Need andCard2.1System integration）
   */
  private getComponentInstance(componentId: string): any {
    // TODO: andCard2.1System integration，Get component instance
    return getCard2ComponentInstance(componentId)
  }
  
  /**
   * Get nested attribute values
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}

// global instance
export const parameterBindingManager = new ParameterBindingManager()
```

#### 2.2 ConfigurationChangeNotifier.ts

```typescript
/**
 * Configuration change notifier
 * Responsible for notifying relevant system configurations that have been changed，Trigger re-execution
 */
export class ConfigurationChangeNotifier {
  private changeListeners = new Map<string, Set<(value: any) => void>>()
  
  /**
   * Register configuration change monitoring
   */
  onParameterChange(parameterId: string, callback: (value: any) => void): void {
    if (!this.changeListeners.has(parameterId)) {
      this.changeListeners.set(parameterId, new Set())
    }
    this.changeListeners.get(parameterId)!.add(callback)
  }
  
  /**
   * Notify parameter changes
   */
  notifyParameterChange(parameterId: string, newValue: any): void {
    const listeners = this.changeListeners.get(parameterId)
    if (listeners) {
      listeners.forEach(callback => callback(newValue))
    }
    
    // Trigger global configuration re-execution
    this.triggerConfigurationReexecution(parameterId, newValue)
  }
  
  /**
   * Trigger configuration re-execution
   */
  private triggerConfigurationReexecution(parameterId: string, newValue: any): void {
    // Find all that contain this parameterHTTPConfiguration
    const affectedConfigurations = this.findAffectedConfigurations(parameterId)
    
    affectedConfigurations.forEach(config => {
      // Update parameter values ​​in configuration
      this.updateConfigurationParameter(config, parameterId, newValue)
      
      // triggerDataItemFetcherRe-execute
      this.triggerDataItemRefetch(config)
    })
  }
  
  /**
   * Find affected configurations
   */
  private findAffectedConfigurations(parameterId: string): HttpConfig[] {
    // TODO: Implement configuration lookup logic
    // Need to maintain parametersIDmapping to configuration
    return []
  }
  
  /**
   * Update configuration parameter values
   */
  private updateConfigurationParameter(
    config: HttpConfig, 
    parameterId: string, 
    newValue: any
  ): void {
    // renewheadersParameters in
    if (config.headers) {
      Object.keys(config.headers).forEach(key => {
        if (this.isParameterReference(config.headers![key], parameterId)) {
          config.headers![key] = String(newValue)
        }
      })
    }
    
    // renewqueryparameter
    if (config.params) {
      config.params.forEach(param => {
        if (param.variableName === parameterId) {
          param.value = newValue
        }
      })
    }
    
    // Update path parameters
    if (config.pathParameter?.variableName === parameterId) {
      config.pathParameter.value = newValue
    }
  }
  
  /**
   * Trigger data item re-fetching
   */
  private triggerDataItemRefetch(config: HttpConfig): void {
    // TODO: andDataItemFetcherintegrated，Trigger re-execution
    console.log('🔄 Configuration changes trigger re-execution:', config)
  }
  
  /**
   * Check if it is a parameter reference
   */
  private isParameterReference(value: string, parameterId: string): boolean {
    // Simple parameter reference checking logic
    return value.includes(`{${parameterId}}`)
  }
}
```

### stage3：Component property exposure system

#### 3.1 ComponentPropertyExposer.ts

```typescript
/**
 * Component property exposer
 * Responsible forCard2.1Expose bindable properties in components
 */
export class ComponentPropertyExposer {
  /**
   * Get component bindable properties
   */
  getComponentProperties(componentId: string): PropertyDescriptor[] {
    const component = this.getComponentInstance(componentId)
    if (!component) return []
    
    const definition = this.getComponentDefinition(componentId)
    if (!definition) return []
    
    // plan1：Based on component definitionpropertiesstatement
    if (definition.properties) {
      return this.extractFromProperties(definition.properties)
    }
    
    // plan2：Based on the actual properties of the component（runtime reflection）
    return this.extractFromInstance(component)
  }
  
  /**
   * frompropertiesDefine extraction properties
   */
  private extractFromProperties(properties: Record<string, any>): PropertyDescriptor[] {
    return Object.entries(properties).map(([key, prop]) => ({
      path: key,
      label: prop.label || key,
      type: prop.type,
      description: prop.description,
      category: 'config'
    }))
  }
  
  /**
   * Extract properties from component instance
   */
  private extractFromInstance(component: any): PropertyDescriptor[] {
    const properties: PropertyDescriptor[] = []
    
    // extractconfigproperty
    if (component.config) {
      Object.keys(component.config).forEach(key => {
        properties.push({
          path: `config.${key}`,
          label: key,
          type: typeof component.config[key],
          category: 'config'
        })
      })
    }
    
    // Extract other available properties
    const excludeKeys = ['config', '$el', '$parent', '$root']
    Object.keys(component).forEach(key => {
      if (!excludeKeys.includes(key) && !key.startsWith('_')) {
        properties.push({
          path: key,
          label: key,
          type: typeof component[key],
          category: 'runtime'
        })
      }
    })
    
    return properties
  }
  
  private getComponentInstance(componentId: string): any {
    // TODO: andCard2.1System integration
    return null
  }
  
  private getComponentDefinition(componentId: string): any {
    // TODO: andCard2.1System integration
    return null
  }
}

interface PropertyDescriptor {
  path: string
  label: string
  type: string
  description?: string
  category: 'config' | 'runtime'
}

export const componentPropertyExposer = new ComponentPropertyExposer()
```

### stage4：DataItemFetcherEnhance

#### 4.1 Dynamic parameter parsing enhancement

```typescript
// exist DataItemFetcher.ts Medium enhancement
private async fetchHttpData(config: HttpDataItemConfig): Promise<any> {
  try {
    // Existing logic remains unchanged...
    
    // New：Dynamic parameter parsing steps
    const resolvedConfig = await this.resolveDynamicParameters(config)
    
    // Continue execution using the parsed configuration...
    // ... Existing request logic
    
  } catch (error) {
    console.error('DataItemFetcher: HTTPData acquisition failed', error)
    return {}
  }
}

/**
 * Parse dynamic parameters
 */
private async resolveDynamicParameters(config: HttpDataItemConfig): Promise<HttpDataItemConfig> {
  const resolvedConfig = { ...config }
  
  // Parse path parameters
  if (resolvedConfig.pathParameter?.variableName) {
    const bindingValue = parameterBindingManager.getCurrentBindingValue(
      resolvedConfig.pathParameter.variableName
    )
    if (bindingValue !== undefined) {
      resolvedConfig.pathParameter.value = bindingValue
    }
  }
  
  // parseheadersdynamic parameters in
  if (resolvedConfig.headers) {
    Object.keys(resolvedConfig.headers).forEach(key => {
      const headerValue = resolvedConfig.headers![key]
      if (typeof headerValue === 'string' && headerValue.includes('{')) {
        resolvedConfig.headers![key] = this.interpolateValue(headerValue)
      }
    })
  }
  
  // parsequeryparameter
  if (resolvedConfig.params) {
    resolvedConfig.params = resolvedConfig.params.map(param => {
      if (param.variableName) {
        const bindingValue = parameterBindingManager.getCurrentBindingValue(param.variableName)
        if (bindingValue !== undefined) {
          return { ...param, value: bindingValue }
        }
      }
      return param
    })
  }
  
  console.log('🔧 [HTTPrequester] Dynamic parameter analysis completed:', {
    original configuration: config,
    Configure after parsing: resolvedConfig
  })
  
  return resolvedConfig
}

/**
 * Interpolation analysis
 */
private interpolateValue(template: string): string {
  return template.replace(/\{(\w+)\}/g, (match, variableName) => {
    const bindingValue = parameterBindingManager.getCurrentBindingValue(variableName)
    return bindingValue !== undefined ? String(bindingValue) : match
  })
}
```

### stage5：HttpConfigFormintegrated

#### 5.1 Pass in componentID

```vue
<!-- HttpConfigForm.vue Enhance -->
<script setup lang="ts">
interface Props {
  modelValue: HttpConfig
  // New：componentsIDfor property binding
  componentId?: string
}

const props = withDefaults(defineProps<Props>(), {
  componentId: undefined
})
</script>

<template>
  <!-- existDynamicParameterEditorincomingcomponentId -->
  <DynamicParameterEditor
    v-model="httpConfig.params"
    parameter-type="query"
    title="query parameters"
    :component-id="props.componentId"
    @parameter-binding-change="onParameterBindingChange"
  />
  
  <DynamicParameterEditor
    v-model="httpConfig.headers"
    parameter-type="header"
    title="Request header"
    :component-id="props.componentId"
    @parameter-binding-change="onParameterBindingChange"
  />
</template>
```

#### 5.2 Binding change handling

```typescript
/**
 * Handle parameter binding changes
 */
const onParameterBindingChange = (parameterId: string, bindingInfo: any) => {
  console.log('Parameter binding changes:', { parameterId, bindingInfo })
  
  // Additional processing logic can be added here
  // For example：Save configuration、Verify binding etc.
}
```

### stage6：Card2.1System integration

#### 6.1 Component property declaration specification

```typescript
// Card2.1Components need to declare bindable properties
export const MyCard2Component: ComponentDefinition = {
  type: 'my-component',
  name: 'my component',
  // ... Other definitions
  
  // New：Bindable property declaration
  bindableProperties: {
    deviceId: {
      type: 'string',
      label: 'equipmentID',
      description: 'Currently selected deviceID',
      category: 'config'
    },
    selectedMetric: {
      type: 'string',
      label: 'selected indicator',
      description: 'User-selected metric name',
      category: 'runtime'
    }
  }
}
```

## Implementation timing

### Phase 1: Basic enhancement (1-2sky)
- [ ] Enhance `DynamicParameterEditor.vue` ofUIand interface
- [ ] accomplish `ParameterBindingManager` core class
- [ ] Basic attribute binding registration and monitoring mechanism

### Phase 2: core system (2-3sky)  
- [ ] Complete `ConfigurationChangeNotifier` 
- [ ] accomplish `ComponentPropertyExposer`
- [ ] DataItemFetcherDynamic parameter parsing integration

### Phase 3: Integration testing (1-2sky)
- [ ] HttpConfigFormIntegration testing
- [ ] End-to-end binding process testing
- [ ] Card2.1System integration verification

### Phase 4: Optimization and documentation (1sky)
- [ ] Performance optimization and error handling
- [ ] User documentation and sample code
- [ ] Unit testing supplement

## Technical details and considerations

### 1. Memory management
- Property listeners need to be cleaned up when the component is destroyed
- Avoid memory leaks caused by circular references

### 2. Performance optimization
- Throttling of attribute listening/Anti-shake processing
- Batch configuration updates avoid frequent triggering

### 3. Error handling
- Downgrade mechanism for binding failure
- Handling when component properties do not exist

### 4. type safety
- strictTypeScripttype definition
- Attribute type match verification

### 5. backwards compatible
- Compatibility guarantee for existing configuration formats
- Progressive upgrade path

## Summarize

This plan is based on existing `DynamicParameterEditor.vue` components，Implement a complete dynamic parameter binding system with minimal architectural changes。The core idea is：

1. **byDynamicParameterEditoras the center**：Leverage existing property bindingsUIand data structures
2. **manager mode**：useParameterBindingManagerUnified management of all binding relationships
3. **Reactive triggering**：passVueofwatchMechanism to implement real-time response to attribute changes
4. **Configure driver**：Maintain existing configuration file structure，Parameter replacement through dynamic parsing

After the system is implemented，Users canHTTPThe configuration interface directly binds component properties to request parameters.，Achieve true dynamic data acquisition capabilities。