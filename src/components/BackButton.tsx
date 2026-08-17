import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppNav } from '@/navigation/NavigationProvider';
import { matchRoute } from '@/navigation/routes';

interface BackButtonProps {
  /** 无来源（如直接打开 URL）时的默认返回路径，缺省取路由配置 fallback */
  fallback?: string;
  /** 无来源时的默认按钮文字（如"菜谱"）。有来源时自动显示来源名 */
  label?: string;
  className?: string;
  /**
   * 自定义内容（完全接管渲染，不做动态文字）。
   * 需要"← 来源名"动态文字的页面不要传 children，改用 label。
   */
  children?: ReactNode;
}

/**
 * 统一页面返回按钮：返回导航栈记录的来源页（NavigationProvider 维护），
 * 无来源时返回路由配置的 fallback。传 label 时显示「← 来源名」。
 */
export function BackButton({
  fallback,
  label,
  className = 'btn btn-ghost',
  children,
}: BackButtonProps) {
  const { backLabel, goBack } = useAppNav();
  const location = useLocation();
  const rule = matchRoute(location.pathname);
  const finalFallback = fallback ?? rule?.fallback ?? '/';
  const displayLabel = backLabel ?? label ?? rule?.defaultLabel;

  return (
    <button className={className} onClick={() => goBack(finalFallback)}>
      {children ?? (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {displayLabel}
        </>
      )}
    </button>
  );
}
