import type { ComponentPreset } from '@/card2.1/core2';

/**
 * @description Default configuration
 * @summary defined `access` a default instance of the component，Can be dragged and used directly in the editor。
 */
export default [
  {
    id: 'access.default',
    title: 'Default traffic card',
    description: 'A standard traffic statistics card，Show the total number of visits to the system。'
    // props: {}, // Since the component is not configurable props，This item is empty
    // interaction: {}, // Interactive behaviors can be preset here，For example, click to jump to a specific page
    // layout: { w: 2, h: 2 }, // You can preset the default size of the component in the canvas
  },
] as ComponentPreset[];