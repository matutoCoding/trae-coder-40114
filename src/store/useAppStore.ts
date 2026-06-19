import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Florist, ScheduleItem, Order, CommissionTier, SettlementRecord } from '../types';
import { generateMockFlorists, generateMockSchedules, generateMockOrders, generateCommissionTiers } from '../data/mockData';

interface AppState {
  florists: Florist[];
  schedules: ScheduleItem[];
  orders: Order[];
  commissionTiers: CommissionTier[];
  settlements: SettlementRecord[];
  
  addFlorist: (florist: Omit<Florist, 'id' | 'createdAt' | 'monthlySales' | 'totalOrders'>) => void;
  updateFlorist: (id: string, data: Partial<Florist>) => void;
  deleteFlorist: (id: string) => void;
  
  addSchedule: (schedule: Omit<ScheduleItem, 'id' | 'createdAt'>) => void;
  updateSchedule: (id: string, data: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;
  getSchedulesByDate: (date: string) => ScheduleItem[];
  getSchedulesByFlorist: (floristId: string) => ScheduleItem[];
  getAvailableFlorists: (date: string) => Florist[];
  
  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'status'>) => void;
  updateOrder: (id: string, data: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  autoAssignOrder: (orderId: string) => { success: boolean; message: string; floristId?: string };
  
  getCommissionTier: (salesAmount: number) => CommissionTier | null;
  calculateCommission: (floristId: string, amount: number) => { rate: number; amount: number };
  
  addSettlement: (settlement: Omit<SettlementRecord, 'id'>) => void;
  updateSettlement: (id: string, data: Partial<SettlementRecord>) => void;
  
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      florists: generateMockFlorists(),
      schedules: generateMockSchedules(),
      orders: generateMockOrders(),
      commissionTiers: generateCommissionTiers(),
      settlements: [],
      
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
        const bookedFloristIds = dateSchedules
          .filter((s) => s.type === 'booked' || s.type === 'leave')
          .map((s) => s.floristId);
        
        return florists.filter(
          (f) => f.status === 'active' && !bookedFloristIds.includes(f.id)
        );
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
      
      autoAssignOrder: (orderId) => {
        const { orders, florists, schedules, addSchedule } = get();
        const order = orders.find((o) => o.id === orderId);
        
        if (!order) {
          return { success: false, message: '订单不存在' };
        }
        
        if (order.status !== 'pending') {
          return { success: false, message: '订单状态不支持分配' };
        }
        
        const dateSchedules = schedules.filter((s) => s.date === order.weddingDate);
        const bookedFloristIds = dateSchedules
          .filter((s) => s.type === 'booked' || s.type === 'leave')
          .map((s) => s.floristId);
        
        const availableFlorists = florists.filter(
          (f) => f.status === 'active' && !bookedFloristIds.includes(f.id)
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
      
      calculateCommission: (floristId, amount) => {
        const { florists, getCommissionTier } = get();
        const florist = florists.find((f) => f.id === floristId);
        if (!florist) return { rate: 0, amount: 0 };
        
        const projectedSales = florist.monthlySales + amount;
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
        set((state) => ({
          settlements: state.settlements.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },
      
      getMonthlyStats: (month) => {
        const { orders, florists, getCommissionTier } = get();
        const monthlyOrders = orders.filter(
          (o) => o.weddingDate.startsWith(month) && o.status !== 'cancelled'
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
        const { orders, florists, calculateCommission, addSettlement, updateFlorist } = get();
        const order = orders.find((o) => o.id === orderId);
        
        if (!order || !order.floristId) return;
        
        const commission = calculateCommission(order.floristId, order.amount);
        
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
          status: 'pending',
          type: 'wedding',
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
                type: 'recovery',
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
    }),
    {
      name: 'wedding-floral-storage',
    }
  )
);
