import { useState } from 'react';
import { FileText, CheckCircle, Clock, TrendingUp, DollarSign, Calendar, RefreshCw, Package, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';

const statusLabels = {
  pending: '待结算',
  settled: '已结算',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  settled: 'bg-green-100 text-green-700',
};

const typeLabels = {
  wedding: '婚礼服务',
  recovery: '撤场回收',
};

function SettlementModule() {
  const { orders, settlements, florists, completeOrder, updateSettlement, getMonthlyStats } = useAppStore();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [recoveryDate, setRecoveryDate] = useState('');
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const assignedOrders = orders.filter((o) => o.status === 'assigned' || o.status === 'in_progress');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const monthlyStats = getMonthlyStats(selectedMonth);

  const pendingSettlements = settlements.filter((s) => s.status === 'pending');
  const settledSettlements = settlements.filter((s) => s.status === 'settled');

  const filteredSettlements = settlements.filter((s) => {
    if (settlementFilter === 'all') return true;
    return s.status === settlementFilter;
  });

  const handleCompleteClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order?.weddingDate) {
      const nextDay = new Date(order.weddingDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setRecoveryDate(format(nextDay, 'yyyy-MM-dd'));
    }
    setShowCompleteModal(true);
  };

  const handleCompleteOrder = () => {
    completeOrder(selectedOrderId, recoveryDate || undefined);
    setShowCompleteModal(false);
    setSelectedOrderId('');
    setRecoveryDate('');
  };

  const handleSettle = (settlementId: string) => {
    updateSettlement(settlementId, { status: 'settled' });
  };

  const getOrderInfo = (orderId: string) => {
    return orders.find((o) => o.id === orderId);
  };

  const totalPendingAmount = pendingSettlements.reduce((sum, s) => sum + s.commissionAmount, 0);
  const totalSettledAmount = settledSettlements.reduce((sum, s) => sum + s.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待完成订单</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{assignedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成订单</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待结算金额</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                ¥{totalPendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已结算金额</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                ¥{totalSettledAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">待完成订单</h3>
            <p className="text-sm text-gray-500 mt-0.5">可登记完成并设置撤场回收日期</p>
          </div>
        </div>

        {assignedOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">暂无待完成订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedOrders.map((order) => {
              const florist = florists.find((f) => f.id === order.floristId);
              return (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      {florist?.avatar || '🌸'}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{order.customerName}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{order.orderNo}</span>
                        <span className="text-gray-300">·</span>
                        <span>{florist?.name || '未分配'}</span>
                        <span className="text-gray-300">·</span>
                        <span>婚礼：{order.weddingDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-rose-500">
                      ¥{order.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleCompleteClick(order.id)}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      登记完成
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">结算明细</h3>
            <p className="text-sm text-gray-500 mt-0.5">所有订单的分账明细记录</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field text-sm py-1.5 w-36"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'pending', 'settled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSettlementFilter(status)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    settlementFilter === status
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {status === 'all' ? '全部' : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSettlements.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">暂无结算记录</p>
            <p className="text-sm text-gray-300 mt-1">完成订单后将自动生成结算记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">花艺师</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">订单金额</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">抽成比例</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">抽成金额</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">平台收益</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">结算日期</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((settlement) => (
                  <tr key={settlement.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="text-sm font-mono text-gray-600">{settlement.orderNo}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-sm">
                          {florists.find((f) => f.id === settlement.floristId)?.avatar || '🌸'}
                        </div>
                        <span className="text-sm text-gray-700">{settlement.floristName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{typeLabels[settlement.type]}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-gray-700">¥{settlement.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm text-rose-500 font-medium">
                        {(settlement.commissionRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-amber-600">
                        ¥{settlement.commissionAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-green-600">
                        ¥{settlement.platformAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-500">{settlement.settlementDate}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`badge ${statusColors[settlement.status]}`}>
                        {statusLabels[settlement.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {settlement.status === 'pending' && (
                        <button
                          onClick={() => handleSettle(settlement.id)}
                          className="text-sm text-rose-500 hover:text-rose-600 font-medium"
                        >
                          确认结算
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">撤场回收登记</h3>
          <div className="space-y-3">
            {completedOrders
              .filter((o) => o.recoveryDate)
              .map((order) => {
                const florist = florists.find((f) => f.id === order.floristId);
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-champagne-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-champagne-100 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-champagne-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.orderNo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-champagne-700 font-medium">
                          {order.recoveryDate}
                        </p>
                        <p className="text-xs text-champagne-500">回收日期</p>
                      </div>
                    </div>
                    {florist && (
                      <div className="mt-3 pt-3 border-t border-champagne-100 flex items-center gap-2">
                        <span className="text-xs text-gray-500">负责花艺师：</span>
                        <span className="text-xs text-gray-700">{florist.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            {completedOrders.filter((o) => o.recoveryDate).length === 0 && (
              <div className="text-center py-8">
                <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">暂无撤场回收安排</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">月度财务汇总</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">总订单数</span>
              <span className="font-semibold text-gray-800">{monthlyStats.totalOrders} 单</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
              <span className="text-rose-600">总营业额</span>
              <span className="font-bold text-rose-600 text-lg">
                ¥{monthlyStats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-600">花艺师抽成</span>
              <span className="font-semibold text-amber-600">
                ¥{monthlyStats.totalCommission.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-600">平台净收益</span>
              <span className="font-bold text-green-600 text-lg">
                ¥{(monthlyStats.totalRevenue - monthlyStats.totalCommission).toLocaleString()}
              </span>
            </div>
            <div className="pt-2">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  style={{
                    width: monthlyStats.totalRevenue > 0
                      ? `${(monthlyStats.totalCommission / monthlyStats.totalRevenue) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>
                  抽成占比：{monthlyStats.totalRevenue > 0
                    ? ((monthlyStats.totalCommission / monthlyStats.totalRevenue) * 100).toFixed(1)
                    : 0}%
                </span>
                <span>
                  平台占比：{monthlyStats.totalRevenue > 0
                    ? (((monthlyStats.totalRevenue - monthlyStats.totalCommission) / monthlyStats.totalRevenue) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">登记订单完成</h3>
            <p className="text-sm text-gray-500 mb-6">
              完成后将自动生成分账明细，可同时设置撤场回收日期
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                {(() => {
                  const order = orders.find((o) => o.id === selectedOrderId);
                  const florist = florists.find((f) => f.id === order?.floristId);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">新人</span>
                        <span className="font-medium text-gray-800">{order?.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">订单号</span>
                        <span className="font-mono text-sm text-gray-600">{order?.orderNo}</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">花艺师</span>
                        <span className="text-gray-700">{florist?.name || '未分配'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">订单金额</span>
                        <span className="font-bold text-rose-500">
                          ¥{order?.amount.toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  撤场回收日期（可选）
                </label>
                <input
                  type="date"
                  value={recoveryDate}
                  onChange={(e) => setRecoveryDate(e.target.value)}
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1">
                  设置后将自动添加到花艺师档期
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button onClick={handleCompleteOrder} className="flex-1 btn-primary">
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementModule;
