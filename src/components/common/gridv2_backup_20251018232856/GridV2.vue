<template>
  <!--
    GridV2（based on GridStack The smallest available package）
    - Direct reuse GridLayoutPlus of Props/Emits protocol，Easy to replace seamlessly
    - use v-for Render grid items，And in onMounted + nextTick Later by GridStack take over（makeWidget）
    - Default slot exposed { item }，Keep the same writing method as the original caller
  -->
  <div class="grid-v2-wrapper">
    <!-- GridStack container：Must have .grid-stack Class name -->
    <div class="grid-stack" ref="gridEl" :class="props.containerClass" :style="gridContainerInlineStyle">
      <div
        v-for="item in props.layout"
        :key="getItemId(item)"
        class="grid-stack-item"
        :id="getItemId(item)"
        :gs-id="getItemId(item)"
        :gs-x="item.x"
        :gs-y="item.y"
        :gs-w="item.w"
        :gs-h="item.h"
        :gs-min-w="item.minW"
        :gs-min-h="item.minH"
        :gs-max-w="item.maxW"
        :gs-max-h="item.maxH"
        :gs-no-move="isNoMove(item) ? 'true' : undefined"
        :gs-no-resize="isNoResize(item) ? 'true' : undefined"
      >
        <div class="grid-stack-item-content">
          <!-- Default slot：exposed to the outside world { item }，The calling method remains the same as GridLayoutPlus consistent -->
          <slot :item="item">
            <!-- Secret content（Visible during debugging） -->
            <div class="fallback">
              <b>{{ getItemId(item) }}</b>
              <small>({{ item.x }},{{ item.y }}) {{ item.w }}x{{ item.h }}</small>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GridV2 - Optimized version
 * 
 * 🔥 Fix dragging lag issue：
 * 1. remove excessiveCSS !importantrule
 * 2. simplifywidgetmanagement logic
 * 3. reduce unnecessaryDOMoperate
 * 4. Optimize event handling process
 */

// enable native HTML5 drag/Zoom plugin
import 'gridstack/dist/dd-gridstack'
// introduce GridStack Required basic styles
import 'gridstack/dist/gridstack.min.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridStack, type GridStackNode, type GridItemHTMLElement, type GridStackOptions } from 'gridstack'
import type { GridLayoutPlusProps, GridLayoutPlusEmits, GridLayoutPlusItem } from '@/components/common/grid/gridLayoutPlusTypes'

// Reuse GridLayoutPlus of props / emits protocol
const props = defineProps<GridLayoutPlusProps>()
const emit = defineEmits<GridLayoutPlusEmits>()

// Grid Containers and instances
const gridEl = ref<HTMLDivElement | null>(null)// Status management
let grid: GridStack | null = null
let isInitialized = false
let pendingLayoutUpdate = false

// 🔥 Performance optimization：Anti-shake and throttling control
let changeEventTimer: number | null = null
let widgetRegistrationTimer: number | null = null
let isProcessingChange = false

// 🔥 record the lastlayoutquantity，Used to detect delete operations
let previousLayoutCount = 0

// 🔥 record the last layout hash，Used to prevent cyclic updates
let lastLayoutHash = ''

const COLUMN_STYLE_PREFIX = 'gridstack-column-style'

/** Unified debugging output */
function debugLog(...args: unknown[]): void {
}

// Get unique entries uniformly ID
const idKey = computed<string>(() => (props.idKey && props.idKey.length > 0 ? props.idKey : 'i'))
const getItemId = (item: GridLayoutPlusItem): string => {
  const k = idKey.value
  const v = (item as unknown as Record<string, unknown>)[k]
  return String((v ?? item.i) as string)
}

// Determine whether drag and drop is disabled
function isNoMove(item: GridLayoutPlusItem): boolean {
  if (props.readonly) return true
  if (props.config?.isDraggable === false) return true
  if ((item as unknown as { static?: boolean }).static === true) return true
  if ((item as unknown as { isDraggable?: boolean }).isDraggable === false) return true
  return false
}

// Determine whether scaling is disabled
function isNoResize(item: GridLayoutPlusItem): boolean {
  if (props.readonly) return true
  if (props.config?.isResizable === false) return true
  if ((item as unknown as { static?: boolean }).static === true) return true
  if ((item as unknown as { isResizable?: boolean }).isResizable === false) return true
  return false
}

/**
 * 🔥 critical fix：Anti-shakechangeevent handling
 * - Use anti-shake to avoid frequent updates
 * - Batch processing of multiple node changes
 * - Avoid state inconsistencies and performance issues
 */
