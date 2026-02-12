/**
 * Grid Layout algorithm tool function
 * Specialized in handling layout calculations、location lookup、Collision detection and other algorithms
 */

import type { GridLayoutPlusItem, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * Find available locations
 */
export function findAvailablePosition(
  layout: GridLayoutPlusItem[],
  w: number,
  h: number,
  cols: number = 12,
  startY: number = 0
): { x: number; y: number } {
  try {
    // Simple location finding algorithm
    for (let y = startY; y < startY + 100; y++) {
      for (let x = 0; x <= cols - w; x++) {
        const proposed = { x, y, w, h }

        // Check for conflicts with existing projects
        const hasCollision = layout.some(item => {
          return !(
            proposed.x + proposed.w <= item.x ||
            proposed.x >= item.x + item.w ||
            proposed.y + proposed.h <= item.y ||
            proposed.y >= item.y + item.h
          )
        })

        if (!hasCollision) {
          return { x, y }
        }
      }
    }

    // If the location cannot be found，Return to bottom
    const maxY = Math.max(0, ...layout.map(item => item.y + item.h))
    return { x: 0, y: maxY }
  } catch (error) {
    console.error('Failed to find available position:', error)
    return { x: 0, y: startY }
  }
}

/**
 * Optimize finding available locations（more efficient algorithm）
 */
export function findOptimalPosition(
  layout: GridLayoutPlusItem[],
  w: number,
  h: number,
  cols: number = 12,
  preferredX?: number,
  preferredY?: number
): { x: number; y: number; score: number } {
  try {
    const candidates: Array<{ x: number; y: number; score: number }> = []

    // If there is a preferred location，Check first
    if (preferredX !== undefined && preferredY !== undefined) {
      const candidate = { x: preferredX, y: preferredY, score: 0 }
      if (isPositionAvailable(layout, preferredX, preferredY, w, h, cols)) {
        candidate.score = 100 // highest score
        candidates.push(candidate)
      }
    }

    // Search for the best location
    const maxY = Math.max(10, ...layout.map(item => item.y + item.h))

    for (let y = 0; y < maxY + 5; y++) {
      for (let x = 0; x <= cols - w; x++) {
        if (isPositionAvailable(layout, x, y, w, h, cols)) {
          // Calculate position score（The further up and to the left, the better）
          const score = calculatePositionScore(x, y, w, h, layout, cols)
          candidates.push({ x, y, score })
        }
      }
    }

    // If no available locations are found，Return to bottom position
    if (candidates.length === 0) {
      const bottomY = Math.max(0, ...layout.map(item => item.y + item.h))
      return { x: 0, y: bottomY, score: 0 }
    }

    // Return the position with the highest score
    return candidates.reduce((best, current) => (current.score > best.score ? current : best))
  } catch (error) {
    console.error('Failed to find optimal position:', error)
    return { x: 0, y: 0, score: 0 }
  }
}

/**
 * Check if location is available
 */
export function isPositionAvailable(
  layout: GridLayoutPlusItem[],
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  excludeId?: string
): boolean {
  try {
    // Check boundaries
    if (x < 0 || y < 0 || x + w > cols) {
      return false
    }

    // Check for collisions
    const proposed = { x, y, w, h }
    return !layout.some(item => {
      if (excludeId && item.i === excludeId) return false

      return !(
        proposed.x + proposed.w <= item.x ||
        proposed.x >= item.x + item.w ||
        proposed.y + proposed.h <= item.y ||
        proposed.y >= item.y + item.h
      )
    })
  } catch (error) {
    console.error('Failed to check position availability:', error)
    return false
  }
}

/**
 * Calculate position score
 */
function calculatePositionScore(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: GridLayoutPlusItem[],
  cols: number
): number {
  try {
    let score = 1000

    // Yposition penalty（The higher the score, the lower the score）
    score -= y * 10

    // XSlight penalty for position（Left is better）
    score -= x * 2

    // Bonus points for edge positions
    if (x === 0) score += 5 // left edge
    if (x + w === cols) score += 3 // right edge

    // Bonus points for adjacencies to existing projects
    for (const item of layout) {
      // vertical adjacency
      if ((item.y + item.h === y || y + h === item.y) && !(x + w <= item.x || x >= item.x + item.w)) {
        score += 20 // vertically adjacent
      }

      // horizontal adjacency
      if ((item.x + item.w === x || x + w === item.x) && !(y + h <= item.y || y >= item.y + item.h)) {
        score += 15 // horizontally adjacent
      }
    }

    return Math.max(0, score)
  } catch (error) {
    console.error('Failed to calculate position score:', error)
    return 0
  }
}

/**
 * compact layout algorithm
 */
export function compactLayout(
  layout: GridLayoutPlusItem[],
  cols: number,
  verticalCompact: boolean = true
): GridLayoutPlusItem[] {
  if (!verticalCompact || layout.length === 0) return layout

  try {
    // according toYCoordinate sorting，Make sure we approach projects from top to bottom
    const sortedLayout = [...layout].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x
      return a.y - b.y
    })

    // Used to store processed and placed items
    const compacted: GridLayoutPlusItem[] = []

    for (const item of sortedLayout) {
      // Start at the top to find new ones for the current projectYcoordinate
      let newY = 0

      // Continue to increaseYcoordinate，until you find one that doesn't match `compacted` The position where any item collides in
      while (!isPositionAvailable(compacted, item.x, newY, item.w, item.h, cols)) {
        newY++
      }

      // Place the item in the first available location found
      compacted.push({
        ...item,
        y: newY
      })
    }

    return compacted
  } catch (error) {
    console.error('Failed to compact layout:', error)
    return layout
  }
}

