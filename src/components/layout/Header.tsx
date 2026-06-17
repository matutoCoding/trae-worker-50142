import React from 'react';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate, getToday } from '@/utils/dateUtils';

const Header: React.FC = () => {
  const { currentUser } = useAppStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-serif font-semibold text-gray-800">
          殡葬礼仪服务调度系统
        </h1>
        <span className="text-sm text-gray-500">
          {formatDate(getToday(), 'YYYY年MM月DD日 dddd')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单、逝者姓名..."
            className="input pl-10 w-72"
          />
        </div>

        <button className="relative p-2 text-gray-600 hover:text-primary-800 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-800" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                {currentUser?.name || '管理员'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.role || '系统管理员'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                系统设置
              </button>
              <hr className="my-1 border-gray-100" />
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50">
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
