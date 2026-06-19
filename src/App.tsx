import { useState } from 'react';
import { Calendar, Users, TrendingUp, FileText, Flower2, Menu, X } from 'lucide-react';
import ScheduleModule from './modules/ScheduleModule';
import AssignmentModule from './modules/AssignmentModule';
import CommissionModule from './modules/CommissionModule';
import SettlementModule from './modules/SettlementModule';
import type { ModuleType } from './types';

const modules = [
  { id: 'schedule' as ModuleType, name: '档期排期', icon: Calendar, description: '花艺师档期管理' },
  { id: 'assignment' as ModuleType, name: '自动分配', icon: Users, description: '订单智能分配' },
  { id: 'commission' as ModuleType, name: '阶梯抽成', icon: TrendingUp, description: '分账比例计算' },
  { id: 'settlement' as ModuleType, name: '对账明细', icon: FileText, description: '财务结算管理' },
];

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderModule = () => {
    switch (activeModule) {
      case 'schedule':
        return <ScheduleModule />;
      case 'assignment':
        return <AssignmentModule />;
      case 'commission':
        return <CommissionModule />;
      case 'settlement':
        return <SettlementModule />;
      default:
        return <ScheduleModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-serif font-semibold text-gray-800 text-lg">花韵</h1>
                <p className="text-xs text-gray-400">花艺管理系统</p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4 text-gray-500" />
            ) : (
              <Menu className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`nav-item w-full ${
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && (
                  <div className="text-left">
                    <p className="text-sm">{module.name}</p>
                    <p className={`text-xs ${isActive ? 'text-rose-400' : 'text-gray-400'}`}>
                      {module.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-rose-50 to-champagne-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">当前花艺师</p>
              <p className="text-sm font-medium text-gray-800">6 位在职</p>
              <p className="text-xs text-rose-500 mt-1">5 位可接单</p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {modules.find((m) => m.id === activeModule)?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {modules.find((m) => m.id === activeModule)?.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">管理员</p>
              <p className="text-xs text-gray-400">admin@huayun.com</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-medium">
              管
            </div>
          </div>
        </header>

        <div className="p-6">{renderModule()}</div>
      </main>
    </div>
  );
}

export default App;