/**
 * Sort layout items
 */
export function sortLayout(
  layout: GridLayoutPlusItem[],
  sortBy: 'position' | 'size' | 'id' = 'position'
): GridLayoutPlusItem[] {
  try {
    const sorted = [...layout]

    switch (sortBy) {
      case 'position':
        return sorted.sort((a, b) => {
          if (a.y === b.y) return a.x - b.x
          return a.y - b.y
        })

      case 'size':
        return sorted.sort((a, b) => {
          const aSize = a.w * a.h
          const bSize = b.w * b.h
          return bSize - aSize // Big one first
        })

      case 'id':
        return sorted.sort((a, b) => a.i.localeCompare(b.i))

      default:
        return sorted
    }
  } catch (error) {
    console.error('Failed to sort layout:', error)
    return layout
  }
}

/**
 * Calculate layout bounds
 */
export function getLayoutBounds(layout: GridLayoutPlusItem[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
} {
  if (layout.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  }

  try {
    const minX = Math.min(...layout.map(item => item.x))
    const maxX = Math.max(...layout.map(item => item.x + item.w))
    const minY = Math.min(...layout.map(item => item.y))
    const maxY = Math.max(...layout.map(item => item.y + item.h))

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  } catch (error) {
    console.error('Failed to get layout bounds:', error)
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  }
}

/**
 * Calculate the overlapping area of ​​two items
 */
export function getOverlapArea(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): number {
  try {
    const left = Math.max(item1.x, item2.x)
    const right = Math.min(item1.x + item1.w, item2.x + item2.w)
    const top = Math.max(item1.y, item2.y)
    const bottom = Math.min(item1.y + item1.h, item2.y + item2.h)

    if (left >= right || top >= bottom) {
      return 0 // no overlap
    }

    return (right - left) * (bottom - top)
  } catch (error) {
    console.error('Failed to calculate overlap area:', error)
    return 0
  }
}

/**
 * Move items to new locations and handle collisions
 * @param layout - current layout
 * @param movingItem - Item being moved
 * @param newX - New for mobile itemsxcoordinate
 * @param newY - New for mobile itemsycoordinate
 * @param cols - The number of columns in the grid
 * @returns New layout after collision handling and compaction
 */
export function moveItemWithCollisionHandling(
  layout: GridLayoutPlusItem[],
  movingItem: GridLayoutPlusItem,
  newX: number,
  newY: number,
  cols: number
): GridLayoutPlusItem[] {
  // step1: Layout purification and standardization
  // Deep copy layout for modification，and normalize the coordinates of all items。
  // Address new additions（The coordinates are 'auto' or undefined）The core problem of being unable to participate in collision detection。
  const workingLayout = cloneLayout(layout).map(item => {
    // examinexandyWhether the coordinates are invalid values（Not a number、NaN、'auto'wait）。
    const isInvalidX = typeof item.x !== 'number' || isNaN(item.x);
    const isInvalidY = typeof item.y !== 'number' || isNaN(item.y);

    // Provides a temporary for invalid coordinates、Predictable starting position。
    // ifyInvalid coordinates，then assume it is at the top（y=0）。
    // ifxInvalid coordinates，then assume it is on the far left（x=0）。
    // This aligns the item's logical position with its initial visual position（Usually in the upper left corner）match。
    return {
      ...item,
      x: isInvalidX ? 0 : item.x,
      y: isInvalidY ? 0 : item.y,
    };
  });

  // step2: Update the position of a moved item
  // Find moving items in sanitized work layout。
  const movingItemInLayout = workingLayout.find(item => item.i === movingItem.i);
  // if not found（Theoretically it shouldn't happen），then return to the original layout to ensure safety。
  if (!movingItemInLayout) {
    return layout;
  }

  // Updates the position of the moved item to the new coordinates provided by the drag operation。
  movingItemInLayout.x = newX;
  movingItemInLayout.y = newY;

  // step3: Chain collision handling (BFS)
  // Use breadth first search（BFS）to handle chain collisions caused by moving items。
  const queue: GridLayoutPlusItem[] = [movingItemInLayout];
  // `movedItems` Used to track items that have been moved during this operation，Prevent repeated processing in the same chain reaction，Avoid infinite loops。
  const movedItems = new Set<string>([movingItemInLayout.i]);

  // Set the maximum number of iterations，Acts as a safety valve against infinite loops。
  let iterations = 0;
  const maxIterations = workingLayout.length * workingLayout.length;

  while (queue.length > 0) {
    iterations++;
    if (iterations > maxIterations) {
      console.error('moveItemWithCollisionHandling: Max iterations reached, aborting.');
      return layout; // Possible infinite loop detected，Return to original layout to avoid app freezing。
    }

    const currentItem = queue.shift()!;

    // Iterate over all other items in the layout to detect collisions with the current item。
    for (const other of workingLayout) {
      if (other.i === currentItem.i) continue;

      if (collides(currentItem, other)) {
        // if with static items（static=true）Collision occurs，This move is considered invalid，Return to original layout immediately。
        if (other.static) {
          return layout;
        }

        // The calculation will 'other' item pushed down to newycoordinate。
        const pushToY = currentItem.y + currentItem.h;

        // only if 'other' When the current position of the item is above the push target position，before performing the push。
        // This prevents unnecessary movement and potential loops。
        if (other.y < pushToY) {
          other.y = pushToY;

          // if 'other' Item is moved for the first time in this operation，then add it to the queue。
          // This ensures that subsequent collisions it causes will also be handled。
          if (!movedItems.has(other.i)) {
            movedItems.add(other.i);
            queue.push(other);
          }
        }
      }
    }
  }

  // step4: Compact layout
  // After all collision handling is complete，Compact the layout，Remove vertical gaps caused by pushing。
  return compactLayout(workingLayout, cols);
}

/**
 * Deep copy a layout array。
 * @param layout - layout to clone。
 * @returns Returns a new layout array，Completely independent from the original layout。
 */
function cloneLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  return JSON.parse(JSON.stringify(layout));
}

/**
 * Detect if two layout items collide。
 * @param item1 - first layout item。
 * @param item2 - second layout item。
 * @returns If two items overlap，then return true，Otherwise return false。
 */
function collides(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  if (item1.i === item2.i) return false;
  if (item1.x + item1.w <= item2.x) return false;
  if (item1.x >= item2.x + item2.w) return false;
  if (item1.y + item1.h <= item2.y) return false;
  if (item1.y >= item2.y + item2.h) return false;
  return true;
}
