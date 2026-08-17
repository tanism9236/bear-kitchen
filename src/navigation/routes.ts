/**
 * 路由集中配置：App 导航栈据此判定每个页面的类型与返回兜底。
 * 新模块（Shopping / Nutrition 等）只需在这里追加规则。
 */
export type RouteType = 'top' | 'detail';

export interface RouteRule {
  /** 匹配 pathname（不含 search） */
  pattern: RegExp;
  /** top = 顶级页（Tab 根页，进入即重置导航栈）；detail = 非顶级页 */
  type: RouteType;
  /** detail 页直开 URL / 无来源时的返回目标 */
  fallback?: string;
  /** 该页作为返回来源 / 兜底时的显示名 */
  defaultLabel?: string;
}

export const ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/recipes$/, type: 'top', defaultLabel: '菜谱' },
  { pattern: /^\/recipes\/new$/, type: 'detail', fallback: '/recipes', defaultLabel: '菜谱' },
  { pattern: /^\/recipes\/[^/]+$/, type: 'detail', fallback: '/recipes', defaultLabel: '菜谱' },
  { pattern: /^\/recipes\/[^/]+\/edit$/, type: 'detail', fallback: '/recipes', defaultLabel: '菜谱' },
  { pattern: /^\/plan$/, type: 'top', defaultLabel: '计划' },
  { pattern: /^\/plan\/[^/]+$/, type: 'detail', fallback: '/plan', defaultLabel: '计划' },
  { pattern: /^\/ingredients$/, type: 'top', defaultLabel: '食材' },
  { pattern: /^\/ingredients\/new$/, type: 'detail', fallback: '/ingredients', defaultLabel: '食材' },
  { pattern: /^\/ingredients\/[^/]+\/edit$/, type: 'detail', fallback: '/ingredients', defaultLabel: '食材' },
  { pattern: /^\/my$/, type: 'top', defaultLabel: '我的厨房' },
  { pattern: /^\/my\/members$/, type: 'detail', fallback: '/my', defaultLabel: '我的厨房' },
];

/** 按 pathname 匹配路由规则（自动剥离 search）。未知路由返回 undefined。 */
export function matchRoute(path: string): RouteRule | undefined {
  const pathname = path.split('?')[0];
  return ROUTE_RULES.find((r) => r.pattern.test(pathname));
}
