import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, User, Calendar, LayoutGrid, List } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '../store/useAppStore';
import type { Florist, ScheduleItem } from '../types';

const levelLabels = {
  senior: '高级花艺师',
  intermediate: '中级花艺师',
  junior: '初级花艺师',
};

const levelColors = {
  senior: 'bg-rose-100 text-rose-700',
  intermediate: 'bg-champagne-100 text-champagne-700',
  junior: 'bg-sage-100 text-sage-700',
};

const scheduleTypeLabels = {
  available: '空闲',
  booked: '婚礼',
  leave: '休假',
  recovery: '撤场',
};

const scheduleTypeColors = {
  available: 'bg-green-100 text-green-700 border-green-200',
  booked: 'bg-rose-100 text-rose-700 border-rose-200',
  leave: 'bg-gray-100 text-gray-500 border-gray-200',
  recovery: 'bg-champagne-100 text-champagne-700 border-champagne-200',
};

const scheduleTypeDotColors = {
  available: 'bg-green-400',
  booked: 'bg-rose-400',
  leave: 'bg-gray-400',
  recovery: 'bg-champagne-400',
};

function ScheduleModule() {
  const { florists, schedules, addFlorist, updateFlorist, deleteFlorist, addSchedule, deleteSchedule, moveSchedule, checkScheduleConflict } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showFloristModal, setShowFloristModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingFlorist, setEditingFlorist] = useState<Florist | null>(null);
  const [selectedFlorist, setSelectedFlorist] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'available' | 'booked' | 'leave' | 'recovery'>('available');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dragScheduleId, setDragScheduleId] = useState<string | null>(null);
  const [floristForm, setFloristForm] = useState({
    name: '',
    phone: '',
    level: 'junior' as Florist['level'],
    skills: '',
    baseCommissionRate: 0.25,
    status: 'active' as Florist['status'],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDaysList = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDateSchedules = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter((s) => s.date === dateStr);
  };

  const getFloristName = (floristId: string) => {
    return florists.find((f) => f.id === floristId)?.name || '未知';
  };

  const getFloristScheduleForDate = (floristId: string, dateStr: string): ScheduleItem | undefined => {
    return schedules.find((s) => s.floristId === floristId && s.date === dateStr);
  };

  const handleAddFlorist = () => {
    setEditingFlorist(null);
    setFloristForm({
      name: '',
      phone: '',
      level: 'junior',
      skills: '',
      baseCommissionRate: 0.25,
      status: 'active',
    });
    setShowFloristModal(true);
  };

  const handleEditFlorist = (florist: Florist) => {
    setEditingFlorist(florist);
    setFloristForm({
      name: florist.name,
      phone: florist.phone,
      level: florist.level,
      skills: florist.skills.join('、'),
      baseCommissionRate: florist.baseCommissionRate,
      status: florist.status,
    });
    setShowFloristModal(true);
  };

  const handleSaveFlorist = () => {
    if (!floristForm.name.trim()) return;
    
    const skillsArray = floristForm.skills
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingFlorist) {
      updateFlorist(editingFlorist.id, {
        ...floristForm,
        skills: skillsArray,
      });
    } else {
      addFlorist({
        ...floristForm,
        avatar: '🌸',
        skills: skillsArray,
      });
    }
    setShowFloristModal(false);
  };

  const handleDeleteFlorist = (id: string) => {
    if (confirm('确定要删除这位花艺师吗？')) {
      deleteFlorist(id);
    }
  };

  const handleAddSchedule = () => {
    if (!selectedFlorist) return;
    addSchedule({
      floristId: selectedFlorist,
      date: selectedDate,
      type: scheduleType,
      notes: scheduleNotes,
    });
    setShowScheduleModal(false);
    setScheduleNotes('');
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('确定要删除这个档期吗？')) {
      deleteSchedule(id);
    }
  };

  const handleWeekCellClick = (floristId: string, dateStr: string) => {
    setSelectedFlorist(floristId);
    setSelectedDate(dateStr);
    const existing = getFloristScheduleForDate(floristId, dateStr);
    if (existing) {
      return;
    }
    setShowScheduleModal(true);
  };

  const handleDragStart = (e: React.DragEvent, scheduleId: string) => {
    setDragScheduleId(scheduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', scheduleId);
  };

  const handleDragEnd = () => {
    setDragScheduleId(null);
  };

  const handleDrop = (floristId: string, dateStr: string) => {
    if (!dragScheduleId) return;
    const { hasConflict, conflicts } = checkScheduleConflict(floristId, dateStr, dragScheduleId);
    if (hasConflict) {
      const conflictNames = conflicts
        .map((c) => `${scheduleTypeLabels[c.type]}`)
        .join('、');
      const floristName = getFloristName(floristId);
      const confirmed = confirm(
        `目标花艺师「${floristName}」在 ${dateStr} 已有${conflictNames}安排，是否仍要移动？`
      );
      if (!confirmed) {
        setDragScheduleId(null);
        return;
      }
    }
    const result = moveSchedule(dragScheduleId, floristId, dateStr);
    if (!result.success) {
      alert(result.message);
    }
    setDragScheduleId(null);
  };

  const selectedDateSchedules = schedules.filter((s) => s.date === selectedDate);

  const activeFlorists = florists.filter((f) => f.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setViewMode('week')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'week' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          周视图
        </button>
        <button
          onClick={() => setViewMode('month')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'month' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <List className="w-4 h-4" />
          月视图
        </button>
      </div>

      {viewMode === 'week' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {format(weekStart, 'yyyy年M月d日', { locale: zhCN })} - {format(weekEnd, 'M月d日', { locale: zhCN })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeekStart(subWeeks(weekStart, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                本周
              </button>
              <button
                onClick={() => setCurrentWeekStart(addWeeks(weekStart, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 border-b border-gray-100 w-32 sticky left-0 bg-white z-10">
                    花艺师
                  </th>
                  {weekDaysList.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isTodayDate = isToday(day);
                    return (
                      <th
                        key={dateStr}
                        className={`text-center py-2 px-2 text-sm font-medium border-b border-gray-100 min-w-[100px] ${
                          isTodayDate ? 'text-rose-600' : 'text-gray-500'
                        }`}
                      >
                        <div>{format(day, 'E', { locale: zhCN })}</div>
                        <div className={`text-lg ${isTodayDate ? 'font-bold' : ''}`}>
                          {format(day, 'd')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeFlorists.map((florist) => (
                  <tr key={florist.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 border-b border-gray-50 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-base">
                          {florist.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[80px]">{florist.name}</p>
                          <p className="text-xs text-gray-400">{levelLabels[florist.level]}</p>
                        </div>
                      </div>
                    </td>
                    {weekDaysList.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const schedule = getFloristScheduleForDate(florist.id, dateStr);
                      const isTodayDate = isToday(day);
                      const isSelected = dateStr === selectedDate;

                      return (
                        <td
                          key={dateStr}
                          onClick={() => handleWeekCellClick(florist.id, dateStr)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(florist.id, dateStr)}
                          className={`py-2 px-2 border-b border-gray-50 text-center cursor-pointer transition-all ${
                            isSelected ? 'bg-rose-50 ring-2 ring-rose-200' : 'hover:bg-gray-50'
                          } ${isTodayDate ? 'bg-rose-50/30' : ''}`}
                        >
                          {schedule ? (
                            <div
                              draggable={schedule.type === 'booked' || schedule.type === 'recovery'}
                              onDragStart={(e) => handleDragStart(e, schedule.id)}
                              onDragEnd={handleDragEnd}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${scheduleTypeColors[schedule.type]}${
                                schedule.type === 'booked' || schedule.type === 'recovery' ? ' cursor-grab active:cursor-grabbing' : ''
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${scheduleTypeDotColors[schedule.type]}`} />
                              {scheduleTypeLabels[schedule.type]}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-300 border border-dashed border-gray-200">
                              空闲
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {activeFlorists.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      暂无在职花艺师
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> 空闲</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> 婚礼</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-champagne-400" /> 撤场</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> 休假</span>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700">
              💡 点击空白格子可快速为花艺师添加档期，婚礼/撤场/休假日期的花艺师不会出现在智能分配的候选列表中
            </p>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">花艺师列表</h3>
                <button
                  onClick={handleAddFlorist}
                  className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {florists.map((florist) => (
                  <div
                    key={florist.id}
                    className="p-3 rounded-lg border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-champagne-100 rounded-full flex items-center justify-center text-xl">
                        {florist.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-sm truncate">{florist.name}</p>
                          {florist.status === 'active' ? (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          ) : (
                            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge ${levelColors[florist.level]}`}>
                            {levelLabels[florist.level]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          本月 {florist.totalOrders} 单 · ¥{florist.monthlySales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => handleEditFlorist(florist)}
                        className="flex-1 py-1.5 text-xs text-gray-500 hover:text-rose-600 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 inline mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteFlorist(florist.id)}
                        className="flex-1 py-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">档期类型说明</h3>
              <div className="space-y-2">
                {Object.entries(scheduleTypeLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${scheduleTypeDotColors[key as keyof typeof scheduleTypeDotColors]}`}></span>
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-800">
                  {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24"></div>
                ))}
                {days.map((day) => {
                  const daySchedules = getDateSchedules(day);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = isSameDay(day, new Date(selectedDate));
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-24 p-2 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                          : 'border-gray-100 hover:border-rose-200 hover:bg-rose-50/30'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isTodayDate
                              ? 'w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {daySchedules.length > 0 && (
                          <span className="text-xs text-gray-400">
                            {daySchedules.length}项
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 overflow-hidden">
                        {daySchedules.slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${scheduleTypeColors[schedule.type]}`}
                          >
                            {getFloristName(schedule.floristId)}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-xs text-gray-400 px-1">
                            +{daySchedules.length - 2} 更多
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedDate} 档期详情
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    共 {selectedDateSchedules.length} 项档期安排
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFlorist('');
                    setShowScheduleModal(true);
                  }}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加档期
                </button>
              </div>

              {selectedDateSchedules.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">当日暂无档期安排</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSchedules.map((schedule) => {
                    const florist = florists.find((f) => f.id === schedule.floristId);
                    return (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">
                            {florist?.avatar || '👤'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {florist?.name || '未知花艺师'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${scheduleTypeColors[schedule.type]}`}>
                                {scheduleTypeLabels[schedule.type]}
                              </span>
                              {schedule.notes && (
                                <span className="text-sm text-gray-500">
                                  {schedule.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showFloristModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingFlorist ? '编辑花艺师' : '添加花艺师'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  type="text"
                  value={floristForm.name}
                  onChange={(e) =>
                    setFloristForm({ ...floristForm, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="text"
                  value={floristForm.phone}
                  onChange={(e) =>
                    setFloristForm({ ...floristForm, phone: e.target.value })
                  }
                  className="input-field"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  级别
                </label>
                <select
                  value={floristForm.level}
                  onChange={(e) =>
                    setFloristForm({
                      ...floristForm,
                      level: e.target.value as Florist['level'],
                    })
                  }
                  className="input-field"
                >
                  <option value="junior">初级花艺师</option>
                  <option value="intermediate">中级花艺师</option>
                  <option value="senior">高级花艺师</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  技能专长（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={floristForm.skills}
                  onChange={(e) =>
                    setFloristForm({ ...floristForm, skills: e.target.value })
                  }
                  className="input-field"
                  placeholder="如：新娘手捧花、桌花设计"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  基础抽成比例：{(floristForm.baseCommissionRate * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="0.5"
                  step="0.05"
                  value={floristForm.baseCommissionRate}
                  onChange={(e) =>
                    setFloristForm({
                      ...floristForm,
                      baseCommissionRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={floristForm.status}
                  onChange={(e) =>
                    setFloristForm({
                      ...floristForm,
                      status: e.target.value as Florist['status'],
                    })
                  }
                  className="input-field"
                >
                  <option value="active">在职</option>
                  <option value="inactive">离职</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFloristModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSaveFlorist} className="flex-1 btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              添加档期 - {selectedDate}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择花艺师
                </label>
                <select
                  value={selectedFlorist}
                  onChange={(e) => setSelectedFlorist(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择花艺师</option>
                  {florists
                    .filter((f) => f.status === 'active')
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} - {levelLabels[f.level]}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  档期类型
                </label>
                <select
                  value={scheduleType}
                  onChange={(e) =>
                    setScheduleType(
                      e.target.value as 'available' | 'booked' | 'leave' | 'recovery'
                    )
                  }
                  className="input-field"
                >
                  <option value="available">空闲</option>
                  <option value="booked">已接单</option>
                  <option value="leave">休假</option>
                  <option value="recovery">撤场回收</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="请输入备注信息"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button onClick={handleAddSchedule} className="flex-1 btn-primary">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleModule;
