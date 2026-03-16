import React from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  confirmAndRememberText?: string;
  cancelText?: string;
  showRemember?: boolean;
  small?: boolean;
  highZIndex?: boolean;
  onConfirm: () => void;
  onConfirmAndRemember?: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = '确认操作',
  message,
  confirmText = '确认',
  confirmAndRememberText = '确认且不再提醒',
  cancelText = '取消',
  showRemember = true,
  small = false,
  highZIndex = false,
  onConfirm,
  onConfirmAndRemember,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center ${highZIndex ? 'z-[70]' : 'z-50'} p-4`} onClick={(e) => e.stopPropagation()}>
      <div className={`bg-white rounded-2xl w-full ${small ? 'max-w-[280px]' : 'max-w-sm'} overflow-hidden animate-in fade-in zoom-in-95 duration-200`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${small ? 'px-4 py-3' : 'px-6 py-4'} flex items-center justify-between border-b border-slate-100`}>
          <h2 className={`${small ? 'text-base' : 'text-lg'} font-bold text-slate-900`}>{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Icon name="X" size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className={small ? 'px-4 py-4' : 'px-6 py-5'}>
          <p className={`${small ? 'text-sm' : 'text-base'} text-slate-600 leading-relaxed`}>{message}</p>
        </div>

        {/* Footer */}
        <div className={`${small ? 'px-4 pb-4' : 'px-6 pb-6'} flex flex-col gap-3`}>
          {showRemember && onConfirmAndRemember && (
            <Button
              onClick={onConfirmAndRemember}
              className={`w-full ${small ? 'h-9 text-sm' : ''}`}
            >
              <Icon name="BellOff" size={18} className="mr-2" />
              {confirmAndRememberText}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onConfirm}
            className={`w-full ${small ? 'h-9 text-sm' : ''}`}
          >
            {confirmText}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className={`w-full ${small ? 'h-9 text-sm' : ''}`}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};
