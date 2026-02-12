# 🚀 Interactive System Quick Start Guide

WelcomeThingsPanelcore interactive system！This guide will help you in5Get started quickly in minutes。

## 📚 prerequisite knowledge

before starting，Please make sure you are familiar with the following techniques：

- ✅ Vue 3 Composition API
- ✅ TypeScript basic grammar
- ✅ Naive UI Component library
- ✅ ThingsPanel Card 2.1 system

## ⚡ Quick installation

### 1. Import core components

```typescript
// Import main components
import { 
  InteractionSettingsForm,
  InteractionResponseEditor,
  InteractionTemplateSelector,
  InteractionPreview 
} from '@/core/interaction-system'

// Import type definition
import type { 
  InteractionConfig,
  InteractionResponse 
} from '@/card2.1/core/interaction-types'
```

### 2. Basic integration

```vue
<template>
  <div class="component-settings">
    <!-- Other configurations... -->
    
    <!-- 🎯 Interactive configuration area -->
    <n-collapse-item title="Interactive configuration" name="interaction">
      <InteractionSettingsForm
        v-model="interactionConfigs"
        :component-id="currentComponentId"
        :component-type="currentComponentType"
        @change="handleInteractionChange"
      />
    </n-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { InteractionSettingsForm } from '@/core/interaction-system'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

// Interactive configuration data
const interactionConfigs = ref<InteractionConfig[]>([])
const currentComponentId = ref('my-component-001')
const currentComponentType = ref('chart-component')

// Handling interactive configuration changes
const handleInteractionChange = (configs: InteractionConfig[]) => {
  console.log('Interaction configuration updated:', configs)
  // Save to component configuration or send to server
}
</script>
```

## 🎯 5Minute practical example

### Example1：Click to jump function

Create an interaction that jumps to an external link by clicking on the component：

```typescript
const jumpInteraction: InteractionConfig = {
  event: 'click',                    // Click trigger
  enabled: true,
  priority: 1,
  name: 'Jump to official website',
  responses: [{
    action: 'navigateToUrl',         // URLjump action
    value: 'https://thingspanel.io', // target link
    target: '_blank'                 // New window opens
  }]
}

// Apply to components
interactionConfigs.value.push(jumpInteraction)
```

### Example2：Data change trigger

When the temperature exceeds30Display warning when：

```typescript
const temperatureWarning: InteractionConfig = {
  event: 'dataChange',               // Data change trigger
  watchedProperty: 'temperature',    // Monitor temperature properties
  condition: {                       // Execution conditions
    type: 'comparison',
    operator: 'greaterThan',
    value: 30
  },
  enabled: true,
  priority: 2,                       // high priority
  name: 'temperature warning',
  responses: [{
    action: 'updateComponentData',   // Update component data
    targetComponentId: 'warning-panel-001',
    targetProperty: 'visible',
    updateValue: true,
    updateMode: 'replace'
  }, {
    action: 'changeBackgroundColor', // Also change background color
    value: '#ffebee',               // light red warning
    duration: 500
  }]
}

// Apply to components
interactionConfigs.value.push(temperatureWarning)
```

### Example3：hover effect

Change background color on mouseover：

```typescript
const hoverEffect: InteractionConfig = {
  event: 'hover',                    // Hover trigger
  enabled: true,
  name: 'Hover highlight',
  responses: [{
    action: 'changeBackgroundColor', // change background color
    value: '#f0f8ff',               // light blue
    duration: 300                   // 300mstransition
  }]
}
```

## 🛠️ Common code snippets

### Configure form integration

```vue
<template>
  <!-- Complete configuration panel -->
  <n-card title="Interaction settings" size="small">
    <InteractionSettingsForm
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
      :readonly="readonly"
      @change="handleChange"
      @validate="handleValidate"
    >
      <!-- Customize toolbar -->
      <template #toolbar>
        <n-space>
          <n-button @click="openPreview">Preview effect</n-button>
          <n-button @click="openTemplates">Select template</n-button>
        </n-space>
      </template>
    </InteractionSettingsForm>
  </n-card>
</template>
```

### template selector

```vue
<template>
  <!-- Template selection dialog -->
  <n-modal v-model:show="showTemplates" title="Select interaction template">
    <n-card style="width: 800px">
      <InteractionTemplateSelector
        @select="applyTemplate"
        @cancel="showTemplates = false"
      />
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
const showTemplates = ref(false)

const applyTemplate = (template: InteractionConfig) => {
  interactions.value.push({
    ...template,
    name: `${template.name} (template)`
  })
  showTemplates.value = false
}
</script>
```

### Preview function

```vue
<template>
  <!-- Preview dialog -->
  <n-modal v-model:show="showPreview" title="Interaction effect preview">
    <n-card style="width: 900px; height: 600px">
      <InteractionPreview
        :interactions="interactions"
        :component-id="componentId"
        @close="showPreview = false"
      />
    </n-card>
  </n-modal>
</template>
```

