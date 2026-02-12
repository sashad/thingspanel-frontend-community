import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Message information component definition
 * Display total system message statistics
 */
export default {
  type: 'news',
  name: 'components.news', // Store translation keys，instead of calling$t()
  description: 'Display total system message statistics，Support real-time data display',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/><path d="M4 6h16v2H4V6zm0 4h16v2H4v-2zm0 4h12v2H4v-2z" fill="#06b6d4"/></svg>',
  component,
  version: '2.1.0',
  tags: ['information', 'statistics', 'Data display', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
