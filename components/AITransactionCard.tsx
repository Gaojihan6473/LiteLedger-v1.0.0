import React from 'react';
import { Icon } from './Icon';
import { ParsedTransaction } from '../lib/minimax';

interface AITransactionCardProps {
  data: ParsedTransaction;
  onConfirm: () => void;
  confirmed?: boolean;
  editedData?: ParsedTransaction;
  onEdit?: () => void;
}

export const AITransactionCard: React.FC<AITransactionCardProps> = ({
  data,
  onConfirm,
  confirmed,
  editedData,
  onEdit,
}) => {
  // 如果有编辑后的数据，使用编辑后的数据
  const displayData = editedData || data;

  const typeLabels = {
    expense: '支出',
    income: '收入',
    transfer: '转账'
  };

  const typeColors = {
    expense: 'text-red-600 bg-red-50',
    income: 'text-green-600 bg-green-50',
    transfer: 'text-purple-600 bg-purple-50'
  };

  const typeIcons = {
    expense: 'TrendingDown',
    income: 'TrendingUp',
    transfer: 'ArrowLeftRight'
  };

  // 处理卡片点击 - 未确认时打开编辑弹窗
  const handleCardClick = () => {
    if (!confirmed && onEdit) {
      onEdit();
    }
  };

  // 是否显示编辑图标（未确认时）
  const showEditHint = !confirmed && onEdit;

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-slate-100 p-4 w-[90%] max-w-sm ${
        showEditHint ? 'cursor-pointer hover:border-violet-200 hover:shadow-xl transition-all' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* 顶部区域：类型标签 + 编辑提示 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${typeColors[displayData.type]}`}>
            <Icon name={typeIcons[displayData.type]} size={12} />
            {typeLabels[displayData.type]}
          </span>
          {showEditHint && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="Pencil" size={12} />
              点击编辑
            </span>
          )}
        </div>
        {displayData.amount && (
          <span className="text-2xl font-bold text-slate-900">
            ¥{displayData.amount}
          </span>
        )}
      </div>

      {/* 详情列表 */}
      <div className="space-y-2.5 text-sm">
        {displayData.category && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Icon name="Tag" size={14} />
              分类
            </span>
            <span className="text-slate-700 font-medium">{displayData.category}</span>
          </div>
        )}
        {displayData.channel && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Icon name="Wallet" size={14} />
              {displayData.type === 'transfer' ? '转出' : '账户'}
            </span>
            <span className="text-slate-700 font-medium">{displayData.channel}</span>
          </div>
        )}
        {displayData.toChannel && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Icon name="ArrowRight" size={14} />
              转入
            </span>
            <span className="text-slate-700 font-medium">{displayData.toChannel}</span>
          </div>
        )}
        {displayData.date && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Icon name="Calendar" size={14} />
              日期
            </span>
            <span className="text-slate-700 font-medium">{displayData.date}</span>
          </div>
        )}
        {displayData.note && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Icon name="FileText" size={14} />
              备注
            </span>
            <span className="text-slate-700 font-medium">{displayData.note}</span>
          </div>
        )}
      </div>

      {/* 确认按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // 阻止冒泡到卡片
          onConfirm();
        }}
        disabled={confirmed}
        className={`w-full mt-5 h-11 font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
          confirmed
            ? 'bg-slate-100 text-slate-400 cursor-default'
            : 'bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-[0.98]'
        }`}
      >
        {confirmed ? (
          <>
            <Icon name="Check" size={18} />
            已完成
          </>
        ) : (
          <>
            <Icon name="Check" size={18} />
            确认记账
          </>
        )}
      </button>
    </div>
  );
};
