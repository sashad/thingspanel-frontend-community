import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Recently visited component definition
 * Display a list of recently visited pages by the user，Support quick navigation
 */
export default {
  type: 'recently-visited',
  name: 'components.recentlyVisited', // Store translation keys，instead of calling$t()
  description: 'Display a list of recently visited pages by the user，Support click for quick navigation',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['access record', 'navigation', 'user behavior', 'interaction'],
  dataDriven: false, // This is a purely interactive component，based onlocalStorageData provides navigation，Does not rely on external data sources
  interactionCapabilities: {
    // Declare the component to support click events and navigation functions
    supportedEvents: ['click', 'navigate'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
