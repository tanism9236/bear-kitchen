import { Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const entryIconStyle = { width: 20, height: 20 } as const;

const IconMembers = () => (
  <svg style={entryIconStyle} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" />
    <circle cx="10" cy="7" r="4" stroke="currentColor" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" />
  </svg>
);

const IconCategories = () => (
  <svg style={entryIconStyle} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" />
  </svg>
);

const IconTags = () => (
  <svg style={entryIconStyle} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
);

const IconUnits = () => (
  <svg style={entryIconStyle} viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21V9M8 9l-4 2" stroke="currentColor" />
    <path d="M16 3l-4 8h6l-4 8" stroke="currentColor" />
    <path d="M4 21h16" stroke="currentColor" />
  </svg>
);

export function MyKitchenPage() {
  const { members, loading } = useMembers();

  return (
    <div className="myk-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">我的厨房</h1>
          <p className="page-subtitle">My Kitchen</p>
        </div>
      </div>

      <div className="inv-groups myk-groups">
        {/* 家庭 */}
        <section className="inv-group">
          <h2 className="inv-group-title">家庭</h2>
          <div className="inv-group-list">
            <Link to="/my/members" className="myk-row">
              <span className="myk-row-icon"><IconMembers /></span>
              <span className="myk-row-label">家庭成员</span>
              {!loading && members.length > 0 && (
                <span className="myk-row-value">{members.length} 位成员</span>
              )}
              <span className="myk-row-chevron"><ChevronIcon /></span>
            </Link>
          </div>
        </section>

        {/* 厨房设置 */}
        <section className="inv-group">
          <h2 className="inv-group-title">厨房设置</h2>
          <div className="inv-group-list">
            <button type="button" className="myk-row" disabled>
              <span className="myk-row-icon"><IconCategories /></span>
              <span className="myk-row-label">分类管理</span>
              <span className="myk-row-soon">即将上线</span>
            </button>

            <button type="button" className="myk-row" disabled>
              <span className="myk-row-icon"><IconTags /></span>
              <span className="myk-row-label">标签管理</span>
              <span className="myk-row-soon">即将上线</span>
            </button>

            <button type="button" className="myk-row" disabled>
              <span className="myk-row-icon"><IconUnits /></span>
              <span className="myk-row-label">单位设置</span>
              <span className="myk-row-soon">即将上线</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
