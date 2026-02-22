import { useState, useCallback, useRef } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
  resolve: ((value: 'confirm' | 'cancel') => void) | null;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const resolveRef = useRef<((value: 'confirm' | 'cancel') => void) | null>(null);

  const confirm = useCallback((message: string): Promise<'confirm' | 'cancel'> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current('confirm');
      resolveRef.current = null;
    }
    setState({ isOpen: false, message: '', resolve: null });
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current('cancel');
      resolveRef.current = null;
    }
    setState({ isOpen: false, message: '', resolve: null });
  }, []);

  const close = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current('cancel');
      resolveRef.current = null;
    }
    setState({ isOpen: false, message: '', resolve: null });
  }, []);

  return {
    isOpen: state.isOpen,
    message: state.message,
    confirm,
    close,
    handleConfirm,
    handleCancel,
  };
}
