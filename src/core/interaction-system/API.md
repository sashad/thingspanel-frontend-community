# interactive system API document

## components API refer to

### InteractionSettingsForm

Main interactive configuration form component，Provides a complete visual interactive configuration interface。

#### Props

| attribute name | type | default value | required | describe |
|--------|------|--------|------|------|
| `componentId` | `string` | - | ❌ | component unique identifier |
| `componentType` | `string` | - | ❌ | Component type，Used to get listenable properties |
| `modelValue` | `InteractionConfig[]` | `[]` | ❌ | Current interaction configuration list |
| `readonly` | `boolean` | `false` | ❌ | Whether it is read-only mode |
| `showAdvanced` | `boolean` | `true` | ❌ | Whether to display advanced function options |

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `update:modelValue` | `InteractionConfig[]` | Triggered when configuration is updated |
| `change` | `InteractionConfig[]` | Triggered when configuration changes |
| `validate` | `{valid: boolean, errors: string[]}` | Triggered when the verification result changes |

#### Usage example

```vue
<template>
  <InteractionSettingsForm
    v-model="interactions"
    :component-id="componentId"
    :component-type="componentType"
    :readonly="isReadonly"
    @change="handleInteractionChange"
    @validate="handleValidate"
  />
</template>

<script setup lang="ts">
import { InteractionSettingsForm } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const interactions = ref<InteractionConfig[]>([])

const handleInteractionChange = (configs: InteractionConfig[]) => {
  console.log('Interactive configuration changes:', configs)
}

const handleValidate = (result: {valid: boolean, errors: string[]}) => {
  if (!result.valid) {
    console.error('Configuration verification failed:', result.errors)
  }
}
</script>
```

---

### InteractionResponseEditor

React action editor component，Used to configure specific interactive response actions and their parameters。

#### Props

| attribute name | type | default value | required | describe |
|--------|------|--------|------|------|
| `modelValue` | `InteractionResponse` | - | ✅ | Current response action configuration |
| `readonly` | `boolean` | `false` | ❌ | Whether it is read-only mode |

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `update:modelValue` | `InteractionResponse` | Triggered in response to a configuration update |
| `update` | `InteractionResponse` | Triggered in response to configuration changes |

#### Supported response action types

| action type | value type | describe | Configuration items |
|----------|--------|------|--------|
| `navigateToUrl` | `string` | URLJump | `target`, `windowFeatures` |
| `updateComponentData` | `any` | Update component data | `targetComponentId`, `targetProperty`, `updateValue`, `updateMode` |
| `changeVisibility` | `'visible' \| 'hidden'` | change visibility | - |
| `triggerAnimation` | `string` | trigger animation | `duration`, `easing` |

#### Usage example

```vue
<template>
  <InteractionResponseEditor
    v-model="response"
    :readonly="false"
    @update="handleResponseUpdate"
  />
</template>

<script setup lang="ts">
import { InteractionResponseEditor } from '@/core/interaction-system'
import type { InteractionResponse } from '@/card2.1/core/interaction-types'

const response = ref<InteractionResponse>({
  action: 'navigateToUrl',
  value: 'https://example.com',
  target: '_blank'
})

const handleResponseUpdate = (updatedResponse: InteractionResponse) => {
  console.log('Respond to configuration updates:', updatedResponse)
}
</script>
```

---

### InteractionTemplateSelector

Interactive template selector component，Provide preset interaction templates for users to quickly select。

#### Props

No need to pass inProps，Template data is built into the component。

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `select` | `InteractionConfig` | Fires when a template is selected |
| `cancel` | - | Fires when deselected |

#### Template classification

| Classification | key value | describe | Sample template |
|------|------|------|----------|
| basic interaction | `basic` | 常用的basic interaction效果 | Click to highlight、Hover zoom |
| visual effects | `visual` | Visual style change effect | rainbow border、Transparency toggle |
| Animation effects | `animation` | 动态Animation effects | pulse animation、Vibration reminder |
| composite interaction | `complex` | Complex interactions of multiple event combinations | full feedback loop |
| User defined | `user` | Custom templates imported by users | - |

#### Usage example

