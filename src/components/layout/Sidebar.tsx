import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  CalendarDays,
  Building2,
  Package,
  Flame,
  Archive,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台', exact: true },
  { path: '/transport', icon: Truck, label: '接运登记' },
  { path: '/schedule', icon: CalendarDays, label: '治丧排期' },
  { path: '/hall', icon: Building2, label: '厅房调度' },
  { path: '/supplies', icon: Package, label: '礼仪用品' },
  { path: '/cremation', icon: Flame, label: '火化排程' },
  { path: '/storage', icon: Archive, label: '骨灰寄存' },
  { path: '/settlement', icon: Receipt, label: '费用结算' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`bg-gradient-primary h-screen flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">殡</span>
            </div>
            <span className="text-white font-serif font-semibold text-lg">殡仪调度</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-accent-600 rounded flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">殡</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  isActive
                    ? 'sidebar-link-active'
                    : 'sidebar-link'
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-primary-700">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-2 text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
