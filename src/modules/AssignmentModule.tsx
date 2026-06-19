import { useState } from 'react';
import { Plus, Sparkles, User, MapPin, Calendar, Package, Clock, CheckCircle, XCircle, Loader, Award, BarChart3, LayoutList, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Order, CandidateFlorist } from '../types';
import { format } from 'date-fns';

const statusLabels = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const packageLabels = {
  standard: '标准套餐',
  deluxe: '豪华套餐',
  premium: '尊享套餐',
};

const packagePrices = {
  standard: 5800,
  deluxe: 8800,
  premium: 12800,
};

const levelLabels = {
  senior: '高级花艺师',
  intermediate: '中级花艺师',
  junior: '初级花艺师',
};

const suggestionIcons: Record<string, string> = {
  '建议改期或协调其他花艺师': '🔄',
  '可手动释放撤场后重新分配': '🔓',
  '休假冲突，需与花艺师沟通': '⚠️',
  '推荐分配': '✅',
};

function AssignmentModule() {
  const { orders, florists, addOrder, deleteOrder, getAvailableFlorists, getCandidateFlorists, confirmAssign } = useAppStore();
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDecisionDesk, setShowDecisionDesk] = useState(false);
  const [candidates, setCandidates] = useState<CandidateFlorist[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    weddingDate: format(new Date(), 'yyyy-MM-dd'),
    venue: '',
    packageType: 'standard' as Order['packageType'],
    amount: 5800,
    deposit: 2000,
    notes: '',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === 'all') return true;
    return order.status === selectedStatus;
  });

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const assignedOrders = orders.filter((o) => o.status === 'assigned');
  const inProgressOrders = orders.filter((o) => o.status === 'in_progress');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const getFloristInfo = (floristId?: string) => {
    if (!floristId) return null;
    return florists.find((f) => f.id === floristId);
  };

  const handleAddOrder = () => {
    if (!orderForm.customerName.trim() || !orderForm.weddingDate) return;
    addOrder(orderForm);
    setShowOrderModal(false);
    setOrderForm({
      customerName: '',
      customerPhone: '',
      weddingDate: format(new Date(), 'yyyy-MM-dd'),
      venue: '',
      packageType: 'standard',
      amount: 5800,
      deposit: 2000,
      notes: '',
    });
    showToast('订单创建成功', 'success');
  };

  const handleOpenDecisionDesk = (orderId: string) => {
    const result = getCandidateFlorists(orderId);
    setCandidates(result);
    setCurrentOrderId(orderId);
    setShowDecisionDesk(true);
  };

  const handleConfirmAssign = async (floristId: string) => {
    setConfirmingId(floristId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const result = confirmAssign(currentOrderId, floristId);
    setConfirmingId(null);
    if (result.success) {
      setShowDecisionDesk(false);
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('确定要删除这个订单吗？')) {
      deleteOrder(orderId);
      showToast('订单已删除', 'success');
    }
  };

  const handlePackageChange = (pkg: Order['packageType']) => {
    setOrderForm({
      ...orderForm,
      packageType: pkg,
      amount: packagePrices[pkg],
      deposit: Math.round(packagePrices[pkg] * 0.3),
    });
  };

  const getAvailableCount = (date: string) => {
    return getAvailableFlorists(date).length;
  };

  const availableCandidates = candidates.filter((c) => c.isAvailable);
  const unavailableCandidates = candidates.filter((c) => !c.isAvailable);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待分配</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已分配</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{assignedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{inProgressOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pending', 'assigned', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedStatus === status ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '全部' : statusLabels[status as keyof typeof statusLabels]}
              </button>
            ))}
          </div>
          <button onClick={() => setShowOrderModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增订单
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">暂无订单数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const florist = getFloristInfo(order.floristId);
              const availableCount = getAvailableCount(order.weddingDate);
              return (
                <div key={order.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-mono text-gray-400">{order.orderNo}</span>
                        <span className={`badge ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                        <span className="badge bg-rose-50 text-rose-600">{packageLabels[order.packageType]}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-lg mb-2">{order.customerName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" /><span>{order.weddingDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <MapPin className="w-4 h-4" /><span className="truncate">{order.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="text-rose-500 font-medium">¥{order.amount.toLocaleString()}</span>
                          <span className="text-gray-400">/ 定金 ¥{order.deposit}</span>
                        </div>
                      </div>
                      {order.notes && <p className="text-sm text-gray-400 mt-3">备注：{order.notes}</p>}
                      {florist && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center">{florist.avatar}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{florist.name}</p>
                              <p className="text-xs text-gray-400">{levelLabels[florist.level]}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col lg:items-end gap-3">
                      {order.status === 'pending' && (
                        <>
                          <div className="text-sm text-gray-500">
                            当日可用：<span className={`font-medium ${availableCount > 0 ? 'text-green-600' : 'text-red-500'}`}>{availableCount} 位</span>
                          </div>
                          <button
                            onClick={() => handleOpenDecisionDesk(order.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                            智能分配
                          </button>
                        </>
                      )}
                      {order.status === 'assigned' && (
                        <button onClick={() => handleDeleteOrder(order.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">删除订单</button>
                      )}
                      {order.status === 'completed' && (
                        <div className="text-sm text-gray-400">完成于 {order.completedAt?.split('T')[0]}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">分配规则说明</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-rose-50 to-transparent rounded-xl">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3"><Clock className="w-5 h-5 text-rose-600" /></div>
            <h4 className="font-medium text-gray-800 mb-1">空闲优先</h4>
            <p className="text-sm text-gray-500">优先选择当日档期空闲的花艺师，婚礼、撤场、休假均视为占用</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-champagne-50 to-transparent rounded-xl">
            <div className="w-10 h-10 bg-champagne-100 rounded-lg flex items-center justify-center mb-3"><BarChart3 className="w-5 h-5 text-champagne-600" /></div>
            <h4 className="font-medium text-gray-800 mb-1">负载均衡</h4>
            <p className="text-sm text-gray-500">根据近7天工作量均衡分配，避免资源碎片化</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-sage-50 to-transparent rounded-xl">
            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center mb-3"><Award className="w-5 h-5 text-sage-600" /></div>
            <h4 className="font-medium text-gray-800 mb-1">择优推荐</h4>
            <p className="text-sm text-gray-500">同等条件下优先选择高级别花艺师，综合评分排序推荐</p>
          </div>
        </div>
      </div>

      {showDecisionDesk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <LayoutList className="w-5 h-5 text-rose-500" />
                  排班决策台
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  婚礼日期：{orders.find((o) => o.id === currentOrderId)?.weddingDate}
                  {' · '}可用 {availableCandidates.length} / {candidates.length} 人
                </p>
              </div>
              <button onClick={() => setShowDecisionDesk(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-rose-50 rounded-lg">
              <p className="text-sm text-rose-700">
                评分规则：综合得分 = (7 - 近7天负载数) × 10 + 等级分 × 20
                （高级=30/中级=20/初级=10）
              </p>
            </div>

            {availableCandidates.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  可用花艺师（{availableCandidates.length}人）
                </h4>
                <div className="space-y-3">
                  {availableCandidates.map((candidate) => (
                    <div key={candidate.florist.id} className="border border-green-100 rounded-xl p-4 bg-green-50/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-2xl">{candidate.florist.avatar}</div>
                            {candidate.rank <= 3 && (
                              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${candidate.rank === 1 ? 'bg-amber-500' : candidate.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                                {candidate.rank}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-gray-800">{candidate.florist.name}</h5>
                              <span className="badge bg-green-100 text-green-700">可接单</span>
                              {candidate.suggestion && <span className="text-sm">{suggestionIcons[candidate.suggestion] || ''} {candidate.suggestion}</span>}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{levelLabels[candidate.florist.level]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-rose-500">{candidate.totalScore}</p>
                          <p className="text-xs text-gray-400">综合得分</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-100 grid grid-cols-4 gap-3">
                        <div><p className="text-xs text-gray-400">近7天负载</p><p className="text-sm font-semibold text-gray-700 mt-0.5">{candidate.weekLoad} 单</p></div>
                        <div><p className="text-xs text-gray-400">等级评分</p><p className="text-sm font-semibold text-gray-700 mt-0.5">{candidate.levelScore * 10} 分</p></div>
                        <div><p className="text-xs text-gray-400">负载评分</p><p className="text-sm font-semibold text-gray-700 mt-0.5">{(7 - Math.min(candidate.weekLoad, 6)) * 10} 分</p></div>
                        <div><p className="text-xs text-gray-400">当日档期</p><p className="text-sm font-semibold text-green-600 mt-0.5">空闲</p></div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button onClick={() => handleConfirmAssign(candidate.florist.id)} disabled={confirmingId === candidate.florist.id} className="btn-primary text-sm flex items-center gap-1 disabled:opacity-50">
                          {confirmingId === candidate.florist.id ? (<><Loader className="w-4 h-4 animate-spin" />分配中...</>) : (<><CheckCircle className="w-4 h-4" />确认分配</>)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unavailableCandidates.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  不可用花艺师（{unavailableCandidates.length}人）
                </h4>
                <div className="space-y-3">
                  {unavailableCandidates.map((candidate) => (
                    <div key={candidate.florist.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-2xl opacity-60">{candidate.florist.avatar}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-gray-600">{candidate.florist.name}</h5>
                              <span className="badge bg-red-100 text-red-700">{candidate.unavailabilityReason}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">{levelLabels[candidate.florist.level]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {candidate.suggestion && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <ArrowRightCircle className="w-4 h-4" />
                              {candidate.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-4 gap-3">
                        <div><p className="text-xs text-gray-400">近7天负载</p><p className="text-sm font-semibold text-gray-500 mt-0.5">{candidate.weekLoad} 单</p></div>
                        <div><p className="text-xs text-gray-400">等级评分</p><p className="text-sm font-semibold text-gray-500 mt-0.5">{candidate.levelScore * 10} 分</p></div>
                        <div><p className="text-xs text-gray-400">当日档期</p><p className="text-sm font-semibold text-red-500 mt-0.5">{candidate.unavailabilityReason}</p></div>
                        <div><p className="text-xs text-gray-400">建议处理</p><p className="text-sm font-semibold text-amber-600 mt-0.5">{candidate.suggestion || '-'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {candidates.length === 0 && (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">没有找到花艺师</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新增订单</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">新人姓名</label><input type="text" value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="input-field" placeholder="如：王先生 & 李女士" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label><input type="text" value={orderForm.customerPhone} onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })} className="input-field" placeholder="请输入手机号" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">婚礼日期</label><input type="date" value={orderForm.weddingDate} onChange={(e) => setOrderForm({ ...orderForm, weddingDate: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">婚礼场地</label><input type="text" value={orderForm.venue} onChange={(e) => setOrderForm({ ...orderForm, venue: e.target.value })} className="input-field" placeholder="如：香格里拉大酒店 宴会厅" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">套餐类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['standard', 'deluxe', 'premium'] as const).map((pkg) => (
                    <button key={pkg} type="button" onClick={() => handlePackageChange(pkg)} className={`p-3 rounded-xl border-2 transition-all ${orderForm.packageType === pkg ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-medium text-sm text-gray-800">{packageLabels[pkg]}</p>
                      <p className="text-rose-500 font-semibold mt-1">¥{packagePrices[pkg].toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">订单金额</label><input type="number" value={orderForm.amount} onChange={(e) => setOrderForm({ ...orderForm, amount: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">定金</label><input type="number" value={orderForm.deposit} onChange={(e) => setOrderForm({ ...orderForm, deposit: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">备注要求</label><textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} className="input-field" rows={3} placeholder="如风格偏好、特殊要求等" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 btn-secondary">取消</button>
              <button onClick={handleAddOrder} className="flex-1 btn-primary">创建订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentModule;
