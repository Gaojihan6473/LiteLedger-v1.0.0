import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface Channel {
  id: string;
  name: string;
  iconName: string;
  color?: string;
}

interface SelectPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: Channel[];
  placeholder?: string;
  onToggle?: (isOpen: boolean) => void;
}

export const SelectPicker: React.FC<SelectPickerProps> = ({
  value,
  onChange,
  options,
  placeholder = '请选择...',
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 通知父组件开关状态
  useEffect(() => {
    onToggle?.(isOpen);
  }, [isOpen, onToggle]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: (selectedOption.color || '#6366F1') + '20' }}
              >
                <Icon
                  name={selectedOption.iconName as any}
                  size={10}
                  style={{ color: selectedOption.color || '#6366F1' }}
                />
              </div>
              <span className="text-xs text-slate-700">{selectedOption.name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-400">{placeholder}</span>
          )}
        </div>
        <Icon name="ChevronLeft" size={16} className="text-slate-400 -rotate-90" />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 pr-3 z-50 w-full max-h-72 overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-1">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`
                  flex items-center gap-2 px-2 py-2 rounded-lg transition-all cursor-pointer
                  ${value === option.id
                    ? 'bg-blue-50'
                    : 'hover:bg-slate-50'
                  }
                `}
              >
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: (option.color || '#6366F1') + '20' }}
                >
                  <Icon
                    name={option.iconName as any}
                    size={10}
                    style={{ color: option.color || '#6366F1' }}
                  />
                </div>
                <span className={`text-xs font-medium truncate ${
                  value === option.id ? 'text-blue-700' : 'text-slate-700'
                }`}>
                  {option.name}
                </span>
                {value === option.id && (
                  <Icon name="Check" size={12} className="ml-auto text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {options.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              暂无选项
            </div>
          )}
        </div>
      )}
    </div>
  );
};