```vue
<template>
  <InteractionTemplateSelector
    @select="applyTemplate"
    @cancel="closeSelector"
  />
</template>

<script setup lang="ts">
import { InteractionTemplateSelector } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const applyTemplate = (template: InteractionConfig) => {
  console.log('Apply template:', template)
  // Apply template configuration to current component
  currentInteractions.value.push(template)
}

const closeSelector = () => {
  console.log('Cancel template selection')
}
</script>
```

---

### InteractionTemplatePreview

Interactive template preview component，Provide detailed information display and effect demonstration functions of templates。

#### Props

| attribute name | type | default value | required | describe |
|--------|------|--------|------|------|
| `template` | `InteractionTemplate` | - | ✅ | Interaction template to preview |

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `close` | - | Triggered when preview is closed |
| `select` | `InteractionTemplate` | Fires when a template is selected |

#### Core functions

- 📋 **Template information display**：Display template basic information and statistics
- 🎨 **Configuration details**：Display all interactive configurations contained in the template
- 🎮 **Live demo**：Provide interactive presentation elements
- 💾 **Template export**：Supports exporting templates asJSONdocument

#### Usage example

```vue
<template>
  <InteractionTemplatePreview
    :template="selectedTemplate"
    @select="handleTemplateSelect"
    @close="closePreview"
  />
</template>

<script setup lang="ts">
import { InteractionTemplatePreview } from '@/core/interaction-system'
import type { InteractionTemplate } from '@/core/interaction-system'

const selectedTemplate = ref<InteractionTemplate>({
  id: 'hover-scale',
  name: 'Hover zoom effect',
  description: 'Interaction effect of element scaling when mouse hovers',
  category: 'basic',
  icon: SettingsOutline,
  color: '#2080f0',
  config: [/* Interactive configuration */]
})

const handleTemplateSelect = (template: InteractionTemplate) => {
  console.log('Select template:', template)
}

const closePreview = () => {
  console.log('Close preview')
}
</script>
```

---

### InteractionPreview

Interactive preview component，Provide real-time interactive effect preview and testing functions。

#### Props

| attribute name | type | default value | required | describe |
|--------|------|--------|------|------|
| `interactions` | `InteractionConfig[]` | - | ✅ | List of interaction configurations to preview |
| `componentId` | `string` | - | ❌ | associated componentsID |

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `close` | - | Triggered when preview is closed |

#### Preview function

- 🎮 **interactive testing**：simulate click、Hover and other events
- 📊 **execution log**：Record the interactive execution process in detail
- 🎛️ **Configuration control**：Dynamically enabled/Disable configuration
- 🔄 **reset function**：Restore the initial state of the preview element

#### Usage example

```vue
<template>
  <InteractionPreview
    :interactions="interactionConfigs"
    :component-id="currentComponentId"
    @close="closePreview"
  />
</template>

<script setup lang="ts">
import { InteractionPreview } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

const interactionConfigs = ref<InteractionConfig[]>([
  {
    event: 'click',
    responses: [{
      action: 'changeBackgroundColor',
      value: '#ff0000'
    }],
    enabled: true
  }
])

const closePreview = () => {
  console.log('Close preview')
}
</script>
```

---

### InteractionCardWizard

Simplified interactive configuration wizard，Provides a simple pop-up configuration interface。

#### Props

| attribute name | type | default value | required | describe |
|--------|------|--------|------|------|
| `modelValue` | `any[]` | `[]` | ❌ | Current interaction configuration |
| `componentId` | `string` | - | ❌ | componentsID |
| `componentType` | `string` | - | ❌ | Component type |

#### Events

| event name | Parameter type | describe |
|--------|----------|------|
| `update:modelValue` | `any[]` | Triggered when configuration is updated |

#### Supported operations

- ➕ **Add interaction**：Quickly add new interaction configurations through pop-up windows
- ✏️ **Edit interaction**：Modify existing interaction configuration
- 🗑️ **Delete interaction**：Remove unnecessary interaction configuration
- 🔄 **Switch status**：enable/Disable specific interactions

#### Usage example

