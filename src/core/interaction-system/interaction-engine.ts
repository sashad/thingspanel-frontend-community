/**
 * 🔥 interactive execution engine
 * Responsible for performing interactive actions，Implement two-way binding between components
 */

import { useEditorStore } from '@/store/modules/editor'
import { useMessage } from 'naive-ui'

export interface InteractionAction {
  action: string
  targetComponentId?: string
  targetProperty?: string
  updateValue?: any
  jumpConfig?: {
    jumpType: 'external' | 'internal'
    url?: string
    internalPath?: string
    target?: string
  }
  modifyConfig?: {
    targetComponentId: string
    targetProperty: string
    updateValue: any
    updateMode?: 'replace' | 'merge' | 'append'
  }
}

export interface InteractionEvent {
  event: string
  watchedProperty?: string
  condition?: {
    type: 'comparison' | 'range' | 'expression'
    operator?: string
    value?: any
  }
  responses: InteractionAction[]
  enabled: boolean
}

/**
 * 🔥 Create an interactive execution engine
 */
export function createInteractionEngine() {
  const editorStore = useEditorStore()
  const message = useMessage()

  /**
   * 🔥 perform jump action
   */
  const executeJumpAction = (action: InteractionAction) => {
    try {
      if (action.jumpConfig) {
        const { jumpType, url, internalPath, target = '_self' } = action.jumpConfig

        if (jumpType === 'external' && url) {
          window.open(url, target)
        } else if (jumpType === 'internal' && internalPath) {
          if (target === '_blank') {
            window.open(`${window.location.origin}${internalPath}`, '_blank')
          } else {
            window.location.href = internalPath
          }
        }
      } else {
        // Compatible with older formats
        const url = action.updateValue || ''
        const target = action.targetProperty || '_blank'
        window.open(url, target)
      }
    } catch (error) {
      console.error('🔥 [InteractionEngine] Jump execution failed:', error)
      message.error(`Jump failed: ${error.message}`)
    }
  }

  /**
   * 🔥 Execute attribute modification action
   */
  const executeModifyAction = (action: InteractionAction) => {
    try {
      const { targetComponentId, targetProperty, updateValue } = action.modifyConfig || action

      if (!targetComponentId || !targetProperty) {
        throw new Error('Missing target componentIDor attribute name')
      }


      // Find the target component node
      const targetNode = editorStore.nodes.find(node => node.id === targetComponentId)
      if (!targetNode) {
        throw new Error(`Target component not found: ${targetComponentId}`)
      }

      // 🔥 Update the properties of the target component
      // Try updating firstunifiedConfigincomponentConfiguration
      const currentMetadata = targetNode.metadata || {}
      const currentUnifiedConfig = currentMetadata.unifiedConfig || {}
      const currentComponent = currentUnifiedConfig.component || {}

      // Update component configuration
      const updatedComponent = {
        ...currentComponent,
        [targetProperty]: updateValue
      }

      // Update node
      editorStore.updateNode(targetComponentId, {
        properties: {
          ...targetNode.properties,
          [targetProperty]: updateValue
        },
        metadata: {
          ...currentMetadata,
          unifiedConfig: {
            ...currentUnifiedConfig,
            component: updatedComponent
          },
          lastInteractionUpdate: Date.now()
        }
      })

      // 🔥 additional processing：If the target component hasuseCard2Props，Directly call its property exposure method
      try {
        const targetElement = document.querySelector(`[data-component-id="${targetComponentId}"]`)
        if (targetElement && (targetElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
          ;(targetElement as any).__vueParentComponent.exposed.updateConfig('component', updatedComponent)
        }
      } catch (error) {
        console.warn(`🔥 [InteractionEngine] Direct update of component configuration failed:`, error)
      }

      message.success(`Property updated: ${targetProperty} = ${updateValue}`)

    } catch (error) {
      console.error('🔥 [InteractionEngine] Property modification failed:', error)
      message.error(`Property modification failed: ${error.message}`)
    }
  }

  /**
   * 🔥 Perform a single interaction
   */
  const executeAction = (action: InteractionAction) => {

    switch (action.action) {
      case 'jump':
      case 'navigateToUrl':
        executeJumpAction(action)
        break

      case 'modify':
      case 'updateComponentData':
        executeModifyAction(action)
        break

      default:
        console.warn(`🔥 [InteractionEngine] Unknown interaction type: ${action.action}`)
        message.warning(`Unknown interaction: ${action.action}`)
    }
  }

  /**
   * 🔥 Execute interactive events
   */
  const executeInteraction = (interaction: InteractionEvent, triggerData?: any) => {
    if (!interaction.enabled) {
      return
    }


    // Check whether the conditions are met（used fordataChangeevent）
    if (interaction.event === 'dataChange' && interaction.condition && triggerData !== undefined) {
      if (!checkCondition(interaction.condition, triggerData)) {
        return
      }
    }

    // Perform all response actions
    interaction.responses.forEach(action => {
      executeAction(action)
    })
  }

  /**
   * 🔥 Check whether the conditions are met
   */
  const checkCondition = (condition: InteractionEvent['condition'], value: any): boolean => {
    if (!condition) return true

    try {
      switch (condition.type) {
        case 'comparison':
          return checkComparisonCondition(condition.operator, value, condition.value)

        case 'range':
          return checkRangeCondition(value, condition.value)

        case 'expression':
          return checkExpressionCondition(value, condition.value)

        default:
          console.warn(`🔥 [InteractionEngine] Unknown condition type: ${condition.type}`)
          return true
      }
    } catch (error) {
      console.error(`🔥 [InteractionEngine] Condition check failed:`, error)
      return false
    }
  }

  /**
   * 🔥 Check comparison conditions
   */
  const checkComparisonCondition = (operator: string, actualValue: any, expectedValue: any): boolean => {
    switch (operator) {
      case 'equals':
        return actualValue == expectedValue
      case 'notEquals':
        return actualValue != expectedValue
      case 'greaterThan':
        return Number(actualValue) > Number(expectedValue)
      case 'greaterThanOrEqual':
        return Number(actualValue) >= Number(expectedValue)
      case 'lessThan':
        return Number(actualValue) < Number(expectedValue)
      case 'lessThanOrEqual':
        return Number(actualValue) <= Number(expectedValue)
      case 'contains':
        return String(actualValue).includes(String(expectedValue))
      case 'startsWith':
        return String(actualValue).startsWith(String(expectedValue))
      case 'endsWith':
        return String(actualValue).endsWith(String(expectedValue))
      default:
        console.warn(`🔥 [InteractionEngine] unknown comparison operator: ${operator}`)
        return false
    }
  }

  /**
   * 🔥 Check range conditions
   */
  const checkRangeCondition = (value: any, rangeValue: string): boolean => {
    try {
      // Simple range format：min-max or >min or <max
      const numValue = Number(value)

      if (rangeValue.includes('-')) {
        const [min, max] = rangeValue.split('-').map(Number)
        return numValue >= min && numValue <= max
      } else if (rangeValue.startsWith('>')) {
        const min = Number(rangeValue.substring(1))
        return numValue > min
      } else if (rangeValue.startsWith('<')) {
        const max = Number(rangeValue.substring(1))
        return numValue < max
      }

      return false
    } catch (error) {
      console.error(`🔥 [InteractionEngine] Range condition parsing failed:`, error)
      return false
    }
  }

  /**
   * 🔥 Check expression conditions
   */
  const checkExpressionCondition = (value: any, expression: string): boolean => {
    try {
      // Simple expression evaluation（Only supports basic operations，security considerations）
      // This can be expanded to a more complex expression engine
      const safeExpression = expression.replace(/value/g, String(value))

      // Basic mathematical expression evaluation
      if (/^[\d\s+\-*/.()><=!&|]+$/.test(safeExpression)) {
        return Function(`"use strict"; return (${safeExpression})`)()
      }

      return false
    } catch (error) {
      console.error(`🔥 [InteractionEngine] Expression condition evaluation failed:`, error)
      return false
    }
  }

  /**
   * 🔥 Register component property listener
   */
  const registerPropertyWatcher = (componentId: string, propertyName: string, interactions: InteractionEvent[]) => {
    // Find the target component
    const targetNode = editorStore.nodes.find(node => node.id === componentId)
    if (!targetNode) {
      console.warn(`🔥 [InteractionEngine] Failed to register attribute monitoring，Component not found: ${componentId}`)
      return
    }

    // 🔥 passCard2PropsofwatchPropertyMethod to register a listener
    try {
      const targetElement = document.querySelector(`[data-component-id="${componentId}"]`)
      if (targetElement && (targetElement as any)?.__vueParentComponent?.exposed?.watchProperty) {
        const unwatch = (targetElement as any).__vueParentComponent.exposed.watchProperty(
          propertyName,
          (newValue: any, oldValue: any) => {

            // Perform related interactions
            interactions.forEach(interaction => {
              if (interaction.event === 'dataChange' && interaction.watchedProperty === propertyName) {
                executeInteraction(interaction, newValue)
              }
            })
          }
        )

        return unwatch
      }
    } catch (error) {
      console.error(`🔥 [InteractionEngine] Property listener registration failed:`, error)
    }

    return null
  }

  return {
    executeAction,
    executeInteraction,
    registerPropertyWatcher,
    checkCondition
  }
}

/**
 * 🔥 Global interaction engine instance
 */
export const interactionEngine = createInteractionEngine()