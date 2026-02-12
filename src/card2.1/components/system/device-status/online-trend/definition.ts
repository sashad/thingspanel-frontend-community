import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Device online trend component definition
 * Display device online/Offline quantity trend chart and online rate statistics
 */
export default {
  type: 'online-trend',
  name: 'components.onlineTrend', // Store translation keys，instead of calling$t()
  description: 'Display device online/Offline quantity trend chart，Contains online rate statistics and real-time data visualization',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2l1 7c0 .55.45 1 1 1s1-.45 1-1l1-7h2v-2H3v2zm11-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4-4h2v6h-2v-6zm-8-4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0-6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><circle cx="12" cy="8" r="2" fill="#22c55e"/><circle cx="18" cy="12" r="1.5" fill="#22c55e"/><circle cx="6" cy="16" r="1.5" fill="#f59e0b"/></svg>',
  component,
  version: '2.1.0',
  tags: ['Device status', 'trend chart', 'online rate', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