## 🎨 Style customization

### Theme integration

```vue
<style scoped>
/* integratedThingsPaneltheme system */
.interaction-panel {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
}

/* Interaction configuration item style */
.interaction-item {
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.interaction-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px var(--primary-color-hover);
}

/* Responsive layout */
@media (max-width: 768px) {
  .interaction-panel {
    padding: 12px;
  }
}
</style>
```

## 📊 Debugging Tips

### 1. Enable debug logging

```typescript
// Enable detailed logging in the development environment
if (process.env.NODE_ENV === 'development') {
  window.__INTERACTION_DEBUG__ = true
}

// Monitor interactive execution
interactionManager.on('execute', (event) => {
  console.log('[Interactive execution]', event.config, event.result)
})
```

### 2. useVue DevTools

existVue DevToolsCheck the interaction status in：

```typescript
// Expose debugging information to developer tools
const { expose } = getCurrentInstance()
expose({
  interactions: interactionConfigs,
  executionLog: executionLog,
  debugInfo: computed(() => ({
    activeInteractions: activeCount.value,
    lastExecution: lastExecutionTime.value
  }))
})
```

### 3. error boundary handling

```typescript
const handleInteractionError = (error: Error, config: InteractionConfig) => {
  console.error('Interactive execution failed:', {
    error: error.message,
    config: config,
    timestamp: new Date().toISOString()
  })
  
  // Send error report
  if (process.env.NODE_ENV === 'production') {
    errorReporter.report('INTERACTION_ERROR', { error, config })
  }
}
```

## 🔧 Performance optimization

### 1. Lazy loading

```typescript
// Load interactive components asynchronously
const InteractionSettingsForm = defineAsyncComponent(() => 
  import('@/core/interaction-system/components/InteractionSettingsForm.vue')
)
```

### 2. Configure cache

```typescript
// Caching interaction configuration
const configCache = new Map<string, InteractionConfig[]>()

const getCachedConfig = (componentId: string) => {
  if (!configCache.has(componentId)) {
    const config = loadInteractionConfig(componentId)
    configCache.set(componentId, config)
  }
  return configCache.get(componentId)
}
```

### 3. Batch update

```typescript
// usenextTickProcess configuration updates in batches
const batchUpdateConfigs = useDebounceFn((configs: InteractionConfig[]) => {
  nextTick(() => {
    interactionManager.batchUpdate(configs)
  })
}, 300)
```

## 📱 Mobile terminal adaptation

### Responsive configuration

```vue
<template>
  <div class="interaction-mobile-wrapper">
    <!-- Use simplified version of components on mobile terminal -->
    <InteractionCardWizard
      v-if="isMobile"
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
    />
    
    <!-- Use the full version of the component on desktop -->
    <InteractionSettingsForm
      v-else
      v-model="interactions"
      :component-id="componentId"
      :component-type="componentType"
    />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024
})

const isMobile = breakpoints.smaller('tablet')
</script>
```

## 🚨 FAQ

### Q1: Interactive configuration does not take effect？

```typescript
// Check interaction manager registration status
console.log('Component interaction configuration:', interactionManager.getComponentConfigs(componentId))

// Check property exposure configuration
console.log('Property exposure information:', propertyExposureRegistry.getComponentExposure(componentType))
```

### Q2: Cross-component interaction failed？

```typescript
// Check if target component exists
const availableComponents = visualEditorState.getAvailableComponents()
const targetExists = availableComponents.find(comp => comp.id === targetComponentId)

if (!targetExists) {
  console.error('Target component does not exist:', targetComponentId)
}
```

### Q3: Template import failed？

```typescript
// Validate template format
const validateTemplate = (template: any): boolean => {
  return !!(
    template.name &&
    template.config &&
    Array.isArray(template.config) &&
    template.config.every(config => config.event && config.responses)
  )
}
```

## 🎯 Next step

Now you have mastered the basic usage，Can：

1. 📖 read [wholeAPIdocument](./API.md)
2. 🏗️ Check [Architecture design documents](./README.md)
3. 🎨 study [Advanced customization skills](./ADVANCED.md)
4. 🧪 refer to [test case](./tests/)

## 💡 Pro Tips

- ✨ Use the template system to quickly create common interactions
- ⚡ Use conditional execution to reduce unnecessary calculations
- 🎯 Prefer built-in action types，Avoid over-customization
- 📊 Always turn on the preview function during development to verify the effect
- 🛠️ Write unit tests for complex interactions

---

**🎉 Congratulations！You have completed the quick start of the interactive system。Start creating amazing interactive experiences！**

---

*Quick start guide | Version：v1.0 | Estimated reading time：5minute*