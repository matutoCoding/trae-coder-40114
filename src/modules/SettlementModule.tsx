import { useState } from 'react';
import { FileText, CheckCircle, Clock, DollarSign, Calendar, RefreshCw, Package, Download, Lock, Unlock, Eye } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusLabels = { pending: '待结算', settled: '已结算' };
const statusColors = { pending: 'bg-amber-100 text-amber-700', settled: 'bg-green-100 text-green-700' };
const typeLabels = { wedding: '婚礼服务', recovery: '撤场回收' };

function SettlementModule() {
  const { orders, settlements, florists, completeOrder, updateSettlement, batchSettle, getMonthlyStats, closeMonth, reopenMonth, isMonthClosed, getMonthCloseOut } = useAppStore();
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [recoveryDate, setRecoveryDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterFlorist, setFilterFlorist] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'settled'>('all');
  const [showClosePreview, setShowClosePreview] = useState(false);

  const assignedOrders = orders.filter((o) => o.status === 'assigned' || o.status === 'in_progress');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const monthlyStats = getMonthlyStats(selectedMonth);
  const closeOutInfo = getMonthCloseOut(selectedMonth);
  const isClosed = !!closeOutInfo;

  const filteredSettlements = settlements.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterFlorist !== 'all' && s.floristId !== filterFlorist) return false;
    if (s.settlementDate.startsWith(selectedMonth)) return true;
    return false;
  });

  const monthAllSettlements = settlements.filter((s) => s.settlementDate.startsWith(selectedMonth));
  const monthAllPending = monthAllSettlements.filter((s) => s.status === 'pending' && !s.monthClosed);
  const monthAllPendingAmount = monthAllPending.reduce((sum, s) => sum + s.commissionAmount, 0);

  const pendingSettlements = filteredSettlements.filter((s) => s.status === 'pending' && !s.monthClosed);
  const totalPendingAmount = pendingSettlements.reduce((sum, s) => sum + s.commissionAmount, 0);
  const totalSettledAmount = filteredSettlements.filter((s) => s.status === 'settled').reduce((sum, s) => sum + s.commissionAmount, 0);

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

  const handleBatchSettle = () => {
    const ids = monthAllPending.map((s) => s.id);
    if (ids.length === 0) return;
    batchSettle(ids);
  };

  const handleCloseMonth = () => {
    closeMonth(selectedMonth);
    setShowClosePreview(false);
  };

  const handleReopenMonth = () => {
    if (confirm('确定要重新开启本月账目吗？重新开启后可以修改结算记录。')) {
      reopenMonth(selectedMonth);
    }
  };

  const handleExportCSV = () => {
    const headers = ['订单号', '花艺师', '类型', '订单金额', '抽成比例', '抽成金额', '平台收益', '结算日期', '回收日期', '结算状态', '关账状态'];
    const rows = filteredSettlements.map((s) => [
      s.orderNo, s.floristName, typeLabels[s.type], s.amount,
      `${(s.commissionRate * 100).toFixed(0)}%`, s.commissionAmount, s.platformAmount,
      s.settlementDate, s.recoveryDate || '', statusLabels[s.status],
      s.monthClosed ? '已关账' : '未关账',
    ]);

    const totalAmount = filteredSettlements.reduce((s, r) => s + r.amount, 0);
    const totalCommission = filteredSettlements.reduce((s, r) => s + r.commissionAmount, 0);
    const totalPlatform = filteredSettlements.reduce((s, r) => s + r.platformAmount, 0);

    const summaryRow = ['合计', '', '', totalAmount, '', totalCommission, totalPlatform, '', '', '', closeOutInfo ? `已关账 ${closeOutInfo.closedAt.split('T')[0]}` : '未关账'];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => { const str = String(cell); return str.includes(',') ? `"${str}"` : str; }).join(',')),
      summaryRow.map((cell) => { const str = String(cell); return str.includes(',') ? `"${str}"` : str; }).join(','),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `结算明细_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">待完成订单</p><p className="text-2xl font-bold text-blue-600 mt-1">{assignedOrders.length}</p></div><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-blue-600" /></div></div></div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">已完成订单</p><p className="text-2xl font-bold text-green-600 mt-1">{completedOrders.length}</p></div><div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">待结算金额</p><p className="text-2xl font-bold text-amber-600 mt-1">¥{totalPendingAmount.toLocaleString()}</p></div><div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div></div></div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">已结算金额</p><p className="text-2xl font-bold text-rose-600 mt-1">¥{totalSettledAmount.toLocaleString()}</p></div><div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-rose-600" /></div></div></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-gray-800">待完成订单</h3><p className="text-sm text-gray-500 mt-0.5">可登记完成并设置撤场回收日期</p></div>
        </div>
        {assignedOrders.length === 0 ? (
          <div className="text-center py-12"><Package className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400">暂无待完成订单</p></div>
        ) : (
          <div className="space-y-3">
            {assignedOrders.map((order) => {
              const florist = florists.find((f) => f.id === order.floristId);
              return (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">{florist?.avatar || '🌸'}</div>
                    <div><h4 className="font-medium text-gray-800">{order.customerName}</h4><div className="flex items-center gap-3 mt-1 text-sm text-gray-500"><span>{order.orderNo}</span><span className="text-gray-300">·</span><span>{florist?.name || '未分配'}</span><span className="text-gray-300">·</span><span>婚礼：{order.weddingDate}</span></div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-rose-500">¥{order.amount.toLocaleString()}</span>
                    <button onClick={() => handleCompleteClick(order.id)} className="btn-primary text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />登记完成</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              结算明细
              {closeOutInfo && <span className="badge bg-gray-700 text-white flex items-center gap-1"><Lock className="w-3 h-3" />已关账</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{format(new Date(selectedMonth + '-01'), 'yyyy年M月', { locale: zhCN })} 分账明细记录</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-field text-sm py-1.5 w-36" /></div>
            <select value={filterFlorist} onChange={(e) => setFilterFlorist(e.target.value)} className="input-field text-sm py-1.5 w-28">
              <option value="all">全部花艺师</option>
              {florists.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'pending', 'settled'] as const).map((status) => (
                <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1 text-sm rounded-md transition-colors ${filterStatus === status ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {status === 'all' ? '全部' : statusLabels[status]}
                </button>
              ))}
            </div>
            <button onClick={handleExportCSV} disabled={filteredSettlements.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="w-4 h-4" />导出CSV
            </button>
            {!isClosed ? (
              <>
                <button onClick={handleBatchSettle} disabled={pendingSettlements.length === 0} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <CheckCircle className="w-4 h-4" />批量结算({pendingSettlements.length})
                </button>
                <button onClick={() => setShowClosePreview(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Lock className="w-4 h-4" />月度关账
                </button>
              </>
            ) : (
              <button onClick={handleReopenMonth} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                <Unlock className="w-4 h-4" />重新开启
              </button>
            )}
          </div>
        </div>

        {closeOutInfo && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-800">关账信息</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">关账时间</span><p className="font-medium text-gray-800 mt-0.5">{closeOutInfo.closedAt.replace('T', ' ').substring(0, 19)}</p></div>
              <div><span className="text-gray-500">关账营业额</span><p className="font-medium text-rose-600 mt-0.5">¥{closeOutInfo.totalRevenue.toLocaleString()}</p></div>
              <div><span className="text-gray-500">关账抽成</span><p className="font-medium text-amber-600 mt-0.5">¥{closeOutInfo.totalCommission.toLocaleString()}</p></div>
              <div><span className="text-gray-500">关账平台收益</span><p className="font-medium text-green-600 mt-0.5">¥{closeOutInfo.totalPlatform.toLocaleString()}</p></div>
            </div>
            {(() => {
              const revDiff = monthlyStats.totalRevenue - closeOutInfo.totalRevenue;
              const commDiff = monthlyStats.totalCommission - closeOutInfo.totalCommission;
              const hasDiff = revDiff !== 0 || commDiff !== 0;
              return hasDiff ? (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    关账差额（关账后新增的结算记录导致）
                  </p>
                  {revDiff !== 0 && (
                    <p className="text-xs text-amber-500">营业额差额：{revDiff > 0 ? '+' : ''}¥{revDiff.toLocaleString()}（关账时 ¥{closeOutInfo.totalRevenue.toLocaleString()} → 当前 ¥{monthlyStats.totalRevenue.toLocaleString()}）</p>
                  )}
                  {commDiff !== 0 && (
                    <p className="text-xs text-amber-500">抽成差额：{commDiff > 0 ? '+' : ''}¥{commDiff.toLocaleString()}（关账时 ¥{closeOutInfo.totalCommission.toLocaleString()} → 当前 ¥{monthlyStats.totalCommission.toLocaleString()}）</p>
                  )}
                </div>
              ) : null;
            })()}
          </div>
        )}

        {filteredSettlements.length === 0 ? (
          <div className="text-center py-16"><FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" /><p className="text-gray-400">暂无结算记录</p><p className="text-sm text-gray-300 mt-1">完成订单后将自动生成结算记录</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">花艺师</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">订单金额</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">抽成比例</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">抽成金额</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">平台收益</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">结算日期</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-gray-500">回收日期</th>
                  <th className="text-center py-3 px-3 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-right py-3 px-3 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((settlement) => (
                  <tr key={settlement.id} className={`border-b border-gray-50 hover:bg-gray-50 ${settlement.monthClosed ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 px-3"><span className="text-sm font-mono text-gray-600">{settlement.orderNo}</span></td>
                    <td className="py-3 px-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-sm">{florists.find((f) => f.id === settlement.floristId)?.avatar || '🌸'}</div><span className="text-sm text-gray-700">{settlement.floristName}</span></div></td>
                    <td className="py-3 px-3"><span className="text-sm text-gray-600">{typeLabels[settlement.type]}</span></td>
                    <td className="py-3 px-3 text-right"><span className="text-sm text-gray-700">¥{settlement.amount.toLocaleString()}</span></td>
                    <td className="py-3 px-3 text-right"><span className="text-sm text-rose-500 font-medium">{(settlement.commissionRate * 100).toFixed(0)}%</span></td>
                    <td className="py-3 px-3 text-right"><span className="text-sm font-medium text-amber-600">¥{settlement.commissionAmount.toLocaleString()}</span></td>
                    <td className="py-3 px-3 text-right"><span className="text-sm font-medium text-green-600">¥{settlement.platformAmount.toLocaleString()}</span></td>
                    <td className="py-3 px-3"><span className="text-sm text-gray-500">{settlement.settlementDate}</span></td>
                    <td className="py-3 px-3">{settlement.recoveryDate ? <span className="text-sm text-champagne-600 font-medium">{settlement.recoveryDate}</span> : <span className="text-sm text-gray-300">-</span>}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`badge ${statusColors[settlement.status]}`}>{statusLabels[settlement.status]}</span>
                        {settlement.monthClosed && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {settlement.status === 'pending' && !settlement.monthClosed && (
                        <button onClick={() => handleSettle(settlement.id)} className="text-sm text-rose-500 hover:text-rose-600 font-medium">确认结算</button>
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
          <h3 className="font-semibold text-gray-800 mb-4">{format(new Date(selectedMonth + '-01'), 'yyyy年M月', { locale: zhCN })} 撤场回收</h3>
          <div className="space-y-3">
            {completedOrders.filter((o) => o.recoveryDate && o.recoveryDate.startsWith(selectedMonth)).map((order) => {
              const florist = florists.find((f) => f.id === order.floristId);
              return (
                <div key={order.id} className="p-4 bg-champagne-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-champagne-100 rounded-lg flex items-center justify-center"><RefreshCw className="w-5 h-5 text-champagne-600" /></div><div><p className="font-medium text-gray-800 text-sm">{order.customerName}</p><p className="text-xs text-gray-500">{order.orderNo}</p></div></div>
                    <div className="text-right"><p className="text-sm text-champagne-700 font-medium">{order.recoveryDate}</p><p className="text-xs text-champagne-500">回收日期</p></div>
                  </div>
                  {florist && <div className="mt-3 pt-3 border-t border-champagne-100 flex items-center gap-2"><span className="text-xs text-gray-500">负责花艺师：</span><span className="text-xs text-gray-700">{florist.name}</span></div>}
                </div>
              );
            })}
            {completedOrders.filter((o) => o.recoveryDate && o.recoveryDate.startsWith(selectedMonth)).length === 0 && (
              <div className="text-center py-8"><RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">本月暂无撤场回收安排</p></div>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">{format(new Date(selectedMonth + '-01'), 'yyyy年M月', { locale: zhCN })} 财务汇总</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><span className="text-gray-600">总订单数</span><span className="font-semibold text-gray-800">{monthlyStats.totalOrders} 单</span></div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg"><span className="text-rose-600">总营业额</span><span className="font-bold text-rose-600 text-lg">¥{monthlyStats.totalRevenue.toLocaleString()}</span></div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"><span className="text-amber-600">花艺师抽成</span><span className="font-semibold text-amber-600">¥{monthlyStats.totalCommission.toLocaleString()}</span></div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg"><span className="text-green-600">平台净收益</span><span className="font-bold text-green-600 text-lg">¥{(monthlyStats.totalRevenue - monthlyStats.totalCommission).toLocaleString()}</span></div>
            <div className="pt-2">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: monthlyStats.totalRevenue > 0 ? `${(monthlyStats.totalCommission / monthlyStats.totalRevenue) * 100}%` : '0%' }} /></div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>抽成占比：{monthlyStats.totalRevenue > 0 ? ((monthlyStats.totalCommission / monthlyStats.totalRevenue) * 100).toFixed(1) : 0}%</span>
                <span>平台占比：{monthlyStats.totalRevenue > 0 ? (((monthlyStats.totalRevenue - monthlyStats.totalCommission) / monthlyStats.totalRevenue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showClosePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2"><Lock className="w-5 h-5 text-purple-500" />月度关账预览</h3>
            <p className="text-sm text-gray-500 mb-4">关账后本月结算记录将锁定，无法修改。请确认以下数据无误。</p>
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">月份</span><span className="font-medium">{selectedMonth}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">订单数</span><span className="font-medium">{monthlyStats.totalOrders} 单</span></div>
              <div className="flex justify-between"><span className="text-gray-600">总营业额</span><span className="font-bold text-rose-600">¥{monthlyStats.totalRevenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">花艺师抽成</span><span className="font-bold text-amber-600">¥{monthlyStats.totalCommission.toLocaleString()}</span></div>
              <div className="flex justify-between pt-3 border-t border-gray-200"><span className="text-gray-600">平台净收益</span><span className="font-bold text-green-600">¥{(monthlyStats.totalRevenue - monthlyStats.totalCommission).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">待结算笔数</span><span className="font-medium text-amber-600">{monthAllPending.length} 笔</span></div>
              <div className="flex justify-between"><span className="text-gray-600">待结算金额</span><span className="font-medium text-amber-600">¥{monthAllPendingAmount.toLocaleString()}</span></div>
            </div>
            {monthAllPending.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg"><p className="text-sm text-amber-700">⚠ 关账前有 {monthAllPending.length} 笔待结算记录（金额 ¥{monthAllPendingAmount.toLocaleString()}），确认关账时将自动批量结算。</p></div>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowClosePreview(false)} className="flex-1 btn-secondary">取消</button>
              <button onClick={handleCloseMonth} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">确认关账</button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">登记订单完成</h3>
            <p className="text-sm text-gray-500 mb-6">完成后将自动生成分账明细，可同时设置撤场回收日期</p>
            {(() => {
              const order = orders.find((o) => o.id === selectedOrderId);
              const orderMonth = order?.weddingDate?.substring(0, 7) || '';
              const orderMonthClosed = !!getMonthCloseOut(orderMonth);
              return orderMonthClosed ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    {(() => {
                      const florist = florists.find((f) => f.id === order?.floristId);
                      return (
                        <>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">新人</span><span className="font-medium text-gray-800">{order?.customerName}</span></div>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">订单号</span><span className="font-mono text-sm text-gray-600">{order?.orderNo}</span></div>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">花艺师</span><span className="text-gray-700">{florist?.name || '未分配'}</span></div>
                          <div className="flex items-center justify-between"><span className="text-sm text-gray-500">订单金额</span><span className="font-bold text-rose-500">¥{order?.amount.toLocaleString()}</span></div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700 font-medium">🔒 该订单所属月份 {orderMonth} 已关账</p>
                    <p className="text-xs text-purple-500 mt-1">结算记录将以「已结算+已关账」状态生成，金额将计入关账差额</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">撤场回收日期（可选）</label>
                    <input type="date" value={recoveryDate} onChange={(e) => setRecoveryDate(e.target.value)} className="input-field" />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCompleteModal(false)} className="flex-1 btn-secondary">取消</button>
                    <button onClick={handleCompleteOrder} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">确认完成（锁定结算）</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    {(() => {
                      const florist = florists.find((f) => f.id === order?.floristId);
                      return (
                        <>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">新人</span><span className="font-medium text-gray-800">{order?.customerName}</span></div>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">订单号</span><span className="font-mono text-sm text-gray-600">{order?.orderNo}</span></div>
                          <div className="flex items-center justify-between mb-3"><span className="text-sm text-gray-500">花艺师</span><span className="text-gray-700">{florist?.name || '未分配'}</span></div>
                          <div className="flex items-center justify-between"><span className="text-sm text-gray-500">订单金额</span><span className="font-bold text-rose-500">¥{order?.amount.toLocaleString()}</span></div>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">撤场回收日期（可选）</label>
                    <input type="date" value={recoveryDate} onChange={(e) => setRecoveryDate(e.target.value)} className="input-field" />
                    <p className="text-xs text-gray-400 mt-1">设置后将自动添加到花艺师档期，该日视为占用</p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCompleteModal(false)} className="flex-1 btn-secondary">取消</button>
                    <button onClick={handleCompleteOrder} className="flex-1 btn-primary">确认完成</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementModule;
