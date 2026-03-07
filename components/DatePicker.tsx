import React, { useState } from 'react';
import { Icon } from './Icon';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  // 初始化时使用当天日期，确保日历显示当月
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 正确解析本地日期（避免 UTC 时区问题）
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const selectedDate = parseLocalDate(value);

  // 响应外部 value 变化，同步更新 currentMonth（仅当选择的是当月日期时）
  React.useEffect(() => {
    const newDate = new Date(value);
    if (isSameMonth(newDate, new Date())) {
      setCurrentMonth(newDate);
    }
  }, [value]);

  const handleDateClick = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const goBack = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goForward = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentMonth(new Date(value));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(endOfMonth(monthStart));

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const currentDay = day;
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isSelected = isSameDay(day, selectedDate);
      const isTodayDate = isToday(day);

      days.push(
        <button
          key={day.toString()}
          onClick={() => isCurrentMonth && handleDateClick(currentDay)}
          disabled={!isCurrentMonth}
          className={`
            w-7 h-7 text-xs font-medium rounded-full transition-all cursor-pointer
            ${isSelected
              ? 'bg-blue-600 text-white'
              : isTodayDate
                ? 'bg-blue-100 text-blue-600'
                : isCurrentMonth
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 cursor-not-allowed'
            }
          `}
        >
          {format(day, 'd')}
        </button>
      );
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-y-1">
        {days}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={handleOpen}
        className="w-full h-9 px-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon name="Calendar" size={16} className="text-slate-400" />
          <span className="text-sm text-slate-700">
            {format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}
          </span>
        </div>
        <Icon name="ChevronLeft" size={16} className="text-slate-400 -rotate-90" />
      </button>

      {/* 日历弹窗 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 日历面板 */}
          <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 w-72">
            {/* 头部：月份切换 */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={goBack}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Icon name="ChevronLeft" size={20} className="text-slate-600" />
              </button>
              <span className="text-base font-semibold text-slate-800">
                {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
              </span>
              <button
                onClick={goForward}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Icon name="ChevronLeft" size={20} className="text-slate-600 rotate-180" />
              </button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="h-6 text-center text-xs font-medium text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日历主体 */}
            {renderCalendar()}
          </div>
        </>
      )}
    </div>
  );
};
