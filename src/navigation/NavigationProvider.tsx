import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { matchRoute } from './routes';

/**
 * App 级导航栈：由 Provider 自己记录"从哪进入当前页"，
 * 不依赖 location.state / sessionStorage 跨页传输（preview 面板会丢）。
 *
 * 栈内容 = 当前页的可返回来源链，栈顶 = 页面返回按钮的目标。
 * 属临时 UI 状态：仅镜像到 localStorage 用于刷新/异常重载恢复，
 * 不参与任何业务数据。
 */

interface StackEntry {
  /** 来源页路径（pathname + search） */
  path: string;
  /** 来源页显示名（如 plan.title / 菜谱） */
  label: string;
}

interface NavContextValue {
  /** 返回来源名（栈顶 label）。栈空时 undefined，由 BackButton 用默认文字兜底 */
  backLabel: string | undefined;
  /** 页面返回：pop 栈顶并 replace 导航。栈空时返回 fallback */
  goBack: (fallback: string) => void;
  /** 页面注册自己的显示名（usePageLabel 底层），供后续作为来源 label 使用 */
  setPageLabel: (path: string, label: string) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

const STACK_KEY = 'bk:nav-stack';
const SESSION_KEY = 'bk:nav-session';
const STACK_MAX = 10;
/** 新会话（无 sessionStorage 标记）时，仅恢复该时间窗口内的栈，避免隔天恢复旧链路 */
const RESTORE_WINDOW_MS = 10 * 60 * 1000;

/** BackButton 发起的返回导航标记（区分于表单保存等其他 replace） */
let pendingBack = false;

function sanitizeStack(raw: string | null): StackEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { stack?: unknown; ts?: number };
    if (!Array.isArray(parsed.stack)) return [];
    return parsed.stack
      .filter(
        (e): e is StackEntry =>
          !!e &&
          typeof (e as StackEntry).path === 'string' &&
          typeof (e as StackEntry).label === 'string' &&
          !!matchRoute((e as StackEntry).path)
      )
      .slice(-STACK_MAX);
  } catch {
    return [];
  }
}

/**
 * 恢复导航栈：
 * - 同会话刷新（sessionStorage 标记存在）→ 无条件恢复
 * - 新会话 → 仅恢复 10 分钟内的镜像（覆盖 preview 面板每次导航重建 context 的情况），
 *   隔天/隔夜打开 App 一律从干净栈开始
 */
function restoreStack(): StackEntry[] {
  try {
    let sameSession = false;
    try {
      sameSession = sessionStorage.getItem(SESSION_KEY) !== null;
    } catch {
      sameSession = false;
    }
    const raw = localStorage.getItem(STACK_KEY);
    if (!raw) return [];
    if (!sameSession) {
      try {
        const ts = (JSON.parse(raw) as { ts?: number }).ts ?? 0;
        if (Date.now() - ts > RESTORE_WINDOW_MS) return [];
      } catch {
        return [];
      }
    }
    return sanitizeStack(raw);
  } catch {
    return [];
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();

  const [stack, setStack] = useState<StackEntry[]>(restoreStack);
  const stackRef = useRef(stack);
  const labelRegistry = useRef(new Map<string, string>());
  const prevKey = useRef('');
  const firstRun = useRef(true);

  const key = location.pathname + location.search;

  // 栈同步到 ref + 镜像 localStorage（仅用于刷新恢复，不影响业务数据）
  useEffect(() => {
    stackRef.current = stack;
    try {
      localStorage.setItem(STACK_KEY, JSON.stringify({ stack, ts: Date.now() }));
    } catch {
      // 存储不可用时静默降级为纯内存栈
    }
  }, [stack]);

  // 首次挂载：标记会话、顶级页重置
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }
    if (matchRoute(location.pathname)?.type === 'top') {
      setStack([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 路由变更：按导航动作维护栈
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      prevKey.current = key;
      return;
    }
    const prev = prevKey.current;
    prevKey.current = key;
    const rule = matchRoute(key);

    if (navType === 'PUSH') {
      if (rule?.type === 'top') {
        // 底部 Tab / 回到顶级页：重置导航栈
        setStack([]);
        return;
      }
      // 前进进入详情页：来源 = 上一页
      const prevRule = matchRoute(prev);
      const label =
        labelRegistry.current.get(prev) ?? prevRule?.defaultLabel ?? '返回';
      setStack((s) => {
        if (s.length > 0 && s[s.length - 1].path === prev) return s; // 去重
        const next = [...s, { path: prev, label }];
        return next.length > STACK_MAX ? next.slice(next.length - STACK_MAX) : next;
      });
      return;
    }

    // POP（浏览器返回）或 REPLACE（BackButton / 表单保存）
    if (pendingBack) {
      pendingBack = false; // BackButton 点击时已同步 pop
      return;
    }
    const idx = stackRef.current.findIndex((e) => e.path === key);
    if (idx >= 0) {
      // 浏览器返回到栈中层：截断同步；编辑保存 replace 回原详情页：同理收敛
      setStack((s) => s.slice(0, idx));
      return;
    }
    if (rule?.type === 'top') setStack([]);
    // 其余情况（如新建保存 replace 到新详情页）：栈保持，来源不变
  }, [key, navType]);

  const goBack = (fallback: string) => {
    const s = stackRef.current;
    const entry = s[s.length - 1];
    if (entry) setStack(s.slice(0, -1));
    pendingBack = true;
    navigate(entry?.path ?? fallback, { replace: true });
  };

  const setPageLabel = (path: string, label: string) => {
    labelRegistry.current.set(path, label);
  };

  return (
    <NavContext.Provider
      value={{
        backLabel: stack.length > 0 ? stack[stack.length - 1].label : undefined,
        goBack,
        setPageLabel,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useAppNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useAppNav 必须在 NavigationProvider 内使用');
  return ctx;
}

/** 页面声明自己的显示名（如 PlanDetail 传 plan.title），作为被返回时的按钮文字 */
export function usePageLabel(label: string | undefined) {
  const { setPageLabel } = useAppNav();
  const location = useLocation();
  useEffect(() => {
    if (!label) return;
    setPageLabel(location.pathname + location.search, label);
  }, [label, location.pathname, location.search, setPageLabel]);
}
