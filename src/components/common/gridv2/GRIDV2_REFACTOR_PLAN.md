# GridV2 Refactoring plan（Column number switching + Adjustable spacing）

in conclusion：Keep and make the most of GridStack（Current version ^9.5.1）ability。GridStack Native support for dynamic column number switching（`grid.column()`）with level/Vertical spacing configuration（`margin`），No need for self-implemented positioning and style injection。

## Target
- The number of columns can be switched stably（No overlap、Not random“Teleport”）。
- Spacing can be adjusted independently（level/vertical），Consistent with collision determination。
- Remove manually inline Positioning and custom column width style injection，Reduce complexity and jitter。

## ability matching
- Column number switching：`grid.column(newCol, doLayout)`
  - recommend：`doLayout = 'moveScale'`（Maintain relative width ratio，Common expectations）。
  - alternative：`doLayout = true`（Recalculate layout）or `false`（Cut columns only，immobile node）。
- spacing adjustment：`options.margin` accept numbers or CSS string（support 1/2/4 value），Can control vertical and horizontal separately，like：`"8px 16px"`（vertical 8px，level 16px）。

## Key points of transformation
1) option mapping（Initialize only once）
- `column = config.colNum`
- `cellHeight = config.rowHeight`
- `margin = toCssMargin(config.verticalGap, config.horizontalGap)`（Otherwise fall back `config.margin`）
- `preventCollision = config.preventCollision`
- `staticGrid = props.readonly || config.staticGrid`
- the remaining：`styleInHead: true`，`animate: false`，`acceptWidgets: false`

2) Column number switching（Remove self-layout/Inline synchronization）
- monitor `config.colNum`：`grid.column(newCol, 'moveScale')`
- like `config.verticalCompact === true`，Can be called once after switching `grid.compact()`；Otherwise do not call。
- no longer：Inject custom column width CSS、no longer改写 `style.left/top/position`。

3) spacing adjustment（Native margin）
- monitor `horizontalGap/verticalGap`：
  - if exists `grid.margin` API：`grid.margin(`${vGap}px ${hGap}px`)`。
  - If not API：Destroy and rebuild with the same layout parameters（read `grid.engine.nodes` for layout，`GridStack.init({...})`）。

4) Layout synchronization strategy（streamline）
- initial：Depend on DOM + `GridStack.init()` take over。
- Running：
  - Externally driven layout updates → use `grid.load(layout)` or batch `grid.batchUpdate()` + `grid.update(el, node)` application；don't write inline style。
  - User drag/Zoom → monitor `change`，merge `grid.getGridItems()` of `gridstackNode`，`emit('update:layout', newLayout)`。

5) Remove anti-patterns
- delete：`injectColumnStyles()`、clean up `gs-\d+` Class name、all inline `left/top/position` synchronous、right v-for Node duplicates `makeWidget/removeWidget`。

## Verification Checklist
- 12→24→12 Column switching：No overlap；Relative width maintained（`moveScale`）。
- spacing：`(h,v)=(0,0)→(8,8)→(16,8)→(16,16)`，Visually consistent with collision（Drag bounds correct）。
- delete/After adding a new node：did not appear“Teleport”，`change` The layout of event output is consistent with rendering。

## milestone
- M1：Remove custom style/Positioning and registration logic，Keep native behavior。
- M2：Number of columns/Implementation of distance monitoring and mapping，Complete regression testing。
- M3：Streamlined event exposure and type definitions，Supplementary usage examples and documentation。
