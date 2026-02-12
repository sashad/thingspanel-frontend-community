/**
 * Unified export of core interactive systems
 *
 * This module provides complete component interactive configuration and management functions，include：
 * - Interactive configuration components
 * - configuration manager
 * - unifiedAPIinterface
 */

// Export interactive configuration components
export { default as InteractionCardWizard } from '@/core/interaction-system/components/InteractionCardWizard.vue'
export { default as InteractionTemplateSelector } from '@/core/interaction-system/components/InteractionTemplateSelector.vue'
export { default as InteractionPreview } from '@/core/interaction-system/components/InteractionPreview.vue'

// Export configuration manager
export { configRegistry, default as ConfigRegistry } from '@/core/interaction-system/managers/ConfigRegistry'

// Backwards compatible export（To keep existing code working）
export const initializeSettings = () => {
  // TODO: Here you can add the initialization logic of the interactive system
}
