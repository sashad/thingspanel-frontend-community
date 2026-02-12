# GridV2 Component problem analysis（independent conclusion）

This article is aimed at `src/components/common/gridv2/GridV2.vue` realization，Independent analysis of the current“Components are arranged out of order/overlapping”and“right GridStack Unfamiliar use leads to reinventing the wheel”root cause of the problem，and give repair suggestions。Does not rely on existing document content in the same directory。

## Main symptoms
- 多List（>12 List，especially 24/50 List）Down，Component width is abnormal after rendering for the first time or switching the number of columns、Overlapping or misaligned。
- After removing the component，The remaining components are out of place or appear“Teleport”；drag/Visual and data are out of sync after zooming。
- renew `layout` recurring events、Status jitter，Dragging experience is stuck。

## root cause location（Key points）
- Wrong column width style selector and class name handling
  - Manually injecting the selector is `.gs-${n} > .grid-stack-item[...]`（See GridV2.vue:369），but GridStack The standard is the container class name `grid-stack grid-stack-${n}`。At the same time, the non-existent ones were also cleaned up. `gs-\d+` kind（about 526 near the line）。This will result in >12 Column width rule does not take effect，Causing layout confusion。
- Anti-patterns of inline positioning and repeated layout logic
  - Multiple manual settings `style.left/top/position` and frequently `grid.update(...)`（like 329/330/331、690/691/692、804/805/806 wait），and GridStack Internal layout mechanism conflict，trigger multiple times reflow and事件连锁，causing jitter and misalignment。
- Option mapping errors and semantic misunderstandings
  - Not yet `config.preventCollision` passed to GridStack，Instead, it is set conditionally `disableOneColumnMode`（See 439–442），Completely irrelevant to needs；right `float / verticalCompact / compact()` The semantic understanding of，Called again when deleting `compact()`（745），Subvert user layout expectations。
- Column number switching strategy and API Improper use
  - use `grid.column(newCol, 'none')` and self-implementing“Row fill rearrangement + Inline positioning”process（about 950–1150）。This is related to GridStack Built-in column switching conflicts with reordering capabilities，It is easy to cause the state to be out of sync。
- Node registration/Improper timing of removal
  - right v-for 生成of DOM again `makeWidget`/`removeWidget`（231/197），and Vue life cycle and GridStack of `addWidget/removeWidget` Inconsistent correct usage，May generate ghost nodes、重复事件and内存风险。
- Inconsistent spacing strategy
  - Will `margin` fixed to 0，Use instead content padding implement distance，Causes the visual boundary to be inconsistent with the collision area，Affect hit/Collision judgment and expected layout effect。

## Suggested repair route
1) let GridStack Fully taken over sizing and positioning
   - Remove all pairs inline `left/top/position:absolute` Manual settings and batch synchronization logic；reserve `styleInHead: true`，Let official style injection take effect。
2) Correct column width style and class name
   - delete `injectColumnStyles()` and `.gs-${n}` Relevant logic；Don't clean up `gs-\d+`；rely GridStack of `.grid-stack.grid-stack-${n}` rule。
3) Correctly map configuration
   - Explicitly passed in `preventCollision`；avoid mapping it to `disableOneColumnMode`。Use with caution `float` and `compact()`，Don't contradict yourself。
4) Column switching and layout
   - use `grid.column(newCol, 'moveScale' | 'compact')` Wait for the official strategy；Only read node data and write back after switching，Does not rearrange itself/position。
5) Node management
   - first time `GridStack.init()` read DOM；Dynamically add new items `addWidget()`，For deletion `removeWidget()`；Remove the pair v-for Duplication of nodes `makeWidget`。
6) spacing
   - priority use GridStack `margin`（Support array/Pixel）。If necessary use content padding，Should be unified into one place and impact of collision hits evaluated。

## Quick verification suggestions
- exist 24 under column layout，After removing custom injection and inline positioning，Switch number of columns、drag、Deletions should all remain stable and non-overlapping；turn on `preventCollision: true` Verify that collisions are as expected。

---
If required，I can submit a version based on the above route“Minimal package modification”，Remove custom layout and style injection logic，Only keep props/emits Compatibility layer，Dramatically reduce confusion and maintenance costs。