```vue
<template>
  <InteractionCardWizard
    v-model="interactions"
    :component-id="componentId"
    :component-type="componentType"
  />
</template>

<script setup lang="ts">
import { InteractionCardWizard } from '@/core/interaction-system'

const interactions = ref([])
const componentId = ref('component-001')
const componentType = ref('chart-component')
</script>
```

---

## Manager API

### ConfigRegistry

Configuring the component registry manager，for managementCard 2.1Custom configuration panel for components。

#### method

| method name | parameter | return value | describe |
|--------|------|--------|------|
| `register` | `(componentId: string, configComponent: IConfigComponent)` | `void` | Register configuration component |
| `get` | `(componentId: string)` | `IConfigComponent \| undefined` | Get configuration components |
| `has` | `(componentId: string)` | `boolean` | Check if there is a custom configuration component |
| `getAll` | `()` | `ConfigComponentRegistration[]` | Get all registered configuration components |
| `clear` | `()` | `void` | clear all registrations |
| `unregister` | `(componentId: string)` | `boolean` | Remove the configuration of the specified component |

#### Usage example

```typescript
import { configRegistry } from '@/core/interaction-system'

// Register a custom configuration component
configRegistry.register('my-component', {
  component: MyCustomConfigPanel,
  props: { /* Configuration properties */ },
  validators: { /* Validation rules */ }
})

// Check if there is a custom configuration
if (configRegistry.has('my-component')) {
  const config = configRegistry.get('my-component')
  // Use custom configuration components
}

// Get all registered configurations
const allConfigs = configRegistry.getAll()
console.log('Registered configuration components:', allConfigs)
```

---

## type definition

### core interface

```typescript
// Interactively configure the main interface
interface InteractionConfig {
  event: InteractionEventType           // Trigger event type
  responses: InteractionResponse[]      // Response action list
  enabled: boolean                      // Whether to enable
  priority?: number                     // execution priority
  name?: string                         // Configuration name
  
  // conditional execution
  condition?: ConditionConfig           
  watchedProperty?: string              
  sourceComponentType?: string          
  
  // Cross-component interaction
  targetComponentId?: string            
}

// Response action interface
interface InteractionResponse {
  action: InteractionActionType         // action type
  value: any                           // action value
  delay?: number                       // Delayed execution time(ms)
  duration?: number                    // duration(ms)
  easing?: string                      // Easing function
  
  // URLJump related
  target?: string                      // Jump target
  windowFeatures?: string              // New window properties
  
  // Component data update related
  targetComponentId?: string           // target componentID
  targetProperty?: string              // target attribute
  updateValue?: any                    // update value
  updateMode?: 'replace' | 'append' | 'prepend'
}

// Conditional configuration interface
interface ConditionConfig {
  type: 'comparison' | 'range' | 'expression'
  operator?: ComparisonOperator
  value?: any
  minValue?: any
  maxValue?: any
  expression?: string
}
```

### enumeration type

