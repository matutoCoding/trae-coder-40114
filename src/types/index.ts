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
  weddingMonth: string;
  status: 'pending' | 'settled';
  type: 'wedding' | 'recovery';
  recoveryDate?: string;
  monthClosed?: boolean;
  notes?: string;
}

export interface MonthlyCloseOut {
  month: string;
  closedAt: string;
  totalRevenue: number;
  totalCommission: number;
  totalPlatform: number;
  orderCount: number;
  closedBy: string;
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

export interface CandidateFlorist {
  florist: Florist;
  isAvailable: boolean;
  unavailabilityReason?: string;
  daySchedule: ScheduleItem[];
  weekLoad: number;
  levelScore: number;
  totalScore: number;
  rank: number;
  suggestion?: string;
}

export interface CloseOutDiffItem {
  orderId: string;
  orderNo: string;
  floristId: string;
  floristName: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  platformAmount: number;
  reason: string;
  completedAt: string;
}

export type ModuleType = 'schedule' | 'assignment' | 'commission' | 'settlement';
