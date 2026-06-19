import type { Florist, ScheduleItem, Order, CommissionTier } from '../types';
import { addDays, format } from 'date-fns';

export const generateMockFlorists = (): Florist[] => {
  const florists: Florist[] = [
    {
      id: 'florist-1',
      name: '林诗韵',
      phone: '138****6721',
      avatar: '🌸',
      level: 'senior',
      skills: ['新娘手捧花', '仪式区花艺', '桌花设计', '花艺装置'],
      baseCommissionRate: 0.35,
      monthlySales: 28000,
      totalOrders: 12,
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'florist-2',
      name: '苏雨桐',
      phone: '139****3456',
      avatar: '🌷',
      level: 'senior',
      skills: ['婚礼花艺', '商业花艺', '绿植造景', '新娘手捧花'],
      baseCommissionRate: 0.35,
      monthlySales: 22000,
      totalOrders: 9,
      status: 'active',
      createdAt: '2024-02-20T09:30:00Z',
    },
    {
      id: 'florist-3',
      name: '陈雨萱',
      phone: '137****8901',
      avatar: '🌹',
      level: 'intermediate',
      skills: ['桌花设计', '胸花腕花', '签到台花艺'],
      baseCommissionRate: 0.30,
      monthlySales: 15000,
      totalOrders: 7,
      status: 'active',
      createdAt: '2024-03-10T14:00:00Z',
    },
    {
      id: 'florist-4',
      name: '王梓涵',
      phone: '136****2345',
      avatar: '💐',
      level: 'intermediate',
      skills: ['路引花艺', '仪式区花艺', '甜品台装饰'],
      baseCommissionRate: 0.30,
      monthlySales: 12000,
      totalOrders: 5,
      status: 'active',
      createdAt: '2024-04-05T11:00:00Z',
    },
    {
      id: 'florist-5',
      name: '李欣怡',
      phone: '135****6789',
      avatar: '🌻',
      level: 'junior',
      skills: ['胸花腕花', '签到台花艺', '简单桌花'],
      baseCommissionRate: 0.25,
      monthlySales: 8000,
      totalOrders: 4,
      status: 'active',
      createdAt: '2024-05-18T16:00:00Z',
    },
    {
      id: 'florist-6',
      name: '张雅婷',
      phone: '134****1234',
      avatar: '🌺',
      level: 'junior',
      skills: ['花材整理', '辅助插花', '场地布置'],
      baseCommissionRate: 0.25,
      monthlySales: 5000,
      totalOrders: 3,
      status: 'inactive',
      createdAt: '2024-06-01T10:00:00Z',
    },
  ];
  return florists;
};

export const generateMockSchedules = (): ScheduleItem[] => {
  const today = new Date();
  const schedules: ScheduleItem[] = [];
  
  const bookedDates = [
    { floristId: 'florist-1', date: addDays(today, 2) },
    { floristId: 'florist-1', date: addDays(today, 5) },
    { floristId: 'florist-1', date: addDays(today, 10) },
    { floristId: 'florist-2', date: addDays(today, 2) },
    { floristId: 'florist-2', date: addDays(today, 7) },
    { floristId: 'florist-3', date: addDays(today, 3) },
    { floristId: 'florist-3', date: addDays(today, 8) },
    { floristId: 'florist-4', date: addDays(today, 5) },
    { floristId: 'florist-5', date: addDays(today, 12) },
  ];
  
  bookedDates.forEach((item, index) => {
    schedules.push({
      id: `schedule-${index + 1}`,
      floristId: item.floristId,
      date: format(item.date, 'yyyy-MM-dd'),
      type: 'booked',
      orderId: `order-${index + 1}`,
      notes: `订单 HY2024${String(1001 + index)}`,
      createdAt: new Date().toISOString(),
    });
  });
  
  schedules.push({
    id: 'schedule-leave-1',
    floristId: 'florist-1',
    date: format(addDays(today, 15), 'yyyy-MM-dd'),
    type: 'leave',
    notes: '年假',
    createdAt: new Date().toISOString(),
  });
  
  schedules.push({
    id: 'schedule-recovery-1',
    floristId: 'florist-2',
    date: format(addDays(today, 3), 'yyyy-MM-dd'),
    type: 'recovery',
    orderId: 'order-2',
    notes: '撤场回收',
    createdAt: new Date().toISOString(),
  });
  
  return schedules;
};