function handleChange(_event: Event, changed: GridStackNode[] | undefined): void {
  if (!changed || changed.length === 0 || pendingLayoutUpdate || isProcessingChange) return

  debugLog('GridStack changeevent:', changed.length, 'node changes')

  // 🔥 Anti-shake processing：Avoid frequent layout updates
  if (changeEventTimer) {
    clearTimeout(changeEventTimer)
  }

  changeEventTimer = window.setTimeout(() => {
    isProcessingChange = true
    
    try {
      // based on current props.layout Generate new layout
      const newLayout: GridLayoutPlusItem[] = props.layout.map((it) => ({ ...it }))

      changed.forEach((node) => {
        const id = String(node.id)
        const idx = newLayout.findIndex((it) => getItemId(it) === id)
        if (idx >= 0) {
          if (typeof node.x === 'number') newLayout[idx].x = node.x
          if (typeof node.y === 'number') newLayout[idx].y = node.y
          if (typeof node.w === 'number') newLayout[idx].w = node.w
          if (typeof node.h === 'number') newLayout[idx].h = node.h
        }
      })

      // reveal events
      emit('layout-change', newLayout)
      emit('update:layout', newLayout)
      emit('layout-updated', newLayout)
      
      debugLog('Layout update completed，Number of nodes:', newLayout.length)
    } catch (err) {
      console.error('[GridV2] Layout update failed:', err)
    } finally {
      isProcessingChange = false
      changeEventTimer = null
    }
  }, 16) // about60fpsupdate frequency
}

/**
 * 🔥 critical fix：Anti-shakewidgetlife cycle management
 * - Use anti-shake to avoid frequentDOMoperate
 * - Intelligent managementwidgetAdding and removing
 * - Avoid duplicate registration and performance issues
 */
function ensureNewWidgetsRegistered(): void {
  if (!grid) return

  console.log('🔍 [GridV2] ensureNewWidgetsRegistered called')

  // 🔥 Anti-shake processing：avoid frequentwidgetoperate
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
  }

  widgetRegistrationTimer = window.setTimeout(() => {
    if (!grid) return

    console.log('🔍 [GridV2] Start executionwidgetmanage（After anti-shake）')

    try {
      // 🔥 first step：Collect what should currently existwidget ID
      const currentLayoutIds = new Set(props.layout.map(item => getItemId(item)))
      console.log('🔍 [GridV2] currentlayoutinIDs:', Array.from(currentLayoutIds))

      // 🔥 Step 2：Remove those no longer neededwidgets
      const existingNodes = grid.getGridItems()
      console.log('🔍 [GridV2] GridStackThe number of existing nodes in:', existingNodes.length)

      let removedWidgetCount = 0
      existingNodes.forEach((el: GridItemHTMLElement) => {
        const node = el.gridstackNode
        const nodeId = String(node?.id)
        console.log(`🔍 [GridV2] Check node [${nodeId}], Is therelayoutmiddle: ${currentLayoutIds.has(nodeId)}`)

        if (node && !currentLayoutIds.has(nodeId)) {
          console.log(`🗑️ [GridV2] Remove obsoletewidget: ${nodeId}`)
          grid!.removeWidget(el, false) // falseIndicates not triggeringchangeevent
          removedWidgetCount++
        }
      })

      console.log(`🔍 [GridV2] Remove statistics: ${removedWidgetCount} indivualwidget`)

      // 🔥 Step 3：DetectionlayoutChanges in deletion（Through the previous and currentlayoutQuantity comparison）
      // becauseDOMquiltVueWhen removingGridStackNot triggeredremovedevent，need to passlayoutQuantitative changes to detect
      const currentLayoutCount = props.layout.length
      console.log(`🔍 [GridV2] LayoutQuantity comparison: last time=${previousLayoutCount}, current=${currentLayoutCount}`)

      const actuallyRemovedCount = previousLayoutCount - currentLayoutCount

      if (actuallyRemovedCount > 0 && removedWidgetCount === 0) {
        console.log(`🗑️ [GridV2] detected ${actuallyRemovedCount} components were deleted（passlayoutChange detection）`)
        removedWidgetCount = actuallyRemovedCount
      }

      // Update record，for next comparison
      previousLayoutCount = currentLayoutCount

      // 🔥 Step 4：Register newwidgets
      let newWidgetCount = 0
      const newWidgets: HTMLElement[] = []

      props.layout.forEach((item) => {
        const id = getItemId(item)
        const el = gridEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) as GridItemHTMLElement | null

        // Only called for new unregistered nodesmakeWidget
        if (el && !el.gridstackNode) {
          debugLog('Register newwidget:', id)
          try {
            grid!.makeWidget(el)
            newWidgetCount++
            newWidgets.push(el)
          } catch (err) {
            console.warn('[GridV2] makeWidgetfail:', id, err)
          }
        }
      })

      // 🔥 Step 5：Handle automatic rearrangement after addition or deletion
      const needsCompact = removedWidgetCount > 0

      if (needsCompact) {
        debugLog(`deleted ${removedWidgetCount} components`)

        // ✅ Determine whether to automatically fill gaps based on configuration
        const shouldCompact = props.config?.verticalCompact !== false
        if (shouldCompact) {
          debugLog('Trigger automatic reordering（Fill in the gaps after deletion）')
          grid.compact()  // ✅ One line of code to do it，GridStack Built-in optimization algorithms
        }

        // ❌ Deleted 80+ Line custom rearrangement algorithm code
        // ❌ All manual settings removed left/top code
        // GridStack of compact() The method already handles the layout correctly！
      }


      debugLog(`WidgetManagement completed，New: ${newWidgetCount}，Current total: ${grid.getGridItems().length}`)
    } catch (err) {
      console.error('[GridV2] Widgetmanagement failure:', err)
    } finally {
      widgetRegistrationTimer = null
    }
  }, 50) // 50msAnti-shake delay
}

