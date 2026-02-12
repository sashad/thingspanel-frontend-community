/**
 * gridv2 Module entry
 * - independent from common/grid，Easy to isolate experimental/Adaptation layer components
 * - exposed GridV2 Components and necessary types（Types are still reused gridLayoutPlusTypes）
 */
export { default as GridV2 } from './GridV2.vue'
export type { GridLayoutPlusProps, GridLayoutPlusEmits, GridLayoutPlusItem, GridLayoutPlusConfig } from '@/components/common/grid/gridLayoutPlusTypes'
