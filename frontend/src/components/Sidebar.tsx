import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();

  const menuItems = [
    { to: '/', icon: '🏠', label: 'Дашборд' },
    { to: '/schedule', icon: '📅', label: 'Розклад' },
    { to: '/teachers', icon: '👨‍🏫', label: 'Вчителі' },
    { to: '/subjects', icon: '📚', label: 'Предмети' },
    { to: '/classes', icon: '🏫', label: 'Класи' },
    { to: '/classrooms', icon: '🏢', label: 'Приміщення' },
    { to: '/teacher-load', icon: '📊', label: 'Навантаження' },
    { to: '/settings', icon: '⚙️', label: 'Налаштування' },
  ];

  return (
    <div className="w-60 bg-[#0a0a0a] border-r border-gray-800 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl">📖</div>
          <div>
            <div className="font-semibold text-white text-lg tracking-tight">Розклад занять</div>
            <div className="text-xs text-gray-500">v0.19</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`
              }
            >
              <span className="text-xl w-6">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-300 shrink-0">
            {(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{user?.fullName || user?.email}</div>
            <div className="text-xs text-gray-500">{isAdmin ? 'Адміністратор' : 'Вчитель'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
        >
          🚪 Вийти
        </button>
        <div className="text-xs text-gray-600 text-center mt-3">© 2026 School Scheduler</div>
      </div>
    </div>
  );
};

export default Sidebar;