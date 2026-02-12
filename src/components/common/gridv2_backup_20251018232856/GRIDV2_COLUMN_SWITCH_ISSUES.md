# GridV2 Review of column number switching problem（secondary analysis）

Target：position“Modify the number of columns(colNum) produce Bug”new reasons，and provide executable repair suggestions。

## Phenomenon and impact
- Switch number of columns（like 12→24 or 24→36）hour，layout flash、Temporarily confused location，Occasional fallback to old layout。
- Repeated layout update events occur in some scenarios，Causing status thrashing or overwriting the latest results。

## root cause location
1) Dual-channel repeated triggering of layout updates（event storm）
- `grid.column(newCol, 'moveScale')` will trigger GridStack of `change` event；
- within component `handleChange()` meeting emit once `layout-change/update:layout`（src/components/common/gridv2/GridV2.vue:119）；
- `updateColumns()` After completion, manually emit once（src/components/common/gridv2/GridV2.vue:652-674）。
- result：Switch the number of columns at a time → At least two layout submissions，and upper-level monitoring（Wrapper of watch）fight with each other，Appears as flashing/rollback。

2) with parent layer adapter“Configuration changes → Restructure layout”compete with each other
- `GridLayoutPlusWrapper.vue` exist `props.gridConfig` Used when changing store Data reconstruction `layout`（src/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue:200-216）。
- During column number switching，GridV2 Driving layout changes、Wrapper Press the old again store value reconstruction layout，Competition between the two causes temporary confusion or coverage。

3) Invalid style injection path remains
- Old version `injectColumnStyles(newCol)` injection `.gs-${n}` selector，and GridStack `grid-stack-${n}` Mechanism mismatch，lead to >12 Column width not calculated correctly。

4) Column count strategy misaligned with business expectations
- use `'moveScale'` will be scaled by column proportions `w/x`。as business expectations“Keep grid units w constant，Only change relative width”，then should use `'none'`；If expected“Adaptive padding”，Use only `'moveScale'`/`true`。

## Repair suggestions（minimally intrusive）
- remove `updateColumns()` within emit，Unified by `handleChange()` Output layout；Or set during column number switching `suspendChangeEvents` Logo blocked once `handleChange()`。
- exist Wrapper right `gridConfig` of watch middle，special sentence `colNum`：Change the column and only update the configuration，Don't rebuild `layout` array（avoid remount/cover）。
- Remove `injectColumnStyles()` and `.gs-${n}` Relevant logic，completely dependent on `styleInHead: true` and `grid-stack-${n}`。
- Clear column number strategy：
  - to keep w Unit remains unchanged：`grid.column(newCol, 'none')`；
  - To scale with the number of columns：`'moveScale'`。Make a decision after it is consistent with product expectations。

## Implementation records
- [x] Remove `updateColumns()` explicit within emit，Change to `change` Unified write-back of events。
- [x] replace early `.gs-xx` Inject as `.grid-stack.grid-stack-${n}` Dynamic styles（cover >12 column scene）。
- [x] Wrapper no longer here `gridConfig` Rebuild layout on change，Sync drag only/scaling properties，Avoid layout override during column switching。
- [x] spacing instead GridStack `margin` manage，Horizontal and vertical gap Reinitialize configuration when changing，Cancel content padding plan。

## Acceptance Checklist
- Continuous row cutting（12↔24↔36）No flicker、No fallback；Layout is submitted only once，No duplicate events in the log。
- Drag and drop after changing the column/Zooming OK，`preventCollision` Take effect；Wrapper not rebuilt `layout` caused by“Teleport”disappear。
