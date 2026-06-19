import { useState } from 'react';
import { TrendingUp, Award, ChevronRight, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function CommissionModule() {
  const { florists, commissionTiers, getCommissionTier, getMonthlyStats, calculateCommission, getMonthlyFloristSales } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [simulateAmount, setSimulateAmount] = useState(10000);
  const [selectedFloristForSim, setSelectedFloristForSim] = useState(florists[0]?.id || '');

  const monthlyStats = getMonthlyStats(selectedMonth);

  const tierColors = [
    'from-gray-400 to-gray-500',
    'from-sage-400 to-sage-500',
    'from-champagne-400 to-champagne-500',
    'from-rose-400 to-rose-500',
    'from-purple-400 to-purple-500',
  ];

  const getNextTier = (currentTierId: string | undefined) => {
    const sortedTiers = [...commissionTiers].sort((a, b) => a.minSales - b.minSales);
    if (!currentTierId) return sortedTiers[0];
    const currentIndex = sortedTiers.findIndex((t) => t.id === currentTierId);
    if (currentIndex === -1 || currentIndex === sortedTiers.length - 1) return null;
    return sortedTiers[currentIndex + 1];
  };

  const getProgressToNextTier = (floristId: string, monthlySales: number) => {
    const currentTier = getCommissionTier(monthlySales);
    const nextTier = getNextTier(currentTier?.id);

    if (!nextTier) return { progress: 100, nextTier: null, remaining: 0 };
    if (!currentTier) return { progress: 0, nextTier, remaining: nextTier.minSales };

    const progress = ((monthlySales - currentTier.minSales) / (nextTier.minSales - currentTier.minSales)) * 100;
    const remaining = nextTier.minSales - monthlySales;

    return { progress: Math.min(progress, 100), nextTier, remaining };
  };

  const simulatedMonthlySales = selectedFloristForSim
    ? getMonthlyFloristSales(selectedFloristForSim, selectedMonth)
    : 0;
  const simulatedResult = selectedFloristForSim
    ? calculateCommission(selectedFloristForSim, simulateAmount, selectedMonth)
    : { rate: 0, amount: 0 };

  const projectedSales = simulatedMonthlySales + simulateAmount;
  const projectedTier = getCommissionTier(projectedSales);

  const simulatedFlorist = florists.find((f) => f.id === selectedFloristForSim);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">阶梯抽成规则</h3>
              <p className="text-sm text-gray-500 mt-1">做得越多，分账比例越高</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field text-sm py-1.5 w-36"
              />
            </div>
          </div>

          <div className="space-y-4">
            {[...commissionTiers].sort((a, b) => a.minSales - b.minSales).map((tier, index) => (
              <div
                key={tier.id}
                className="relative border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${tierColors[index % tierColors.length]} rounded-xl flex items-center justify-center text-white`}
                    >
                      <Award className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{tier.name}</h4>
                      <p className="text-sm text-gray-500">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-rose-500">
                      {(tier.commissionRate * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-400">抽成比例</p>
                  </div>
                </div>
                {index < commissionTiers.length - 1 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-gray-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              {format(new Date(selectedMonth + '-01'), 'yyyy年M月', { locale: zhCN })} 概览
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">总订单数</span>
                <span className="font-semibold text-gray-800">{monthlyStats.totalOrders} 单</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">总营业额</span>
                <span className="font-semibold text-rose-500">
                  ¥{monthlyStats.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">总抽成支出</span>
                <span className="font-semibold text-amber-500">
                  ¥{monthlyStats.totalCommission.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">平台收益</span>
                  <span className="font-semibold text-green-600">
                    ¥{(monthlyStats.totalRevenue - monthlyStats.totalCommission).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-rose-50 to-champagne-50 border-0">
            <h3 className="font-semibold text-gray-800 mb-4">抽成计算器</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">选择花艺师</label>
                <select
                  value={selectedFloristForSim}
                  onChange={(e) => setSelectedFloristForSim(e.target.value)}
                  className="input-field text-sm"
                >
                  {florists
                    .filter((f) => f.status === 'active')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  订单金额：¥{simulateAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>¥1,000</span>
                  <span>¥50,000</span>
                </div>
              </div>

              {simulatedFlorist && (
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {format(new Date(selectedMonth + '-01'), 'M月', { locale: zhCN })}累计
                    </span>
                    <span className="font-medium">
                      ¥{simulatedMonthlySales.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">加本单后</span>
                    <span className="font-medium text-rose-500">
                      ¥{projectedSales.toLocaleString()}
                    </span>
                  </div>
                  {projectedTier && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">对应档位</span>
                      <span className="font-medium text-champagne-600">
                        {projectedTier.name}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">本单抽成</span>
                      <span className="text-xl font-bold text-rose-500">
                        ¥{simulatedResult.amount.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">
                      比例 {(simulatedResult.rate * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">花艺师业绩排行</h3>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(selectedMonth + '-01'), 'yyyy年M月', { locale: zhCN })} 业绩情况
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            <span className="text-sm text-gray-500">按销售额排序</span>
          </div>
        </div>

        <div className="space-y-4">
          {monthlyStats.floristStats
            .sort((a, b) => b.salesAmount - a.salesAmount)
            .map((stat, index) => {
              const florist = florists.find((f) => f.id === stat.floristId);
              const progress = getProgressToNextTier(stat.floristId, stat.salesAmount);
              const currentTier = getCommissionTier(stat.salesAmount);

              return (
                <div
                  key={stat.floristId}
                  className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-2xl">
                          {florist?.avatar || '🌸'}
                        </div>
                        {index < 3 && (
                          <div
                            className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0
                                ? 'bg-amber-500'
                                : index === 1
                                ? 'bg-gray-400'
                                : 'bg-amber-700'
                            }`}
                          >
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{stat.floristName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {stat.orderCount} 单
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-sm text-gray-500">
                            销售额 ¥{stat.salesAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-rose-500">
                        {(stat.commissionRate * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-400">
                        {currentTier?.name || '未达标'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">
                        {progress.nextTier
                          ? `距离 ${progress.nextTier.name}`
                          : '已达最高档位'}
                      </span>
                      <span className="text-gray-500">
                        {progress.nextTier
                          ? `还差 ¥${progress.remaining.toLocaleString()}`
                          : '🎉'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">本月抽成</p>
                      <p className="text-sm font-semibold text-amber-600 mt-0.5">
                        ¥{stat.commissionAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">平均客单价</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">
                        ¥{stat.orderCount > 0 ? Math.round(stat.salesAmount / stat.orderCount).toLocaleString() : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">平台收益</p>
                      <p className="text-sm font-semibold text-green-600 mt-0.5">
                        ¥{(stat.salesAmount - stat.commissionAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

          {monthlyStats.floristStats.length === 0 && (
            <div className="text-center py-12">
              <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">本月暂无业绩数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommissionModule;
