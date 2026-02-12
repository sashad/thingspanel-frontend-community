import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Tenant diagram component definition
 * Display tenant user statistics and monthly new user trend charts
 */
export default {
  type: 'tenant-chart',
  name: 'components.tenantChart', // Store translation keys，instead of calling$t()
  description: 'Display tenant user statistics and monthly new user trend charts，Contains total number of users、new monthly、New statistics added yesterday',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18v-2H5V3H3z"/><path d="M7 14l2-3 3 3 4-6 1.4 1.8L13 15l-3-3-2 2H7z" fill="#06b6d4"/><circle cx="12" cy="8" r="2" fill="#3b82f6"/><circle cx="16" cy="6" r="2" fill="#10b981"/><circle cx="20" cy="4" r="2" fill="#8b5cf6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['Tenant Statistics', 'User growth', 'Data chart', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
