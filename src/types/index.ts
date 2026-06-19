export interface Florist {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  level: 'senior' | 'intermediate' | 'junior';
  skills: string[];
  baseCommissionRate: number;
  monthlySales: number;
  totalOrders: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  floristId: string;
  date: string;
  type: 'available' | 'booked' | 'leave' | 'recovery';
  orderId?: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  weddingDate: string;
  venue: string;
  packageType: 'standard' | 'deluxe' | 'premium';
  amount: number;
  deposit: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  floristId?: string;
  assignedAt?: string;
  completedAt?: string;
  recoveryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface CommissionTier {
  id: string;
  name: string;
  minSales: number;
  maxSales: number | null;
  commissionRate: number;
  description: string;
}

export interface SettlementRecord {
  id: string;
  orderId: string;
  orderNo: string;
  floristId: string;
  floristName: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  platformAmount: number;
  settlementDate: string;
  status: 'pending' | 'settled';
  type: 'wedding' | 'recovery';
  notes?: string;
}

export interface MonthlyStats {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  floristStats: {
    floristId: string;
    floristName: string;
    orderCount: number;
    salesAmount: number;
    commissionRate: number;
    commissionAmount: number;
  }[];
}

export type ModuleType = 'schedule' | 'assignment' | 'commission' | 'settlement';