export const generateMockOrders = (): Order[] => {
  const today = new Date();
  const orders: Order[] = [
    {
      id: 'order-1',
      orderNo: 'HY20241001',
      customerName: '王先生 & 李女士',
      customerPhone: '138****1234',
      weddingDate: format(addDays(today, 2), 'yyyy-MM-dd'),
      venue: '香格里拉大酒店 宴会厅',
      packageType: 'premium',
      amount: 12800,
      deposit: 5000,
      status: 'assigned',
      floristId: 'florist-1',
      assignedAt: '2024-06-01T10:00:00Z',
      notes: '新娘喜欢粉色系，主花材用玫瑰和芍药',
      createdAt: '2024-05-20T14:30:00Z',
    },
    {
      id: 'order-2',
      orderNo: 'HY20241002',
      customerName: '陈先生 & 张女士',
      customerPhone: '139****5678',
      weddingDate: format(addDays(today, 2), 'yyyy-MM-dd'),
      venue: '外滩W酒店 空中花园',
      packageType: 'deluxe',
      amount: 8800,
      deposit: 3000,
      status: 'assigned',
      floristId: 'florist-2',
      assignedAt: '2024-06-02T11:00:00Z',
      notes: '森系婚礼，以绿色植物为主',
      createdAt: '2024-05-25T09:00:00Z',
    },
    {
      id: 'order-3',
      orderNo: 'HY20241003',
      customerName: '刘先生 & 周女士',
      customerPhone: '137****9012',
      weddingDate: format(addDays(today, 5), 'yyyy-MM-dd'),
      venue: '和平饭店 玫瑰厅',
      packageType: 'standard',
      amount: 5800,
      deposit: 2000,
      status: 'pending',
      notes: '简约风格，白色和绿色为主',
      createdAt: '2024-06-10T16:00:00Z',
    },
    {
      id: 'order-4',
      orderNo: 'HY20241004',
      customerName: '赵先生 & 孙女士',
      customerPhone: '136****3456',
      weddingDate: format(addDays(today, 8), 'yyyy-MM-dd'),
      venue: '柏悦酒店 宴会厅',
      packageType: 'premium',
      amount: 15800,
      deposit: 6000,
      status: 'pending',
      notes: '中式婚礼，红色系为主，需要龙凤造型',
      createdAt: '2024-06-12T10:30:00Z',
    },
    {
      id: 'order-5',
      orderNo: 'HY20241005',
      customerName: '黄先生 & 吴女士',
      customerPhone: '135****7890',
      weddingDate: format(addDays(today, 10), 'yyyy-MM-dd'),
      venue: '洲际酒店 水晶厅',
      packageType: 'deluxe',
      amount: 9800,
      deposit: 3500,
      status: 'in_progress',
      floristId: 'florist-3',
      assignedAt: '2024-06-08T14:00:00Z',
      notes: '法式浪漫风格，紫粉色系',
      createdAt: '2024-06-05T11:00:00Z',
    },
    {
      id: 'order-6',
      orderNo: 'HY20241006',
      customerName: '周先生 & 郑女士',
      customerPhone: '134****2345',
      weddingDate: format(addDays(today, -3), 'yyyy-MM-dd'),
      venue: '万豪酒店 宴会厅',
      packageType: 'standard',
      amount: 6800,
      deposit: 2500,
      status: 'completed',
      floristId: 'florist-2',
      assignedAt: '2024-05-28T09:00:00Z',
      completedAt: format(addDays(today, -2), 'yyyy-MM-dd'),
      notes: '已完成，客户很满意',
      createdAt: '2024-05-15T13:00:00Z',
    },
  ];
  return orders;
};

export const generateCommissionTiers = (): CommissionTier[] => {
  return [
    {
      id: 'tier-1',
      name: '起步档',
      minSales: 0,
      maxSales: 10000,
      commissionRate: 0.25,
      description: '月成交额 0 - 10,000 元',
    },
    {
      id: 'tier-2',
      name: '成长档',
      minSales: 10000,
      maxSales: 20000,
      commissionRate: 0.30,
      description: '月成交额 10,000 - 20,000 元',
    },
    {
      id: 'tier-3',
      name: '精英档',
      minSales: 20000,
      maxSales: 35000,
      commissionRate: 0.35,
      description: '月成交额 20,000 - 35,000 元',
    },
    {
      id: 'tier-4',
      name: '金牌档',
      minSales: 35000,
      maxSales: 50000,
      commissionRate: 0.40,
      description: '月成交额 35,000 - 50,000 元',
    },
    {
      id: 'tier-5',
      name: '钻石档',
      minSales: 50000,
      maxSales: null,
      commissionRate: 0.45,
      description: '月成交额 50,000 元以上',
    },
  ];
};