```typescript
/**
 * Interaction event type enumeration
 * Defines all supported user interaction and system event types
 */
type InteractionEventType = 
  | 'click'              // mouse click event (MouseEvent)
  | 'hover'              // mouseover event (MouseEvent: mouseenter/mouseleave)
  | 'focus'              // element gets focus event (FocusEvent)
  | 'blur'               // Element loses focus event (FocusEvent)
  | 'visibility'         // Element visibility state change event (IntersectionObserver)
  | 'dataChange'         // Component data attribute value change event (Vue Watcher)
  | 'conditional'        // Event triggered when a conditional expression is met
  | 'crossComponent'     // Cross-component communication events (CustomEvent)
  | 'custom'             // User-defined event type

/**
 * Interaction response action type enumeration
 * Defines all action types that can be executed after the interaction is triggered
 */
type InteractionActionType = 
  // Navigation action
  | 'navigateToUrl'            // URLJump (Supports internal routing and external links)
  | 'jumpToPage'               // Page jump (Internal routing only)
  
  // Data manipulation actions
  | 'updateComponentData'      // Update target component data
  | 'modifyProperty'           // Modify component properties (new format)
  
  // visual style actions  
  | 'changeVisibility'         // Change element visibility (visible/hidden)
  | 'changeBackgroundColor'    // Change background color
  | 'changeTextColor'          // Change text color
  | 'changeBorderColor'        // Change border color
  | 'changeSize'               // change size (width/height)
  | 'changeOpacity'            // change transparency (0-1)
  | 'changeTransform'          // CSStransformation operation (scale/rotate/translate)
  | 'changeContent'            // Change text content
  
  // animation effect action
  | 'triggerAnimation'         // triggerCSSanimation or keyframe animation
  | 'flashColor'               // color flash effect
  | 'pulseEffect'              // Pulse animation effect
  | 'shakeEffect'              // Vibration animation effect
  
  // Advanced functional actions
  | 'conditionalStyle'         // Condition-based style application
  | 'callFunction'             // callJavaScriptfunction
  | 'emitEvent'                // Send custom events
  | 'playSound'                // Play sound effects (Web Audio API)
  | 'showNotification'         // Show notification message
  
  // extended action
  | 'custom'                   // User-defined action handler

/**
 * Conditional comparison operators enumeration
 * Conditional judgment for data change events
 */
type ComparisonOperator = 
  // numerical comparison
  | 'equals'                   // equal (===)
  | 'notEquals'                // not equal to (!==)
  | 'greaterThan'              // greater than (>)
  | 'greaterThanOrEqual'       // Greater than or equal to (>=)
  | 'lessThan'                 // less than (<)
  | 'lessThanOrEqual'          // less than or equal to (<=)
  
  // String comparison
  | 'contains'                 // Include (includes)
  | 'startsWith'               // Started with (startsWith)
  | 'endsWith'                 // ends in (endsWith)
  | 'matches'                  // Regular expression matching
  
  // Set comparison
  | 'in'                       // exists in the array
  | 'notIn'                    // does not exist in the array
  
  // type checking
  | 'isEmpty'                  // is a null value (null/undefined/'')
  | 'isNotEmpty'               // non-null value

/**
 * condition type enum
 * Defines the judgment method for conditional execution
 */
type ConditionType = 
  | 'always'                   // always execute
  | 'never'                    // never execute  
  | 'comparison'               // comparative judgment (useComparisonOperator)
  | 'range'                    // Numeric range judgment (min-max)
  | 'expression'               // JavaScriptExpression judgment
  | 'function'                 // Custom function judgment

/**
 * Update mode enum
 * Defines how data is updated
 */
type UpdateMode = 
  | 'replace'                  // Replace existing value
  | 'append'                   // Append to existing value
  | 'prepend'                  // Append before existing value
  | 'merge'                    // Object merge (Object.assign)
  | 'deepMerge'                // Deep object merging
```

---

## Error handling

### Common error codes

| error code | describe | solution |
|--------|------|----------|
| `INTERACTION_CONFIG_INVALID` | Invalid interactive configuration format | Check configuration object structure |
| `COMPONENT_NOT_FOUND` | Target component not found | Confirm componentIDIs it correct? |
| `PROPERTY_NOT_EXPOSED` | Properties not exposed | Check property exposure configuration |
| `TEMPLATE_FORMAT_ERROR` | Template format error | Validation templateJSONstructure |
| `EXECUTION_TIMEOUT` | Interactive execution timeout | Check response action configuration |

### Error handling example

```typescript
try {
  await interactionManager.executeInteraction(config)
} catch (error) {
  switch (error.code) {
    case 'INTERACTION_CONFIG_INVALID':
      console.error('Invalid interaction configuration:', error.message)
      // Show configuration error message
      break
    case 'COMPONENT_NOT_FOUND':
      console.error('Target component not found:', error.componentId)
      // Prompt user to select valid components
      break
    default:
      console.error('unknown error:', error)
  }
}
```

---

## Version compatibility

| APIVersion | 交互系统Version | backwards compatible | Major changes |
|---------|--------------|----------|----------|
| v1.0 | 1.0.0 | - | initial version |
| v1.1 | 1.1.0 | ✅ | Added conditional execution function |
| v1.2 | 1.2.0 | ✅ | Added template system |
| v1.3 | 1.3.0 | ✅ | Added real-time preview |

---

*APIDocument version：v1.3 | last updated：2024Year*