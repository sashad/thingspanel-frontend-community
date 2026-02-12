<template>
  <div class="interaction-config-wrapper">
    <!-- 🔥 debugging information -->
    <div v-if="isDevelopment" class="debug-info" style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
      <div><strong>debugging information:</strong></div>
      <div>NodeId: {{ props.nodeId }}</div>
      <div>ComponentId: {{ componentId }}</div>
      <div>ComponentType: {{ componentType }}</div>
      <div>Configuration quantity: {{ interactionConfigs.length }}</div>
      <div>Configuration content: {{ JSON.stringify(interactionConfigs, null, 2) }}</div>
      <div>HasWidget: {{ !!props.widget }}</div>
      <div>HasEditorContext: {{ !!editorContext }}</div>
    </div>

    <InteractionCardWizard
      v-model="interactionConfigs"
      :component-id="componentId"
      :component-type="componentType"
      @update:model-value="handleInteractionConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 Interactive configuration wrapper - Refactored version
 * useInteractionConfigRouterUnified management of interactive configurations
 *
 * Problem solved：
 * 1. Interaction fails after refresh - Unified configuration loading and registration timing
 * 2. One component supports multiple interaction configurations - Router concurrency management
 * 3. Cross-component property modification - Configuration-level property modifications
 */

import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from 'vue'
import InteractionCardWizard from '@/core/interaction-system/components/InteractionCardWizard.vue'
import type { InteractionConfig } from '@/card2.1/core2/interaction'
// 🔥 Import new interactive configuration router
import { interactionConfigRouter } from './InteractionConfigRouter'
// Keep the original configuration manager for persistence
import { configurationIntegrationBridge as configurationManager } from './ConfigurationIntegrationBridge'

interface Props {
  nodeId: string
  widget: any
  readonly?: boolean
  componentId?: string
  componentType?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Inject editor context to access the unified configuration system
const editorContext = inject('editorContext', null) as any

// Development environment testing
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development'
})

// Computed properties：componentIdandcomponentType
const componentId = computed(() => props.componentId || props.nodeId)
const componentType = computed(() => props.componentType || props.widget?.type || 'unknown')

// 🔥 Interactive configuration using router management
const interactionConfigs = ref<InteractionConfig[]>([])

// 🔥 Load interactive configuration from unified configuration center
const loadInteractionConfigs = (): void => {

  try {
    // fromstateManagerRead configuration
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const node = nodes.find(n => n.id === componentId.value)
      if (node?.metadata?.unifiedConfig?.interaction?.configs) {
        const configs = node.metadata.unifiedConfig.interaction.configs

        // Update local status
        interactionConfigs.value = configs

        // 🔥 key：Register configuration with router
        interactionConfigRouter.registerComponentConfigs(componentId.value, configs)
        return
      }
    }

    // fromConfigurationManagerGet configuration as an alternative
    const config = configurationManager.getConfiguration(componentId.value)
    const configs = config?.interaction?.configs || []


    // Update local status
    interactionConfigs.value = configs

    // 🔥 key：Register configuration with router
    interactionConfigRouter.registerComponentConfigs(componentId.value, configs)

  } catch (error) {
    console.error(`❌ [InteractionConfigWrapper] Failed to load interaction configuration:`, error)
    interactionConfigs.value = []
  }
}

// 🔥 Interactive configuration update handler
const handleInteractionConfigUpdate = (configs: InteractionConfig[]): void => {

  try {
    // 🔥 first step：save toConfigurationManager
    configurationManager.updateConfiguration(
      componentId.value,
      'interaction',
      { configs },
      props.widget?.type
    )

    // 🔥 Step 2：save tostateManager（Unified configuration center）
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const nodeIndex = nodes.findIndex(n => n.id === componentId.value)
      if (nodeIndex !== -1) {
        const node = nodes[nodeIndex]

        // make sureunifiedConfigstructure exists
        if (!node.metadata) node.metadata = {}
        if (!node.metadata.unifiedConfig) node.metadata.unifiedConfig = {}
        if (!node.metadata.unifiedConfig.interaction) node.metadata.unifiedConfig.interaction = {}

        // Save configuration
        if (configs.length === 0) {
          node.metadata.unifiedConfig.interaction = {}
          delete node.metadata.unifiedConfig.interaction.configs
        } else {
          node.metadata.unifiedConfig.interaction.configs = configs
        }

      }
    }

    // 🔥 Step 3：Update local status
    interactionConfigs.value = configs

    // 🔥 Step 4：Register updated configuration with router（The listener will be automatically re-registered）
    interactionConfigRouter.registerComponentConfigs(componentId.value, configs)


  } catch (error) {
    console.error('❌ [InteractionConfigWrapper] Failed to save interaction configuration:', error)
  }
}

// monitorwidgetchange，Reload configuration
watch(() => props.widget, (newWidget, oldWidget) => {
  loadInteractionConfigs()
}, { immediate: true })

// monitornodeIdchange，Prevent data from not being updated when switching nodes
watch(() => componentId.value, (newComponentId, oldComponentId) => {
  if (newComponentId !== oldComponentId) {
    // Clean up old components
    if (oldComponentId) {
      interactionConfigRouter.unregisterComponent(oldComponentId)
    }
    // Load new configuration
    loadInteractionConfigs()
  }
})

// 🔥 life cycle management
onMounted(() => {

  // Initial load configuration
  nextTick(() => {
    loadInteractionConfigs()
  })
})

onUnmounted(() => {

  // 🔥 Clean the component configuration and listeners in the router
  interactionConfigRouter.unregisterComponent(componentId.value)
})
</script>

<style scoped>
.interaction-config-wrapper {
  /* Styles are inherited from the parent container */
}
</style>