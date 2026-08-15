import { NavLink, useLocation } from 'react-router-dom';

/* 单色线框图标（stroke 跟随 currentColor：未选中 #9E958C / 选中 #4A3E3D） */
function IconRecipes() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" />
    </svg>
  );
}

function IconPlan() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" />
    </svg>
  );
}

function IconIngredients() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10l-5 13z" stroke="currentColor" />
      <path d="M9 7C9 4.5 7.5 3 6 2.5" stroke="currentColor" />
      <path d="M12 7V2" stroke="currentColor" />
      <path d="M15 7C15 4.5 16.5 3 18 2.5" stroke="currentColor" />
    </svg>
  );
}

const navItems = [
  { to: '/recipes', label: '菜谱', icon: IconRecipes },
  { to: '/plan', label: '计划', icon: IconPlan },
  { to: '/ingredients', label: '食材', icon: IconIngredients },
];

export function NavBar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Nav */}
      <nav className="navbar-desktop">
        <div className="navbar-inner">
          <NavLink to="/recipes" className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 100 100" className="navbar-logo-icon">
              <circle cx="30" cy="25" r="12" fill="#4A3E3D" />
              <circle cx="70" cy="25" r="12" fill="#4A3E3D" />
              <circle cx="30" cy="25" r="6" fill="#C8855A" />
              <circle cx="70" cy="25" r="6" fill="#C8855A" />
              <circle cx="50" cy="55" r="35" fill="#4A3E3D" />
              <circle cx="50" cy="62" r="18" fill="#C8855A" />
              <circle cx="40" cy="48" r="4" fill="#3D352E" />
              <circle cx="60" cy="48" r="4" fill="#3D352E" />
              <ellipse cx="50" cy="58" rx="4" ry="3" fill="#3D352E" />
            </svg>
            <span className="navbar-logo-text">Bear Kitchen</span>
          </NavLink>
          <div className="navbar-links">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="navbar-mobile">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`navbar-mobile-link ${isActive ? 'active' : ''}`}
            >
              <span className="navbar-mobile-icon">
                <Icon />
              </span>
              <span className="navbar-mobile-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
