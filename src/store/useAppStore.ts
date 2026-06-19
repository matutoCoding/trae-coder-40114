import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Florist, ScheduleItem, Order, CommissionTier, SettlementRecord, CandidateFlorist, MonthlyCloseOut, CloseOutDiffItem } from '../types';
import { generateMockFlorists, generateMockSchedules, generateMockOrders, generateCommissionTiers } from '../data/mockData';
import { format, addDays, parseISO } from 'date-fns';

interface AppState {
  florists: Florist[];
  schedules: ScheduleItem[];
  orders: Order[];
  commissionTiers: CommissionTier[];
  settlements: SettlementRecord[];
  closeOuts: MonthlyCloseOut[];

  addFlorist: (florist: Omit<Florist, 'id' | 'createdAt' | 'monthlySales' | 'totalOrders'>) => void;
  updateFlorist: (id: string, data: Partial<Florist>) => void;
  deleteFlorist: (id: string) => void;

  addSchedule: (schedule: Omit<ScheduleItem, 'id' | 'createdAt'>) => void;
  updateSchedule: (id: string, data: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  getSchedulesByDate: (date: string) => ScheduleItem[];
  getSchedulesByFlorist: (floristId: string) => ScheduleItem[];
  getAvailableFlorists: (date: string) => Florist[];
  moveSchedule: (scheduleId: string, newFloristId: string, newDate: string, force?: boolean) => { success: boolean; message: string };
  checkScheduleConflict: (floristId: string, date: string, excludeScheduleId?: string) => { hasConflict: boolean; conflicts: ScheduleItem[] };

  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'status'>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  autoAssignOrder: (orderId: string) => { success: boolean; message: string; floristId?: string };
  getCandidateFlorists: (orderId: string) => CandidateFlorist[];
  confirmAssign: (orderId: string, floristId: string) => { success: boolean; message: string };

  getCommissionTier: (salesAmount: number) => CommissionTier | null;
  calculateCommission: (floristId: string, amount: number, month?: string, excludeOrderId?: string) => { rate: number; amount: number };
  getMonthlyFloristSales: (floristId: string, month: string, excludeOrderId?: string) => number;

  addSettlement: (settlement: Omit<SettlementRecord, 'id'>) => void;
  updateSettlement: (id: string, data: Partial<SettlementRecord>) => void;
  batchSettle: (settlementIds: string[]) => void;

  getMonthlyStats: (month: string) => {
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    floristStats: Array<{
      floristId: string;
      floristName: string;
      orderCount: number;
      salesAmount: number;
      commissionRate: number;
      commissionAmount: number;
    }>;
  };

  completeOrder: (orderId: string, recoveryDate?: string) => void;

  closeMonth: (month: string) => void;
  reopenMonth: (month: string) => void;
  isMonthClosed: (month: string) => MonthlyCloseOut | null;
  getMonthCloseOut: (month: string) => MonthlyCloseOut | null;
  releaseSchedule: (scheduleId: string) => { success: boolean; message: string };
  getCloseOutDiff: (month: string) => CloseOutDiffItem[];
}

const OCCUPIED_TYPES: ScheduleItem['type'][] = ['booked', 'leave', 'recovery'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      florists: generateMockFlorists(),
      schedules: generateMockSchedules(),
      orders: generateMockOrders(),
      commissionTiers: generateCommissionTiers(),
      settlements: [],
      closeOuts: [],

      addFlorist: (florist) => {
        const newFlorist: Florist = {
          ...florist,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          monthlySales: 0,
          totalOrders: 0,
        };
        set((state) => ({ florists: [...state.florists, newFlorist] }));
      },

      updateFlorist: (id, data) => {
        set((state) => ({
          florists: state.florists.map((f) => (f.id === id ? { ...f, ...data } : f)),
        }));
      },

      deleteFlorist: (id) => {
        set((state) => ({
          florists: state.florists.filter((f) => f.id !== id),
          schedules: state.schedules.filter((s) => s.floristId !== id),
        }));
      },

      addSchedule: (schedule) => {
        const newSchedule: ScheduleItem = {
          ...schedule,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ schedules: [...state.schedules, newSchedule] }));
      },

      updateSchedule: (id, data) => {
        set((state) => ({
          schedules: state.schedules.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      deleteSchedule: (id) => {
        set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) }));
      },

      getSchedulesByDate: (date) => {
        return get().schedules.filter((s) => s.date === date);
      },

      getSchedulesByFlorist: (floristId) => {
        return get().schedules.filter((s) => s.floristId === floristId);
      },

      getAvailableFlorists: (date) => {
        const { florists, schedules } = get();
        const dateSchedules = schedules.filter((s) => s.date === date);
        const occupiedFloristIds = dateSchedules
          .filter((s) => OCCUPIED_TYPES.includes(s.type))
          .map((s) => s.floristId);

        return florists.filter(
          (f) => f.status === 'active' && !occupiedFloristIds.includes(f.id)
        );
      },

      checkScheduleConflict: (floristId, date, excludeScheduleId) => {
        const { schedules } = get();
        const conflicts = schedules.filter(
          (s) =>
            s.floristId === floristId &&
            s.date === date &&
            OCCUPIED_TYPES.includes(s.type) &&
            s.id !== excludeScheduleId
        );
        return { hasConflict: conflicts.length > 0, conflicts };
      },

      moveSchedule: (scheduleId, newFloristId, newDate, force = false) => {
        const { schedules, checkScheduleConflict } = get();
        const schedule = schedules.find((s) => s.id === scheduleId);
        if (!schedule) return { success: false, message: '档期不存在' };

        const sameFloristSameDate =
          schedule.floristId === newFloristId && schedule.date === newDate;
        if (sameFloristSameDate) return { success: true, message: '无需移动' };

        const { hasConflict, conflicts } = checkScheduleConflict(newFloristId, newDate, scheduleId);
        if (hasConflict && !force) {
          return { success: false, message: '目标花艺师在该日期已有冲突安排' };
        }

        if (hasConflict && force) {
          const conflictIds = conflicts.map(c => c.id);
          set((state) => ({
            schedules: state.schedules.filter(s => !conflictIds.includes(s.id))
          }));
          conflicts.forEach(conflict => {
            if (conflict.orderId && conflict.type === 'booked') {
              set((state) => ({
                orders: state.orders.map(o =>
                  o.id === conflict.orderId ? { ...o, floristId: undefined, status: 'pending' as const, assignedAt: undefined } : o
                ),
              }));
            }
          });
        }

        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId ? { ...s, floristId: newFloristId, date: newDate } : s
          ),
        }));

        if (schedule.orderId) {
          set((state) => ({
            orders: state.orders.map((o) => {
              if (o.id !== schedule.orderId) return o;
              const updates: Partial<Order> = {};
              if (schedule.type === 'booked') {
                updates.weddingDate = newDate;
                updates.floristId = newFloristId;
              }
              if (schedule.type === 'recovery') {
                updates.recoveryDate = newDate;
              }
              return { ...o, ...updates };
            }),
          }));
        }

        return { success: true, message: '档期已移动' };
      },

      releaseSchedule: (scheduleId) => {
        const { schedules, orders } = get();
        const schedule = schedules.find((s) => s.id === scheduleId);
        if (!schedule) return { success: false, message: '档期不存在' };
        if (schedule.type === 'available') return { success: false, message: '空闲档期无需释放' };

        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== scheduleId),
        }));

        if (schedule.orderId && schedule.type === 'booked') {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === schedule.orderId
                ? { ...o, floristId: undefined, status: 'pending' as const, assignedAt: undefined }
                : o
            ),
          }));
        }

        return { success: true, message: '档期已释放' };
      },

      addOrder: (order) => {
        const orderNo = `HY${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;
        const newOrder: Order = {
          ...order,
          id: Date.now().toString(),
          orderNo,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },

      updateOrder: (id, data) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
          schedules: state.schedules.filter((s) => s.orderId !== id),
        }));
      },

      getCandidateFlorists: (orderId) => {
        const { florists, schedules, orders } = get();
        const order = orders.find((o) => o.id === orderId);
        if (!order) return [];

        const weddingDate = order.weddingDate;
        const activeFlorists = florists.filter((f) => f.status === 'active');

        const candidates: CandidateFlorist[] = activeFlorists.map((florist) => {
          const daySchedule = schedules.filter(
            (s) => s.floristId === florist.id && s.date === weddingDate
          );
          const occupiedItems = daySchedule.filter((s) => OCCUPIED_TYPES.includes(s.type));
          const isAvailable = occupiedItems.length === 0;

          let unavailabilityReason: string | undefined;
          let suggestion: string | undefined;
          if (!isAvailable) {
            const types = occupiedItems.map((s) => s.type);
            if (types.includes('booked')) {
              unavailabilityReason = '当天有婚礼安排';
              suggestion = '建议改期或协调其他花艺师';
            } else if (types.includes('recovery')) {
              unavailabilityReason = '当天有撤场回收';
              suggestion = '可手动释放撤场后重新分配';
            } else if (types.includes('leave')) {
              unavailabilityReason = '当天休假';
              suggestion = '休假冲突，需与花艺师沟通';
            }
          } else if (daySchedule.length === 0) {
            suggestion = '推荐分配';
          }

          let weekLoad = 0;
          try {
            const weddingDateObj = parseISO(weddingDate);
            for (let i = -3; i <= 3; i++) {
              const checkDate = i < 0 ? format(addDays(weddingDateObj, i), 'yyyy-MM-dd') : i > 0 ? format(addDays(weddingDateObj, i), 'yyyy-MM-dd') : weddingDate;
              const daySchedules = schedules.filter(
                (s) => s.floristId === florist.id && s.date === checkDate && s.type === 'booked'
              );
              weekLoad += daySchedules.length;
            }
          } catch {
            weekLoad = 0;
          }

          const levelScore = florist.level === 'senior' ? 3 : florist.level === 'intermediate' ? 2 : 1;
          const totalScore = isAvailable ? (7 - Math.min(weekLoad, 6)) * 10 + levelScore * 20 : 0;

          return {
            florist,
            isAvailable,
            unavailabilityReason,
            daySchedule,
            weekLoad,
            levelScore,
            totalScore,
            rank: 0,
            suggestion,
          };
        });

        candidates.sort((a, b) => {
          if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
          return b.totalScore - a.totalScore;
        });

        candidates.forEach((c, i) => {
          c.rank = i + 1;
        });

        return candidates;
      },

      confirmAssign: (orderId, floristId) => {
        const { orders, schedules } = get();
        const order = orders.find((o) => o.id === orderId);
        if (!order) return { success: false, message: '订单不存在' };
        if (order.status !== 'pending') return { success: false, message: '订单状态不支持分配' };

        const dateSchedules = schedules.filter((s) => s.date === order.weddingDate);
        const occupiedIds = dateSchedules
          .filter((s) => OCCUPIED_TYPES.includes(s.type))
          .map((s) => s.floristId);
        if (occupiedIds.includes(floristId)) {
          return { success: false, message: '该花艺师当日已有安排' };
        }

        get().addSchedule({
          floristId,
          date: order.weddingDate,
          type: 'booked',
          orderId: order.id,
          notes: `订单 ${order.orderNo}`,
        });

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'assigned', floristId, assignedAt: new Date().toISOString() }
              : o
          ),
        }));

        const florist = get().florists.find((f) => f.id === floristId);
        return { success: true, message: `已分配给 ${florist?.name || '花艺师'}` };
      },

      autoAssignOrder: (orderId) => {
        const { orders, florists, schedules, addSchedule } = get();
        const order = orders.find((o) => o.id === orderId);

        if (!order) return { success: false, message: '订单不存在' };
        if (order.status !== 'pending') return { success: false, message: '订单状态不支持分配' };

        const dateSchedules = schedules.filter((s) => s.date === order.weddingDate);
        const occupiedFloristIds = dateSchedules
          .filter((s) => OCCUPIED_TYPES.includes(s.type))
          .map((s) => s.floristId);

        const availableFlorists = florists.filter(
          (f) => f.status === 'active' && !occupiedFloristIds.includes(f.id)
        );

        if (availableFlorists.length === 0) {
          return { success: false, message: '当前日期没有可用花艺师' };
        }

        const floristWorkload = availableFlorists.map((f) => {
          const floristSchedules = schedules.filter(
            (s) => s.floristId === f.id && s.type === 'booked'
          );
          return { florist: f, workload: floristSchedules.length };
        });

        floristWorkload.sort((a, b) => {
          if (a.workload !== b.workload) return a.workload - b.workload;
          if (a.florist.level !== b.florist.level) {
            const levelOrder = { senior: 0, intermediate: 1, junior: 2 };
            return levelOrder[a.florist.level] - levelOrder[b.florist.level];
          }
          return b.florist.monthlySales - a.florist.monthlySales;
        });

        const selectedFlorist = floristWorkload[0].florist;

        addSchedule({
          floristId: selectedFlorist.id,
          date: order.weddingDate,
          type: 'booked',
          orderId: order.id,
          notes: `订单 ${order.orderNo}`,
        });

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'assigned', floristId: selectedFlorist.id, assignedAt: new Date().toISOString() }
              : o
          ),
        }));

        return { success: true, message: `已分配给 ${selectedFlorist.name}`, floristId: selectedFlorist.id };
      },

      getCommissionTier: (salesAmount) => {
        const tiers = [...get().commissionTiers].sort((a, b) => a.minSales - b.minSales);
        for (const tier of tiers) {
          if (salesAmount >= tier.minSales && (tier.maxSales === null || salesAmount < tier.maxSales)) {
            return tier;
          }
        }
        return tiers[tiers.length - 1] || null;
      },

      getMonthlyFloristSales: (floristId, month, excludeOrderId?) => {
        const { orders } = get();
        return orders
          .filter(
            (o) =>
              o.floristId === floristId &&
              o.weddingDate.startsWith(month) &&
              o.status !== 'cancelled' &&
              o.status !== 'pending' &&
              o.id !== excludeOrderId
          )
          .reduce((sum, o) => sum + o.amount, 0);
      },

      calculateCommission: (floristId, amount, month?, excludeOrderId?) => {
        const { florists, getCommissionTier, getMonthlyFloristSales } = get();
        const florist = florists.find((f) => f.id === floristId);
        if (!florist) return { rate: 0, amount: 0 };

        const currentSales = month
          ? getMonthlyFloristSales(floristId, month, excludeOrderId)
          : florist.monthlySales;
        const projectedSales = currentSales + amount;
        const tier = getCommissionTier(projectedSales);
        const rate = tier ? tier.commissionRate : florist.baseCommissionRate;

        return { rate, amount: Math.round(amount * rate) };
      },

      addSettlement: (settlement) => {
        const newSettlement: SettlementRecord = {
          ...settlement,
          id: Date.now().toString(),
        };
        set((state) => ({ settlements: [...state.settlements, newSettlement] }));
      },

      updateSettlement: (id, data) => {
        const settlement = get().settlements.find((s) => s.id === id);
        if (settlement?.monthClosed) return;
        set((state) => ({
          settlements: state.settlements.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      batchSettle: (settlementIds) => {
        set((state) => ({
          settlements: state.settlements.map((s) =>
            settlementIds.includes(s.id) && !s.monthClosed && s.status === 'pending'
              ? { ...s, status: 'settled' as const }
              : s
          ),
        }));
      },

      getMonthlyStats: (month) => {
        const { orders, florists, getCommissionTier } = get();
        const monthlyOrders = orders.filter(
          (o) => o.weddingDate.startsWith(month) && o.status !== 'cancelled' && o.status !== 'pending'
        );

        const totalOrders = monthlyOrders.length;
        const totalRevenue = monthlyOrders.reduce((sum, o) => sum + o.amount, 0);

        const floristStatsMap = new Map<string, { orderCount: number; salesAmount: number }>();

        monthlyOrders.forEach((order) => {
          if (order.floristId) {
            const existing = floristStatsMap.get(order.floristId) || { orderCount: 0, salesAmount: 0 };
            floristStatsMap.set(order.floristId, {
              orderCount: existing.orderCount + 1,
              salesAmount: existing.salesAmount + order.amount,
            });
          }
        });

        const floristStats = florists
          .filter((f) => floristStatsMap.has(f.id))
          .map((f) => {
            const stats = floristStatsMap.get(f.id)!;
            const tier = getCommissionTier(stats.salesAmount);
            const rate = tier ? tier.commissionRate : f.baseCommissionRate;
            return {
              floristId: f.id,
              floristName: f.name,
              orderCount: stats.orderCount,
              salesAmount: stats.salesAmount,
              commissionRate: rate,
              commissionAmount: Math.round(stats.salesAmount * rate),
            };
          });

        const totalCommission = floristStats.reduce((sum, s) => sum + s.commissionAmount, 0);

        return { totalOrders, totalRevenue, totalCommission, floristStats };
      },

      completeOrder: (orderId, recoveryDate) => {
        const { orders, florists, calculateCommission, addSettlement, updateFlorist, isMonthClosed } = get();
        const order = orders.find((o) => o.id === orderId);

        if (!order || !order.floristId) return;

        const orderMonth = order.weddingDate.substring(0, 7);
        const monthClosed = !!isMonthClosed(orderMonth);
        const commission = calculateCommission(order.floristId, order.amount, orderMonth, orderId);

        addSettlement({
          orderId: order.id,
          orderNo: order.orderNo,
          floristId: order.floristId,
          floristName: florists.find((f) => f.id === order.floristId)?.name || '',
          amount: order.amount,
          commissionRate: commission.rate,
          commissionAmount: commission.amount,
          platformAmount: order.amount - commission.amount,
          settlementDate: new Date().toISOString().split('T')[0],
          weddingMonth: orderMonth,
          status: monthClosed ? 'settled' : 'pending',
          type: 'wedding',
          recoveryDate: recoveryDate || undefined,
          monthClosed: monthClosed,
        });

        const florist = florists.find((f) => f.id === order.floristId);
        if (florist) {
          updateFlorist(order.floristId, {
            monthlySales: florist.monthlySales + order.amount,
            totalOrders: florist.totalOrders + 1,
          });
        }

        if (recoveryDate) {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    recoveryDate,
                  }
                : o
            ),
            schedules: [
              ...state.schedules,
              {
                id: `recovery-${Date.now()}`,
                floristId: order.floristId!,
                date: recoveryDate,
                type: 'recovery' as const,
                orderId: order.id,
                notes: `撤场回收 - 订单 ${order.orderNo}`,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } else {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: 'completed', completedAt: new Date().toISOString() }
                : o
            ),
          }));
        }
      },

      closeMonth: (month) => {
        const { getMonthlyStats, settlements, closeOuts } = get();
        const existing = closeOuts.find((c) => c.month === month);
        if (existing) return;

        const stats = getMonthlyStats(month);

        const closeOut: MonthlyCloseOut = {
          month,
          closedAt: new Date().toISOString(),
          totalRevenue: stats.totalRevenue,
          totalCommission: stats.totalCommission,
          totalPlatform: stats.totalRevenue - stats.totalCommission,
          orderCount: stats.totalOrders,
          closedBy: '管理员',
        };

        set((state) => ({
          closeOuts: [...state.closeOuts, closeOut],
          settlements: state.settlements.map((s) =>
            s.weddingMonth === month
              ? { ...s, monthClosed: true, status: s.status === 'pending' ? 'settled' as const : s.status }
              : s
          ),
        }));
      },

      reopenMonth: (month) => {
        set((state) => ({
          closeOuts: state.closeOuts.filter((c) => c.month !== month),
          settlements: state.settlements.map((s) =>
            s.weddingMonth === month ? { ...s, monthClosed: false } : s
          ),
        }));
      },

      isMonthClosed: (month) => {
        return get().closeOuts.find((c) => c.month === month) || null;
      },

      getMonthCloseOut: (month) => {
        return get().closeOuts.find((c) => c.month === month) || null;
      },

      getCloseOutDiff: (month) => {
        const { settlements, orders, closeOuts, florists, getMonthlyStats } = get();
        const closeOut = closeOuts.find((c) => c.month === month);
        if (!closeOut) return [];

        const currentStats = getMonthlyStats(month);
        const currentOrderIds = orders
          .filter((o) => o.weddingDate.startsWith(month) && o.status !== 'cancelled' && o.status !== 'pending')
          .map((o) => o.id);

        const closedOrderIds = new Set(
          settlements
            .filter((s) => s.weddingMonth === month && s.monthClosed)
            .map((s) => s.orderId)
        );

        const diffItems: CloseOutDiffItem[] = [];
        currentOrderIds.forEach((orderId) => {
          if (!closedOrderIds.has(orderId)) {
            const order = orders.find((o) => o.id === orderId);
            if (order && order.floristId) {
              const florist = florists.find((f) => f.id === order.floristId);
              diffItems.push({
                orderId: order.id,
                orderNo: order.orderNo,
                floristId: order.floristId,
                floristName: florist?.name || '',
                amount: order.amount,
                commissionRate: 0,
                commissionAmount: 0,
                platformAmount: order.amount,
                reason: order.completedAt ? '关账后登记完成' : '关账后新增分配',
                completedAt: order.completedAt || '',
              });
            }
          }
        });

        settlements
          .filter((s) => s.weddingMonth === month && !closedOrderIds.has(s.orderId))
          .forEach((s) => {
            if (!diffItems.find((d) => d.orderId === s.orderId)) {
              diffItems.push({
                orderId: s.orderId,
                orderNo: s.orderNo,
                floristId: s.floristId,
                floristName: s.floristName,
                amount: s.amount,
                commissionRate: s.commissionRate,
                commissionAmount: s.commissionAmount,
                platformAmount: s.platformAmount,
                reason: '关账后新增结算',
                completedAt: '',
              });
            }
          });

        return diffItems;
      },
    }),
    {
      name: 'wedding-floral-storage',
    }
  )
);
