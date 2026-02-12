/**
 * Card2.1 Component interaction interface standardization
 * Define all interactiveCard2The interface that the component must implement
 */

import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponseResult,
  ComponentInteractionState
} from '../core/interaction-types'

/**
 * Interaction capability component interface
 * All interactiveCard2Components should all implement this interface
 */
export interface InteractionCapableComponent {
  /**
   * component unique identifier
   */
  componentId: string

  /**
   * Whether to allow external control
   * asfalsehour，Component refuses all external interaction
   */
  allowExternalControl?: boolean

  /**
   * Interaction whitelist
   * Only allow components in the list to interact with this component
   */
  interactionWhitelist?: string[]

  /**
   * interactive blacklist
   * Deny components in the list from interacting with this component
   */
  interactionBlacklist?: string[]

  /**
   * Supported event types
   * The component declares which interactive events it supports
   */
  supportedEvents?: InteractionEventType[]

  /**
   * Current interaction status
   */
  interactionState?: ComponentInteractionState

  /**
   * Interactive configuration list
   */
  interactionConfigs?: InteractionConfig[]

  /**
   * Whether to display interaction indicators
   */
  showInteractionIndicator?: boolean
}

/**
 * Interactive component standardsProps
 * All interactive components should accept theseprops
 */
export interface InteractionProps {
  /**
   * componentsID - Depend onVisual Editorincoming
   */
  componentId?: string

  /**
   * Interactive configuration list - Passed in from the configuration system
   */
  interactionConfigs?: InteractionConfig[]

  /**
   * Whether to allow external control
   */
  allowExternalControl?: boolean

  /**
   * Interaction permission configuration
   */
  interactionPermissions?: {
    whitelist?: string[]
    blacklist?: string[]
    allowedEvents?: InteractionEventType[]
  }

  /**
   * Whether to display interaction indicators
   */
  showInteractionIndicator?: boolean

  /**
   * Whether in preview mode
   * Activate interaction in preview mode，Disabled in edit mode
   */
  previewMode?: boolean
}

/**
 * Interactive component standard events
 * All interactive components should emit these events
 */
export interface InteractionEmits {
  /**
   * Interactive state changes
   */
  (e: 'interaction-state-change', state: ComponentInteractionState): void

  /**
   * Interaction event trigger
   */
  (e: 'interaction-event', eventType: InteractionEventType, data?: any): void

  /**
   * Interactive execution results
   */
  (e: 'interaction-result', result: InteractionResponseResult): void

  /**
   * Interaction error
   */
  (e: 'interaction-error', error: { message: string; code?: string; details?: any }): void

  /**
   * Interaction rejected
   */
  (
    e: 'interaction-rejected',
    reason: {
      sourceComponentId?: string
      eventType: InteractionEventType
      reason: 'permission_denied' | 'event_not_supported' | 'external_control_disabled'
      message: string
    }
  ): void
}

/**
 * Interaction permission check results
 */
export interface InteractionPermissionCheck {
  /**
   * Whether to allow interaction
   */
  allowed: boolean

  /**
   * Reason for rejection
   */
  reason?: string

  /**
   * reject code
   */
  code?: 'EXTERNAL_CONTROL_DISABLED' | 'COMPONENT_BLACKLISTED' | 'COMPONENT_NOT_WHITELISTED' | 'EVENT_NOT_SUPPORTED'
}

/**
 * interactive context information
 */
export interface InteractionContext {
  /**
   * source componentID（The component that triggers the interaction）
   */
  sourceComponentId?: string

  /**
   * target componentID（Components that receive interactions）
   */
  targetComponentId: string

  /**
   * event type
   */
  eventType: InteractionEventType

  /**
   * event data
   */
  eventData?: any

  /**
   * Timestamp
   */
  timestamp: number

  /**
   * Whether it is directly operated by the user
   */
  isUserAction: boolean
}

/**
 * Interaction capability component configuration
 */
export interface InteractionCapabilityConfig {
  /**
   * Whether to enable interactivity
   */
  enabled: boolean

  /**
   * Default permission settings
   */
  defaultPermissions: {
    allowExternalControl: boolean
    supportedEvents: InteractionEventType[]
  }

  /**
   * Whether to enable interactive debugging
   */
  enableDebug: boolean

  /**
   * Performance configuration
   */
  performance: {
    /**
     * Event anti-shake time（millisecond）
     */
    debounceTime: number

    /**
     * Maximum number of simultaneous interactions
     */
    maxConcurrentInteractions: number
  }
}

/**
 * Interactive component factory configuration
 */
export interface InteractionComponentFactory {
  /**
   * Create interactive component wrappers
   */
  createInteractionWrapper<T extends Record<string, any>>(
    component: T,
    config?: Partial<InteractionCapabilityConfig>
  ): T & InteractionCapableComponent

  /**
   * Verify whether the component supports interaction
   */
  validateInteractionSupport(component: any): boolean

  /**
   * Get the event types supported by the component
   */
  getSupportedEvents(component: any): InteractionEventType[]
}
