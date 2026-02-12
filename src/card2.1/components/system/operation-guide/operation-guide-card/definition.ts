import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Operation guide card component definition
 * Display a list of corresponding operation guidelines based on user roles
 */
export default {
  type: 'operation-guide-card',
  name: 'components.operationGuideCard',
  description: 'Display a list of corresponding operation guidelines based on user roles，Support quick navigation',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><path d="M9 11h6v2H9v-2zm0 4h4v2H9v-2z" fill="#fbbf24"/></svg>',
  component,
  category: 'widget-library.subCategories.operationGuide',
  version: '2.1.0',
  tags: ['guidelines', 'Operation manual', 'User guidance', 'interaction'],
  dataDriven: false, // This is a purely interactive component，Provide navigation capabilities based on user roles，Does not rely on external data sources
  interactionCapabilities: {
    // Declare the component to support click events and navigation functions
    supportedEvents: ['click', 'navigate'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
