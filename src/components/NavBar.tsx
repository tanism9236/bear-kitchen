import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/recipes', label: '菜谱', icon: '🍳' },
  { to: '/plan', label: '计划', icon: '📅' },
  { to: '/ingredients', label: '食材', icon: '🥬' },
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
              <circle cx="30" cy="25" r="12" fill="#6B5846" />
              <circle cx="70" cy="25" r="12" fill="#6B5846" />
              <circle cx="30" cy="25" r="6" fill="#C8855A" />
              <circle cx="70" cy="25" r="6" fill="#C8855A" />
              <circle cx="50" cy="55" r="35" fill="#6B5846" />
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
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`navbar-mobile-link ${isActive ? 'active' : ''}`}
            >
              <span className="navbar-mobile-icon">{item.icon}</span>
              <span className="navbar-mobile-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
