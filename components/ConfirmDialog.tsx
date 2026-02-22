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
  onConfirm,
  onConfirmAndRemember,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Icon name="X" size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-slate-600 text-base leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          {showRemember && onConfirmAndRemember && (
            <Button
              onClick={onConfirmAndRemember}
              className="w-full"
            >
              <Icon name="BellOff" size={18} className="mr-2" />
              {confirmAndRememberText}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onConfirm}
            className="w-full"
          >
            {confirmText}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
};