/**
 * 🔥 critical fix：Performance optimization configuration based on official documentation
 * - useGridStackBuilt-in column management
 * - avoid!importantstyle conflict
 * - Optimize drag and drop performance and response speed
 */
function ensureColumnStyles(columnCount: number): void {
  if (columnCount <= 12) return

  const styleId = `${COLUMN_STYLE_PREFIX}-${columnCount}`
  if (document.getElementById(styleId)) return

  const rules: string[] = []
  for (let i = 1; i <= columnCount; i++) {
    const widthPercent = ((i / columnCount) * 100).toFixed(4)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[data-gs-width="${i}"] { width: ${widthPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[data-gs-width="${i}"] { width: ${widthPercent}% }`)
  }

  for (let x = 0; x < columnCount; x++) {
    const leftPercent = ((x / columnCount) * 100).toFixed(4)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[data-gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[data-gs-x="${x}"] { left: ${leftPercent}% }`)
  }

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = rules.join('\n')
  document.head.appendChild(style)
}

function createOptionsFromProps(): GridStackOptions {
  const config = props.config || {}

  debugLog('createGridStackConfiguration，enterconfig:', config)

  // 🔥 repair：Correctly map configuration fields
  const columnCount = Number(config.colNum) || 24 // The unified default is24List
  const rowHeightValue = Number(config.rowHeight) || 80 // default80pxrow height

  // 🔥 Will horizontalGap / verticalGap mapped to GridStack Native margin
  let horizontalGap = config.horizontalGap
  if (horizontalGap === undefined && Array.isArray(config.margin)) {
    horizontalGap = config.margin[0]
  }
  let verticalGap = config.verticalGap
  if (verticalGap === undefined && Array.isArray(config.margin)) {
    verticalGap = config.margin[1]
  }

  const normalizedHorizontalGap = Number.isFinite(Number(horizontalGap)) ? Number(horizontalGap) : 0
  const normalizedVerticalGap = Number.isFinite(Number(verticalGap)) ? Number(verticalGap) : 0
  const marginValue = `${normalizedVerticalGap}px ${normalizedHorizontalGap}px`

  // ✅ Correct mapping GridLayoutPlus Configuration到 GridStack Configuration
  //
  // User needs：
  // 1. verticalCompact: true  → Allows automatic compact arrangement
  // 2. verticalCompact: false → No automatic rearrangement（Maintain user layout after refresh）
  //
  // GridStack of float Behavior：
  // - float: false → compact mode（Automatically fill gaps）
  // - float: true  → float mode（Maintain user layout，Don't autofill）
  //
  // Correct mapping：
  // - verticalCompact: true  → float: false（Allows automatic compaction）
  // - verticalCompact: false → float: true （Maintain user layout）
  const shouldFloat = config.verticalCompact === false

  // Basic configuration
  const options: GridStackOptions = {
    // 核心布局配置
    column: columnCount,
    cellHeight: rowHeightValue,

    // 🔥 use GridStack Native margin Management level/vertical spacing
    margin: marginValue,

    // Interactive configuration
    disableDrag: props.readonly || config.isDraggable === false,
    disableResize: props.readonly || config.isResizable === false,
    staticGrid: props.readonly || config.staticGrid === true,

    // ✅ key：Correct mapping float Configuration
    float: shouldFloat,

    // ❌ Erroneous ones deleted preventCollision mapping
    // GridStack No preventCollision Configuration items
    // Collision detection is performed by float Configuration control

    removable: false, // Disable removal，Reduce event listening
    acceptWidgets: false, // Disable external drag-in，Reduce complexity
    
    // 🔥 Performance optimization：Animation and style configuration
    animate: false, // Disable animation to improve dragging fluidity
    alwaysShowResizeHandle: false, // Only show zoom handles on hover
    
    // 🔥 Performance optimization：Drag and drop configuration
    draggable: {
      // Limit dragging area，Prevent infinite scrolling
      scroll: false,
      // Use more efficient drag and drop handling
      appendTo: 'parent',
      // Optimize drag handle
      handle: '.grid-stack-item-content'
    },
    
    // 🔥 Performance optimization：scaling configuration
    resizable: {
      // Limit the number of zoom handles，Improve performance
      handles: 'se'
    },
    
    // Other configurations
    rtl: config.isMirrored || false,
    oneColumnModeDomSort: true,

    // 🔥 critical fix：Style injection must be enabled，Otherwise, the column width calculation will fail.
    // GridStack need to be in <head> dynamic injection CSS to set the width percentage of each column
    // For example：.grid-stack.grid-stack-24 > .grid-stack-item[gs-w="1"] { width: 4.1667% }
    styleInHead: true, // Must be true，Otherwise, when the number of columns is switched, the width of the component becomes 0

    // 🔥 Mobile optimization
    oneColumnSize: 768 // Mobile terminal single column threshold
  }

  console.log('🔧 [GridV2] GridStackInitial configuration:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    float: options.float,
    disableDrag: options.disableDrag,
    disableResize: options.disableResize,
    staticGrid: options.staticGrid,
    'source-verticalCompact': config.verticalCompact,
    horizontalGap: normalizedHorizontalGap,
    verticalGap: normalizedVerticalGap
  })
  debugLog('GridStackInitial configuration:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    disableDrag: options.disableDrag,
    disableResize: options.disableResize,
    staticGrid: options.staticGrid
  })
  return options
}

