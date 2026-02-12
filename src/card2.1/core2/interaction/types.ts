/**
 * Interactive system type definition
 * Simplified interactive type system，Focus on core functionality
 */

import type { Component } from 'vue'

/**
 * Interaction event type
 */
export type InteractionEventType =
  | 'click'
  | 'dblclick'
  | 'mouseenter'
  | 'mouseleave'
  | 'focus'
  | 'blur'
  | 'change'
  | 'input'

/**
 * Interaction type
 */
export type InteractionActionType =
  | 'navigate'
  | 'showMessage'
  | 'updateData'
  | 'toggleVisibility'
  | 'custom'

/**
 * Interaction configuration
 */
export interface InteractionAction {
  type: InteractionActionType
  target?: string // target componentIDor page path
  message?: string // Message content
  data?: Record<string, any> // Update data
  visible?: boolean // show/Hidden state
  customHandler?: () => void // Custom processing function
}

/**
 * Interaction event configuration
 */
export interface InteractionEvent {
  type: InteractionEventType
  actions: InteractionAction[]
  preventDefault?: boolean
  stopPropagation?: boolean
}

/**
 * Interactive configuration
 */
export interface InteractionConfig {
  events: Record<string, InteractionEvent>
  targetComponent?: string // target component type
}

/**
 * Interaction Manager configuration
 */
export interface InteractionManagerConfig {
  enableLogging?: boolean
  enableDebugMode?: boolean
  defaultPreventDefault?: boolean
  defaultStopPropagation?: boolean
}

/**
 * interaction state
 */
export interface InteractionState {
  isEnabled: boolean
  activeEvents: Set<string>
  eventHistory: Array<{
    event: InteractionEventType
    target: string
    timestamp: number
  }>
}

/**
 * interaction context
 */
export interface InteractionContext {
  componentId: string
  componentType: string
  componentData: Record<string, any>
  globalData: Record<string, any>
}

/**
 * Interaction handler function
 */
export type InteractionHandler = (
  event: Event,
  context: InteractionContext,
  action: InteractionAction
) => void | Promise<void>

/**
 * Interaction handler registration
 */
export interface InteractionHandlerRegistration {
  type: InteractionActionType
  handler: InteractionHandler
  priority?: number
}

/**
 * Interactive system statistics
 */
export interface InteractionStats {
  totalEvents: number
  activeComponents: number
  registeredHandlers: number
  eventDistribution: Record<string, number>
}