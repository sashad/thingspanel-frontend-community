# GridV2 Detailed rectification plan for components

**Document version**: 1.0
**Creation date**: 2025-10-18
**Rectification priority**: P0 (highest priority)
**Estimated construction period**: 3-5 working days

---

## 📋 Table of contents

1. [Rectification background and goals](#1-Rectification background and goals)
2. [Component call chain analysis](#2-Component call chain analysis)
3. [Summary of core issues](#3-Summary of core issues)
4. [Rectification roadmap](#4-Rectification roadmap)
5. [Detailed implementation steps](#5-Detailed implementation steps)
6. [Test verification plan](#6-Test verification plan)
7. [Risk assessment and rollback planning](#7-Risk assessment and rollback planning)
8. [expected return](#8-expected return)

---

## 1. Rectification background and goals

### 1.1 current situation

GridV2 components (`src/components/common/gridv2/GridV2.vue`) is based on GridStack 9.5.1 packaged component,Used to provide grid layout functionality。However, the current implementation suffers from serious architectural flaws:

- **code size**: 1396 OK (overly complex)
- **total number of questions**: 12 a serious problem (3fatal level, 5severity level, 4warning level)
- **core root cause**: right GridStack Lack of understanding,A large number of repeated implementations of existing functions

### 1.2 Improvement goals

| target type | Specific indicators |
|---------|---------|
| **Code quality** | delete 300+ lines of redundant code,Reduce complexity 40% |
| **Functional stability** | Fix component overlap、Layout changes after refresh、Problems such as abnormal column number switching |
| **Performance improvements** | reduce 50% DOM operate,reduce 90% Log output |
| **maintainability** | establish clear GridStack Configure mapping mechanism,Simplify the initialization process |

### 1.3 Unchanged part

to reduce risk,The following parts**Not within the scope of this rectification**:

- ✅ Props/Emits Agreement remains unchanged (compatible GridLayoutPlus interface)
- ✅ The default slot usage remains unchanged
- ✅ parent component GridLayoutPlusWrapper The calling method remains unchanged

---

## 2. Component call chain analysis

### 2.1 Complete call chain

```
PanelEditorV2.vue (Visual editor root component)
  ├─ Responsibilities: Editor mode management、Toolbar、Left and right side panels
  ├─ Configuration: defaultRenderer = 'gridstack'
  └─> subcomponent: GridstackRenderer.vue

GridstackRenderer.vue (Renderer selection component)
  ├─ Responsibilities: deal with gridstack Renderer data sources and events
  ├─ Configuration: gridConfig (Inherit from parent component)
  └─> subcomponent: GridLayoutPlusWrapper.vue

GridLayoutPlusWrapper.vue (Configure processing components)
  ├─ Responsibilities: Will VisualEditorWidget Convert to GridLayoutPlusItem
  ├─ Configure calculations: colNum=24, preventCollision=true, verticalCompact=false
  └─> subcomponent: GridV2.vue

GridV2.vue (GridStack Encapsulated components) ⚠️ The object of this rectification
  ├─ Responsibilities: Encapsulation GridStack 9.5.1 Library
  ├─ question: A lot of manual intervention GridStack internal mechanism
  └─> underlying library: GridStack 9.5.1
```

### 2.2 Configure delivery path

```typescript
// PanelEditorV2.vue (Line 1110)
<GridstackRenderer
  :grid-config="editorConfig.gridConfig"  // ← Editor level configuration
/>

// GridstackRenderer.vue (passed to Wrapper)
<GridLayoutPlusWrapper
  :grid-config="gridConfig"  // ← Configuration with default values
/>

// GridLayoutPlusWrapper.vue (Line 132-172)
const gridConfig = computed<GridLayoutPlusConfig>(() => ({
  colNum: 24,
  rowHeight: 80,
  horizontalGap: 0,
  verticalGap: 0,
  preventCollision: true,      // ⚠️ GridStack Not recognized
  verticalCompact: false,      // ⚠️ need to be mapped to float
  isDraggable: !isReadOnly.value,
  isResizable: !isReadOnly.value
}))

// GridV2.vue (Line 387-501) ← Configure mapping logic (mistake)
function createOptionsFromProps(): GridStackOptions {
  const shouldFloat = false  // ❌ mistake: always false
  return {
    column: columnCount,
    float: shouldFloat,  // ❌ should be based on verticalCompact Dynamic settings
    // ...
  }
}
```

### 2.3 Key findings

1. **Configuration mismatch**: `GridLayoutPlusConfig` Interface with `GridStackOptions` Not entirely corresponding
   - `preventCollision` → GridStack There is no such option (should pass `float` control)
   - `verticalCompact` → GridStack use `float` (Opposite semantics)

2. **Configuration mapping error** (Line 415-436):
   ```typescript
   // user expectations: verticalCompact: false → No automatic rearrangement
   // Current implementation: float: false → Will automatically rearrange ❌
   // Correct mapping: verticalCompact: false → float: true
   ```

---

## 3. Summary of core issues

based on `CRITICAL_ISSUES_ANALYSIS.md` and `GRIDV2_ANALYSIS.md`,Summarize core issues:

### 🔴 fatal problem (Critical)

| question | Location | Influence | root cause |
|-----|------|------|------|
| #1: Manual setting left/top | 676-696, 714-730, 788-816, 1059-1095 | Wrong component location、dragging lag、Column number overlaps after switching | distrust GridStack positioning system |
| #2: Implement the rearrangement algorithm yourself | 254-337 (80OK) | Components are arranged in confusion、Poor performance | Don't understand GridStack of `compact()` method |
| #3: Manual positioning after switching the number of columns | 1055-1095 | Column number overlaps after switching、Collision detection failure | don't understand GridStack of `column()` mechanism |

### 🟠 serious problem (High)

| question | Location | Influence | root cause |
|-----|------|------|------|
| #4: Manually inject column width styles | 355-379 | memory leak (Styles pile up after switching multiple times) | Partially repeated GridStack of `styleInHead` |
| #5: float Configuration confusion | 415-436, 889-1152 | Layout changes after refresh (Change from vertical to horizontal) | don't understand float the true meaning of |
| #6: Manually fix container class names | 1031-1048 | cover up the real problem | GridStack Class names should be updated automatically |
| #7: A lot console.log | full text 150+ at | Production environment control panel pollution | Not used debugLog function |
| #8: repeat update() call | 809-814 Many places | Wasted performance、May flash | Manual setting style 后又call update() |

### 🟡 Warning question (Medium)

| question | Location | Influence |
|-----|------|------|
| #9: Listener cycle update risk | 1256-1268 | Possible infinite loop |
| #10: makeWidget Timing issue | 223-238 | DOM Called when unstable |
| #11: Spacing implementation is not intuitive | 1190-1221 | set up 10px Actual display 20px |
| #12: The initialization process is complicated | 506-880 | Up to 5 layer async,The timing is complex |

---

## 4. Rectification roadmap

### Stage division

```
[Stage one] Remove manual intervention code (P0, 2sky)
    ├─ Remove all manual settings left/top code
    ├─ Remove custom reordering algorithm
    └─ Remove code that manually fixes class names

[Stage 2] Fix configuration mapping (P0, 1sky)
    ├─ repair verticalCompact → float mapping
    ├─ repair preventCollision processing
    └─ simplify injectColumnStyles logic

[Stage three] Simplify the initialization process (P1, 1sky)
    ├─ Combine multiple layers of asynchronous delays
    ├─ optimization makeWidget opportunity
    └─ Add strict loop protection

[Stage four] Performance and logging optimization (P2, 0.5sky)
    ├─ Replace all console.log for debugLog
    ├─ Remove duplicates update() call
    └─ Optimize spacing implementation

[Stage five] Test verification (P0, 0.5sky)
    └─ 24column layout、drag、delete、Column number switching full process test
```

---

## 5. Detailed implementation steps

### 5.1 Stage one: Remove manual intervention code (P0)

#### step 1.1: Delete manual positioning after dragging

**Location**: Line 676-696

**current code** (❌ mistake):
```typescript
grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
  const node = el.gridstackNode

  // 🔥 mistake: Manually reset all componentsleft/top
  const currentColumn = grid.getColumn()
  const cellHeight = grid.getCellHeight()

  allItems.forEach((item: GridItemHTMLElement) => {
    const n = item.gridstackNode
    const leftPercent = ((n.x ?? 0) / currentColumn) * 100
    const topPx = (n.y ?? 0) * cellHeight

    item.style.left = `${leftPercent}%`      // ❌ delete
    item.style.top = `${topPx}px`            // ❌ delete
    item.style.position = 'absolute'         // ❌ delete
  })

  emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)
})
```

**Modified code** (✅ correct):
```typescript
grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
  const node = el.gridstackNode
  if (!node) return

  // ✅ Just emit event, GridStack Positioning has been processed
  debugLog('End of drag:', node.id, node.x, node.y)
  emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)

  // ❌ Remove all manual settings left/top code
  // GridStack The location has been set correctly internally！
})
```

**The same modifications are applied to**:
- Line 714-730 (After zooming ends)
- Line 757-769 (After deletion)
- Line 788-816 (during initialization)
- Line 1059-1095 (When switching the number of columns)

---

#### step 1.2: Remove custom reordering algorithm

**Location**: Line 254-337 (about 80 OK)

**current code** (❌ mistake):
```typescript
// 🔥 Rearrangement algorithm written by myself (80lines of code)
const needsCompact = newWidgetCount > 0 || removedWidgetCount > 0

if (needsCompact) {
  // step1: Collect all existing components
  const allItems = grid.getGridItems()
  const nodes: Array<{ el: GridItemHTMLElement; node: GridStackNode }> = []

  // step2: according toyThenxsort
  nodes.sort((a, b) => {
    if (a.node.y !== b.node.y) return (a.node.y ?? 0) - (b.node.y ?? 0)
    return (a.node.x ?? 0) - (b.node.x ?? 0)
  })

  // step3-7: Temporarily enabledfloat, Batch update, Recalculate position... (70OK)
  // ❌ Delete all
}
```

**Modified code** (✅ correct):
```typescript
// ✅ use GridStack built-in methods
const needsCompact = removedWidgetCount > 0

if (needsCompact) {
  debugLog(`deleted ${removedWidgetCount} components，Trigger automatic reordering`)

  // ⚠️ Notice: Only called when the user expects gaps to be filled automatically compact()
  // if verticalCompact: false, then it should not be called (Maintain user layout)
  const shouldCompact = props.config?.verticalCompact !== false
  if (shouldCompact) {
    grid.compact()  // One line of code to do it
  }
}

// ❌ delete 200+ Line custom reflow code
```

**Key understanding**:
- `compact()` yes GridStack Built-in optimized algorithms
- No manual sorting required、Calculate position、set up inline style
- Whether to call `compact()` Should be determined based on user configuration

---

#### step 1.3: Remove manual fix container class name

**Location**: Line 1031-1048

**current code** (❌ mistake):
```typescript
// === step5: Check and fix container class names ===
const expectedClass = `gs-${newCol}`

// Clean out all the old onesgs-XXClass name
const classList = Array.from(gridEl.value.classList)
classList.forEach(className => {
  if (/^gs-\d+$/.test(className) && className !== expectedClass) {
    gridEl.value!.classList.remove(className)  // ❌ Should not require manual repair
  }
})

// Add new class name（if does not exist）
if (!gridEl.value.classList.contains(expectedClass)) {
  gridEl.value.classList.add(expectedClass)  // ❌ GridStack should be added automatically
}
```

**Modified code** (✅ correct):
```typescript
// ✅ Remove all code that manually fixes class names
// GridStack.column() The method will automatically update the container class name

// ⚠️ If the class name is not updated, illustrate GridStack Incorrect usage
// The root cause should be investigated, instead of manual repair
```

---

### 5.2 Stage 2: Fix configuration mapping (P0)

#### step 2.1: repair float Configuration mapping

**Location**: Line 415-436

**current code** (❌ mistake):
```typescript
// 🔥 Wrong understanding and mapping
const shouldVerticalCompact = config.verticalCompact !== false
const shouldFloat = false  // ❌ always use false

const options: GridStackOptions = {
  float: shouldFloat,  // ❌ wrong mapping
  // ...
}
```

**GridStack float the true meaning of**:

| float value | meaning | 拖拽hour | compact()hour | After refresh |
|---------|------|--------|------------|--------|
| `false` | compact mode | Automatically push away other components | ✅Automatically fill gaps | possible rearrangement |
| `true` | float mode | Does not push away other components | ❌Do not fill gaps | keep layout |

**Correct mapping relationship**:

| 用户Configuration | user expectations | GridStack Configuration |
|---------|---------|---------------|
| `verticalCompact: true` | Allows automatic compaction | `float: false` |
| `verticalCompact: false` | Maintain user layout | `float: true` |

**Modified code** (✅ correct):
```typescript
function createOptionsFromProps(): GridStackOptions {
  const config = props.config || {}

  // ✅ Correct mapping verticalCompact arrive float
  // verticalCompact: true  → float: false (Allows automatic compaction)
  // verticalCompact: false → float: true  (Not automatically compact，keep layout)
  const shouldFloat = config.verticalCompact === false

  const options: GridStackOptions = {
    column: Number(config.colNum) || 24,
    cellHeight: Number(config.rowHeight) || 80,
    margin: 0,
    float: shouldFloat,  // ✅ according to verticalCompact Dynamic settings

    disableDrag: props.readonly || config.isDraggable === false,
    disableResize: props.readonly || config.isResizable === false,
    staticGrid: props.readonly || config.staticGrid === true,

    // ... Other configurations
  }

  debugLog('Floatmapping:', {
    verticalCompact: config.verticalCompact,
    float: shouldFloat,
    illustrate: shouldFloat ? 'Maintain user layout' : 'Allows automatic compaction'
  })

  return options
}
```

---

#### step 2.2: repair preventCollision Configuration

**Location**: Line 439-442

**current code** (❌ mistake):
```typescript
// ❌ mistake: Will preventCollision mapped to disableOneColumnMode
...(config.preventCollision !== undefined ? { disableOneColumnMode: false } : {}),
```

**Problem analysis**:
- `preventCollision` and `disableOneColumnMode` completely irrelevant
- GridStack **No** `preventCollision` Configuration items
- Collision detection is passed `float` controlled

**Modified code** (✅ correct):
```typescript
// ✅ delete wrong preventCollision mapping
// GridStack The collision detection passes float control:
// - float: false → Automatically push other components away when dragging (Prevent overlap)
// - float: true  → Allow free placement (May overlap, but still subject to collision detection)

// ⚠️ If the user really needs"No overlap at all"behavior,
// Custom validation can be added to the drag event (Not recommended)
```

---

#### step 2.3: Simplify column width style injection

**Location**: Line 355-379

**Current issues**:
- After switching the number of columns multiple times `<head>` accumulation in large quantities `<style>` Label
- No cleanup of old styles

**Modified code** (✅ correct):
```typescript
function injectColumnStyles(columnCount: number): void {
  const styleId = `gridstack-column-${columnCount}`

  // 1. Clean up all old column width styles（Not the current column number）
  document.querySelectorAll('style[id^="gridstack-column-"]').forEach(style => {
    if (style.id !== styleId) {
      style.remove()
      debugLog('Clean up old styles:', style.id)
    }
  })

  // 2. If the current style already exists，jump over
  if (document.getElementById(styleId)) {
    debugLog('Style already exists:', styleId)
    return
  }

  // 3. only in >12 List时需要注入（GridStack Supported by default 1-12 List）
  if (columnCount > 12) {
    const rules: string[] = []
    for (let i = 1; i <= columnCount; i++) {
      const widthPercent = ((i / columnCount) * 100).toFixed(4)
      rules.push(`.gs-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
    }

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = rules.join('\n')
    document.head.appendChild(style)

    debugLog(`Injected ${columnCount} column width style`)
  } else {
    debugLog(`${columnCount} Listed by GridStack Built-in style support，No need to inject`)
  }
}
```

---

### 5.3 Stage three: Simplify the initialization process (P1)

#### step 3.1: simplify initGrid() function

**Location**: Line 506-880

**Current issues**:
- Up to 5 layer async (synchronous init → nextTick → setTimeout 100ms → setTimeout 100ms → window.resize)
- The timing is complex, Difficult to debug

**Modified code** (✅ correct):
```typescript
async function initGrid(): Promise<void> {
  if (!gridEl.value || isInitialized) return

  debugLog('initialization GridStack')

  // 1. Clean up old instances
  if (grid) {
    grid.destroy(false)
    grid = null
  }

  // 2. Create new instance
  const options = createOptionsFromProps()
  grid = GridStack.init(options, gridEl.value)

  // 3. Inject style（if needed）
  const targetColumn = options.column || 12
  if (targetColumn > 12) {
    injectColumnStyles(targetColumn)
  }

  // 4. Binding events
  grid.on('change', handleChange)
  grid.on('dragstop', handleDragStop)
  grid.on('resizestop', handleResizeStop)
  grid.on('removed', handleRemoved)

  // 5. wait Vue Complete rendering
  await nextTick()

  // 6. register widgets
  await ensureNewWidgetsRegistered()

  isInitialized = true

  debugLog('GridStack Initialization completed')

  // ❌ Delete all setTimeout Delay and window.resize event
  // ❌ Remove manual settings left/top code
  // GridStack Everything has been taken care of！
}
```

---

#### step 3.2: optimization ensureNewWidgetsRegistered()

**Location**: Line 165-347

**Current issues**:
- Vue of v-for Rendering may not be complete yet, DOM May be unstable
- missing pair DOM Readiness check

**Modified code** (✅ correct):
```typescript
async function ensureNewWidgetsRegistered(): Promise<void> {
  if (!grid) return

  debugLog('ensureNewWidgetsRegistered called')

  // 🔥 Anti-shake processing（50ms）
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
  }

  return new Promise((resolve) => {
    widgetRegistrationTimer = window.setTimeout(async () => {
      if (!grid) {
        resolve()
        return
      }

      try {
        // wait DOM renew
        await nextTick()

        // wait one more frame，Make sure the browser has finished rendering
        await new Promise(r => requestAnimationFrame(r))

        const currentLayoutIds = new Set(props.layout.map(item => getItemId(item)))

        // Remove old widgets
        const existingNodes = grid.getGridItems()
        existingNodes.forEach((el: GridItemHTMLElement) => {
          const node = el.gridstackNode
          const nodeId = String(node?.id)

          if (node && !currentLayoutIds.has(nodeId)) {
            debugLog('Remove obsolete widget:', nodeId)
            grid!.removeWidget(el, false)
          }
        })

        // Register new widgets
        props.layout.forEach((item) => {
          const id = getItemId(item)
          const el = gridEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) as GridItemHTMLElement | null

          if (el && !el.gridstackNode) {
            // 🔥 Check if the element is actually in DOM middle
            if (!document.body.contains(el)) {
              console.warn('[GridV2] Element is not present DOM middle:', id)
              return
            }

            try {
              grid!.makeWidget(el)
              debugLog('Register new widget:', id)
            } catch (err) {
              console.error('[GridV2] makeWidget fail:', id, err)
            }
          }
        })

        debugLog('Widget Management completed')
      } catch (err) {
        console.error('[GridV2] Widget management failure:', err)
      } finally {
        widgetRegistrationTimer = null
        resolve()
      }
    }, 50)
  })
}
```

---

#### step 3.3: Add loop guard

**Location**: Line 1256-1268

**Current issues**:
- may trigger layout update loop

**Modified code** (✅ correct):
```typescript
// Add to layout hash Compare，Avoid repeated processing of the same data
let lastLayoutHash = ''

watch(
  () => props.layout,
  (newLayout) => {
    if (!isInitialized) return

    // calculate layout of hash，Avoid repeated processing of the same data
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
```

---

### 5.4 Stage four: Performance and logging optimization (P2)

#### step 4.1: Replace all console.log for debugLog

**Full text about 150+ at**, Batch replacement:

```typescript
// ❌ current（Production environment pollution）
console.log('🔍 [GridV2] ensureNewWidgetsRegistered called')
console.log('🔧 [GridV2] step1: Prepare to switch the number of columns')

// ✅ After modification（Controllable debug output）
debugLog('ensureNewWidgetsRegistered called')
debugLog('step1: Prepare to switch the number of columns')
```

**debugLog Function implementation**:
```typescript
// Enable debug logs in the development environment
const DEBUG = import.meta.env.DEV

function debugLog(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[GridV2]', ...args)
  }
}
```

---

#### step 4.2: Remove duplicates update() call

**Location**: Line 809-814 Many places

**current code** (❌ mistake):
```typescript
// Already set manually inline style
el.style.left = `${leftPercent}%`
el.style.top = `${topPx}px`
el.style.position = 'absolute'

// call again update() set the same value ❌
grid!.update(el, {
  x: node.x,
  y: node.y,
  w: node.w,
  h: node.h
})
```

**Modified code** (✅ correct):
```typescript
// ✅ plan1: Just call update(), let GridStack handle everything
grid.update(el, { x, y, w, h })
// ❌ Don't set it manually style

// ✅ plan2: full trust GridStack, Not called update()
// GridStack Will automatically update when needed
```

---

#### step 4.3: Optimize spacing implementation（Optional）

**Location**: Line 1190-1221

**Current issues**:
- use content padding achieve spacing
- set up 10px The actual visual spacing is 20px (Each of the two components padding 10px)

**Option one: use GridStack of margin**:
```typescript
const options: GridStackOptions = {
  margin: horizontalGap,  // Assuming the same horizontal and vertical spacing
  // ...
}
```

**Option two: Adjustment CSS algorithm**:
```typescript
const gridContainerInlineStyle = computed(() => {
  const config = props.config || {}
  let horizontalGap = config.horizontalGap ?? 0
  let verticalGap = config.verticalGap ?? 0

  // ⚠️ padding method results in doubling the spacing，need to be divided by 2
  return {
    '--h-gap': `${horizontalGap / 2}px`,
    '--v-gap': `${verticalGap / 2}px`
  }
})
```

---

### 5.5 Stage five: Column number switching optimization (P0)

#### step 5.1: simplify updateColumns() function

**Location**: Line 889-1152

**current code**: about 260 OK，Contains extensive debug logs and manual intervention

**Modified code** (✅ correct):
```typescript
async function updateColumns(newCol: number): Promise<void> {
  if (!Number.isFinite(newCol) || !grid || !gridEl.value) return

  const currentCol = grid.getColumn()
  if (currentCol === newCol) {
    debugLog('The number of columns has not changed，Skip updates')
    return
  }

  try {
    debugLog('Column number switching:', currentCol, '→', newCol)

    // step1: Inject new column number style
    injectColumnStyles(newCol)

    // step2: use GridStack official API Switch number of columns
    // ⚠️ use 'moveScale' Strategy，Automatically scale component width and position
    grid.column(newCol, 'moveScale')

    // step3: wait GridStack Complete update
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    // step4: Read the new layout and emit
    const updatedLayout = Array.from(grid.getGridItems()).map((el: GridItemHTMLElement) => {
      const node = el.gridstackNode
      if (!node) return null
      return {
        i: String(node.id),
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 1,
        h: node.h ?? 1
      }
    }).filter(Boolean) as any[]

    emit('layout-change', updatedLayout)
    emit('update:layout', updatedLayout)

    debugLog('Column switching completed')

    // ❌ Remove all manual settings left/top code（OK 1055-1095）
    // ❌ Remove all manual calls update() code
    // ❌ Remove all code that manually fixes class names
    // GridStack Everything has been taken care of！

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
```

---

## 6. Test verification plan

### 6.1 Test environment preparation

1. **test page**: Use existing test path
   - `/test/data-binding-system-integration` (Data binding system integration testing)
   - or create new GridV2 Dedicated test page

2. **Test configuration**:
   ```typescript
   const testGridConfig = {
     colNum: 24,           // test >12 Column style injection
     rowHeight: 80,
     horizontalGap: 10,    // Test spacing
     verticalGap: 10,
     verticalCompact: false,  // test float mapping
     isDraggable: true,
     isResizable: true
   }
   ```

### 6.2 Functional test checklist

| test scenario | verification point | expected results |
|---------|--------|---------|
| **initial rendering** | 24 Column layout displays correctly | ✅ Component width is correct，No overlap |
| **Drag and move** | Drag the component to a new location | ✅ Drag and drop smoothly，Accurate location，No lag |
| **Zoom** | Scale component size | ✅ Smooth zooming，Dimensions are accurate |
| **Remove component** | Delete a component | ✅ Remaining components remain in place（verticalCompact: false） |
| **Rearrange after deletion** | set up verticalCompact: true Delete later | ✅ Remaining components automatically fill gaps |
| **Column number switching** | 12 List ↔ 24 List switch | ✅ Component width automatically adjusts，No overlap |
| **refresh page** | Refresh after saving layout | ✅ The layout remains the same（Vertical arrangement remains unchanged horizontal arrangement） |
| **Collision detection** | Drag the component to the occupied position | ✅ Automatically push away other components（float: false） |
| **theme switching** | Toggle dark/Bright theme | ✅ Style variables are applied correctly |

### 6.3 Performance testing

1. **DOM Number of operations**:
   - use Chrome DevTools Performance panel
   - Record a trigger triggered by dragging DOM Update times
   - **expected**: reduce 50% above

2. **Memory leak testing**:
   - Repeatedly switch the number of columns 20 Second-rate (12 ↔ 24)
   - examine `<head>` in `<style>` Number of tags
   - **expected**: most 2 indivual (gridstack-column-12 and gridstack-column-24)

3. **console log**:
   - Production environment post-build testing
   - **expected**: none `[GridV2]` Log output at the beginning

### 6.4 Compatibility testing

1. **Browser compatible**:
   - Chrome (Latest version)
   - Firefox (Latest version)
   - Safari (Latest version)
   - Edge (Latest version)

2. **Responsive testing**:
   - desktop (1920x1080)
   - flat (768x1024)
   - move (375x667)

### 6.5 Regression testing

**Test whether the parent component functions normally**:
- GridLayoutPlusWrapper event delivery
- GridstackRenderer data source binding
- PanelEditorV2 Editor functions

---

## 7. Risk assessment and rollback planning

### 7.1 Risk identification

| risk level | Risk description | Scope of influence | Mitigation measures |
|---------|---------|---------|---------|
| 🔴 high | Wrong component position after removing manual positioning code | All uses GridV2 the page | Keep the current version as GridV2.backup.vue |
| 🟠 middle | float Refresh behavior changes after mapping modification | Saved layout configuration | Provide configuration migration script |
| 🟡 Low | Edge cases caused by performance optimization | special scene | Add edge case testing |

### 7.2 rollback plan

#### Quick rollback (< 5 minute)

1. **Back up current version**:
   ```bash
   cp src/components/common/gridv2/GridV2.vue src/components/common/gridv2/GridV2.backup.vue
   ```

2. **Git rollback command**:
   ```bash
   # If problems are found，Immediately roll back to the previous stable version
   git checkout HEAD~1 -- src/components/common/gridv2/GridV2.vue
   git commit -m "rollback GridV2 Rectify（Found problem）"
   ```

#### Phased release strategy

1. **stage 0: Create a feature branch**
   ```bash
   git checkout -b feature/gridv2-refactor
   ```

2. **stage 1-4: Submit step by step**
   - Each stage completed，Submit code once
   - Submit information clearly stating the modification content
   - For example: `feat(GridV2): Stage one - Remove manual targeting code`

3. **stage 5: Test verification**
   - Full test on test branch
   - Merge to master branch after passing all tests

4. **stage 6: Grayscale release（Optional）**
   - Use the function switch to control whether to enable the new version GridV2
   - Gradually increase the volume，Monitor online performance

### 7.3 emergency plan

**If serious problems arise after rectification**:

1. **Immediate measures**:
   - Stop promoting and using GridV2
   - Switch back to old version（GridV2.backup.vue）
   - Notify relevant developers

2. **Problem analysis**:
   - Collect error logs and user feedback
   - Analyze the root cause of the problem
   - Evaluate whether to fix or fully roll back

3. **Repair process**:
   - Fix issues on feature branches
   - Retest verification
   - Publish again

---

## 8. expected return

### 8.1 Code quality improvement

| index | current value | After rectification | Improvement |
|-----|--------|--------|---------|
| Lines of code | 1396 OK | ~800 OK | ↓ 43% |
| complexity (圈complexity) | high | middle | ↓ 40% |
| Duplicate code | 300+ OK | 0 | ↓ 100% |
| TypeScript Type coverage | 80% | 95% | ↑ 15% |

### 8.2 Functional stability

| question | Current status | After rectification |
|-----|---------|--------|
| Components overlap | ❌ appear frequently | ✅ Completely restored |
| Layout changes after refresh | ❌ Change from vertical to horizontal | ✅ Be consistent |
| Column number switching exception | ❌ Components overlap/dislocation | ✅ Smooth switching |
| dragging lag | ❌ Obvious lag | ✅ Smooth dragging |
| Dislocation after deletion | ❌ Remaining components bounce | ✅ Behavior by configuration |

### 8.3 Performance improvements

| index | current value | After rectification | Improvement |
|-----|--------|--------|---------|
| DOM Number of operations (Drag once) | ~20 Second-rate | ~10 Second-rate | ↓ 50% |
| Number of console logs (development environment) | 150+ strip | ~20 strip | ↓ 87% |
| Number of console logs (production environment) | 150+ strip | 0 strip | ↓ 100% |
| Memory usage (Switch number of columns 20 Second-rate) | continued growth | Stablize | ✅ fix leak |
| initialization time | ~500ms | ~200ms | ↓ 60% |

### 8.4 Development experience

| aspect | Improve content |
|-----|---------|
| **maintainability** | The code is concise and clear，conform to GridStack best practices |
| **readability** | Remove redundant logic，Comments clearly explain GridStack mechanism |
| **Debugging experience** | No log pollution in production environment，Development environment controllable debugging output |
| **Newbie friendly** | The code structure is clear，easy to understand GridStack Usage |
| **Scalability** | Based on official API，Easy to upgrade GridStack Version |

### 8.5 user experience

| aspect | Improve content |
|-----|---------|
| **Operational fluency** | drag/Zoom without lag，Respond quickly |
| **layout stability** | Layout remains consistent after refresh，As expected |
| **visual consistency** | Accurate component spacing，No overlapping misalignment |
| **interactive feedback** | Collision detection is accurate，Automatically pushing away logic is intuitive |

---

## 9. appendix

### 9.1 GridStack Official document reference

- **Official website**: https://gridstackjs.com/
- **API document**: https://github.com/gridstack/gridstack.js/tree/master/doc
- **Vue Example**: https://github.com/gridstack/gridstack.js/tree/master/demo

### 9.2 Quick Check on Key Concepts

#### float Configuration

```typescript
// float: false (compact mode)
// - Automatically push other components away when dragging
// - compact() Gaps will be filled automatically
// - May be rearranged after refresh

// float: true (float mode)
// - Do not push other components away when dragging
// - compact() Do not fill gaps
// - Keep original layout after refresh
```

#### column() method

```typescript
// Correct way to switch number of columns
grid.column(24, 'moveScale')  // Automatically scale component width and position
grid.column(24, 'move')       // keep width，Only adjust position
grid.column(24, 'scale')      // maintain position，scale width only
grid.column(24, 'none')       // Only update the number of columns，Do not move components
```

#### compact() method

```typescript
// Automatically fill gaps
grid.compact()           // Default compact arrangement
grid.compact('compact')  // compact arrangement
grid.compact('list')     // List arrangement
```

### 9.3 Common errors and solutions

| Error phenomenon | Possible reasons | solution |
|---------|---------|---------|
| The component width is 0 | Missing column width style | call `injectColumnStyles()` |
| Components overlap | float Configuration error | examine `float` value sum `verticalCompact` mapping |
| dragging lag | Manual setting inline style | Remove manual targeting code，trust GridStack |
| Layout changes after refresh | float: false lead to | set up `float: true` keep layout |
| Misalignment after column number switching | manual intervention GridStack | use `grid.column(newCol, 'moveScale')` |

---

## 10. Summarize

### core principles

1. **trust GridStack**: Remove all manual intervention GridStack internal mechanism code
2. **Correctly map configuration**: understand GridStack The true meaning of configuration，Correctly map user configuration
3. **Simplify the process**: Remove unnecessary asynchronous delays and complex logic
4. **Performance first**: reduce DOM operate，Optimize log output

### Key lessons

- ✅ First, systematically study the official documentation of the third-party library
- ✅ Trust the internal mechanisms of mature libraries，Don't over intervene
- ✅ If you encounter any problems, check the official website first. API，rather than implement it yourself
- ✅ Understand the true meaning of configuration，Avoid incorrect mapping

### After rectification GridV2 Features

- **concise**: from 1396 rows reduced to approx. 800 OK
- **Stablize**: Fix all known layout issues
- **Efficient**: reduce 50% DOM operate，Eliminate memory leaks
- **Easy to maintain**: Code clarity，conform to GridStack best practices

---

**end of document**

If you have any questions or need further clarification，Please refer to:
- `CRITICAL_ISSUES_ANALYSIS.md` - Detailed analysis of the problem
- `GRIDV2_ANALYSIS.md` - independent problem analysis
- GridStack Official documentation - https://gridstackjs.com/