/**
 * 🔥 critical fix：Simplified initialization logic
 */
function initGrid(): void {
  if (!gridEl.value || isInitialized) return

  debugLog('initializationGridStack')
  
  // Clean up old instances
  if (grid) {
    grid.destroy(false)
    grid = null
  }

  // Create new instance
  const options = createOptionsFromProps()
  console.log('🔍 [GridV2] initializationGridStack，Configuration:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    styleInHead: options.styleInHead
  })
  ensureColumnStyles(options.column || 12)
  grid = GridStack.init(options, gridEl.value)
  console.log('🔍 [GridV2] GridStackInstance creation completed，Current number of columns:', grid.getColumn())

  // Binding events
  grid.on('change', handleChange)

  // 🔥 New：Drag and drop start event monitoring
  grid.on('dragstart', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // Check the location of all components，See what collision detection is based on
    const allItems = grid.getGridItems()

    console.log(`🎯 [GridV2] Drag and drop to start [${node.id}]:`, {
      initialx: node.x,
      initialy: node.y,
      Current number of columns: grid?.getColumn(),
      currentfloat: grid?.opts.float,
      Before dragginginline: el.style.cssText.substring(0, 150)
    })

    // Detailed output of the location of each component
    console.log('📍 The position of all components when dragging starts:')
    allItems.forEach((item: GridItemHTMLElement, index) => {
      const n = item.gridstackNode
      const style = window.getComputedStyle(item)
      console.log(`  components${index} [${n?.id}]:`, {
        'data-x': n?.x,
        'data-y': n?.y,
        'computed-left': style.left,
        'computed-position': style.position,
        'inline-left': item.style.left,
        'inline-position': item.style.position
      })
    })
  })

  // 🔥 New：Drag and drop event monitoring（Throttle，Avoid too many logs）
  let dragLogTimer: number | null = null
  grid.on('drag', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node || dragLogTimer) return

    dragLogTimer = window.setTimeout(() => {
      console.log(`🎯 [GridV2] Dragging [${node.id}]:`, {
        currentx: node.x,
        currenty: node.y,
        Dragginginline: el.style.cssText.substring(0, 100)
      })
      dragLogTimer = null
    }, 200) // 200msThrottle
  })

  // Drag end event
  grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // ✅ Just emit event，GridStack Positioning has been processed
    debugLog('End of drag:', node.id, node.x, node.y)
    emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)

    // ❌ All manual settings removed left/top code
    // GridStack The location has been set correctly internally！
  })

  // Zoom end event
  grid.on('resizestop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // ✅ Just emit event，GridStack Already taken care of positioning and sizing
    debugLog('Zoom ends:', node.id, node.w, node.h)
    emit('item-resized', String(node.id), node.h ?? 0, node.w ?? 0, 0, 0)

    // ❌ All manual settings removed left/top code
    // GridStack Internally the position and size have been set correctly！
  })

  // 🔥 Listen to component deletion events，Trigger automatic reordering
  grid.on('removed', (_e: Event, items: GridItemHTMLElement[]) => {
    debugLog(`Component is deleted，quantity: ${items.length}`)

    if (!grid) return

    // ✅ Determine whether to automatically fill gaps based on configuration
    const shouldCompact = props.config?.verticalCompact !== false
    if (shouldCompact) {
      debugLog('Trigger automatic reordering（Fill in the gaps after deletion）')
      grid.compact()
    }

    // ❌ All manual settings removed left/top code
    // GridStack of compact() The method already handles the layout correctly！
  })

  isInitialized = true

  // Next frame registrationwidgets
  nextTick(() => {
    ensureNewWidgetsRegistered()

    // 🔥 Initialization record：Set initiallayoutquantity
    previousLayoutCount = props.layout.length
    debugLog('initialization previousLayoutCount =', previousLayoutCount)

    // ✅ GridStack Initial positioning has been handled correctly
    // ❌ All manual settings removed left/top code
    // ❌ All mandatory resize events and repetitions update() call

    debugLog('GridStackInitialization completed')
  })
}

/**
 * ✅ Optimized column number switching function
 * trust GridStack of column() method，No manual intervention in positioning
 */
async function updateColumns(newCol: number): Promise<void> {
  if (!Number.isFinite(newCol) || !grid || !gridEl.value) return

  const currentCol = grid.getColumn()
  if (currentCol === newCol) {
    debugLog('The number of columns has not changed，Skip updates')
    return
  }

  try {
    debugLog('Column number switching:', currentCol, '→', newCol)

    // step1: Make sure the style is available
    ensureColumnStyles(newCol)

    // step2: use GridStack official API Switch number of columns
    // ✅ use 'moveScale' Strategy，Automatically scale component width and position
    grid.column(newCol, 'moveScale')

    // step3: wait GridStack Complete update
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
    if (grid) {
      grid.column(newCol, true)
    }
    debugLog('Column switching completed')
  } catch (err) {
    console.error('❌ [GridV2] Column number switching failed:', err)
    // Force reinitialization on error
    if (grid) {
      grid.destroy(false)
      grid = null
    }
    isInitialized = false
    nextTick(() => {
      initGrid()
    })
  }
}

/**
 * 🔥 New：Common configuration update function
 * When the line is high、When configuration changes such as spacing，Need to reinitializeGridStackExample
 */
function updateGridConfig(): void {
  if (!grid) return

  debugLog('Configuration changes，ReinitializeGridStack')

  try {
    // Configuration changes require reinitializationGridStackExample
    const wasInitialized = isInitialized
    isInitialized = false

    // Destroy old instance
    grid.destroy(false)
    grid = null

    // Reinitialize
    if (wasInitialized) {
      nextTick(() => {
        initGrid()
      })
    }
  } catch (err) {
    console.error('[GridV2] Configuration update failed:', err)
    // force reinitialization
    isInitialized = false
    grid = null
    nextTick(() => {
      initGrid()
    })
  }
}

// Compute container style
const gridContainerInlineStyle = computed(() => {
  const config = props.config || {}
  const styles: Record<string, string> = {}

  // minimum height
  if (config.minH) {
    styles.minHeight = `${config.minH}px`
  }

  return styles
})

// life cycle
onMounted(() => {
  nextTick(() => {
    initGrid()
  })
})

onBeforeUnmount(() => {
  debugLog('Component destroyed，clean upGridStackInstances and timers')
  
  // 🔥 Clear all timers，Avoid memory leaks
  if (changeEventTimer) {
    clearTimeout(changeEventTimer)
    changeEventTimer = null
  }
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
    widgetRegistrationTimer = null
  }
  
  // clean upGridStackExample
  if (grid) {
    grid.destroy(false)
    grid = null
  }
  
  // reset state
  isInitialized = false
  isProcessingChange = false
  pendingLayoutUpdate = false
})

// 🔥 Monitor layout changes（With circulation protection）
watch(
  () => props.layout,
  (newLayout) => {
    if (!isInitialized) return

    // 🔥 critical fix：calculate layout of hash，Avoid repeated processing of the same data
    const newHash = JSON.stringify(newLayout)
    if (newHash === lastLayoutHash) {
      debugLog('Layout Data has not changed，Skip updates')
      return
    }
    lastLayoutHash = newHash

    pendingLayoutUpdate = true
    nextTick(() => {
      ensureNewWidgetsRegistered()
      pendingLayoutUpdate = false
    })
  },
  { deep: true }
)

// Monitor column number changes
watch(
  () => props.config?.colNum,
  (newCol, oldCol) => {
    if (newCol !== oldCol && newCol) {
      updateColumns(Number(newCol))
    }
  }
)

// 🔥 New：Monitor row height changes
watch(
  () => props.config?.rowHeight,
  (newHeight, oldHeight) => {
    if (newHeight !== oldHeight && newHeight && isInitialized) {
      debugLog('row height change，from', oldHeight, 'arrive', newHeight)
      updateGridConfig()
    }
  }
)

// 🔥 New：Listen for spacing changes
watch(
  () => props.config?.margin,
  (newMargin, oldMargin) => {
    // Deep comparison array
    const marginChanged = JSON.stringify(newMargin) !== JSON.stringify(oldMargin)
    if (marginChanged && isInitialized) {
      debugLog('spacing change，from', oldMargin, 'arrive', newMargin)
      updateGridConfig()
    }
  },
  { deep: true }
)

// 🔥 New：Monitor landscape/Longitudinal spacing（New configuration fields）
watch(
  () => [props.config?.horizontalGap, props.config?.verticalGap],
  (newGap, oldGap) => {
    if (!isInitialized) return
    if (!oldGap || newGap[0] !== oldGap[0] || newGap[1] !== oldGap[1]) {
      debugLog('spacing(Gap)change，from', oldGap, 'arrive', newGap)
      updateGridConfig()
    }
  }
)

// Monitor drag and drop/Zoom switch
watch(
  () => [props.config?.isDraggable, props.config?.isResizable, props.readonly],
  () => {
    if (!grid) return
    
    const isDraggable = !props.readonly && props.config?.isDraggable !== false
    const isResizable = !props.readonly && props.config?.isResizable !== false
    
    debugLog('Update interaction status:', { isDraggable, isResizable })
    
    // useGridStackBuilt-in method to update status
    grid.enableMove(isDraggable)
    grid.enableResize(isResizable)
  }
)
</script>

<style scoped>
.grid-v2-wrapper {
  width: 100%;
  height: 100%;
  /* 🔥 Make sure the container doesn't interfere withGridStackpositioning */
  position: relative;
  overflow: visible;
}

/* 🔥 critical fix：Minimize style distractions，letGridStackManage yourself */
.grid-stack {
  width: 100%;
  height: 100%;
  /* 🔥 make sureGridStackContainer positioned correctly */
  position: relative;
  /* 🔥 Disable styles that may interfere with dragging */
  touch-action: none;
  user-select: none;
}

/* 🔥 optimizationgrid-stack-item-contentstyle，avoid conflict */
.grid-stack-item-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  /* 🔥 Make sure content doesn’t interfere with dragging */
  pointer-events: auto;
  position: relative;
}

/* 🔥 Ensure that styles do not conflict when dragging */
.grid-stack-item.ui-draggable-dragging .grid-stack-item-content {
  pointer-events: none;
}

.fallback {
  padding: 8px;
  background: #f0f0f0;
  border: 1px dashed #ccc;
  border-radius: 4px;
  text-align: center;
  /* 🔥 make surefallbackContent does not interfere with dragging */
  pointer-events: none;
}

/* 🔥 Global style reset，make sureGridStackworking normally */
:deep(.grid-stack-item) {
  /* make sureGridStackThe default style of */
  touch-action: none;
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  /* Optimization when dragging */
  z-index: 1000;
  opacity: 0.8;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  /* Optimization when zooming */
  z-index: 1000;
}
</style>


