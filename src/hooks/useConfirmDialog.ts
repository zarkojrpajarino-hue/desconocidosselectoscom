import { useState } from 'react';

/**
 * Hook for managing confirmation dialogs
 * Simplifies destructive action confirmations
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    description: '',
    confirmText: 'Confirmar',
    variant: 'default' as 'destructive' | 'default',
  });

  const confirm = (
    action: () => void,
    config: {
      title: string;
      description: string;
      confirmText?: string;
      variant?: 'destructive' | 'default';
    }
  ) => {
    setPendingAction(() => action);
    setDialogConfig({
      title: config.title,
      description: config.description,
      confirmText: config.confirmText || 'Confirmar',
      variant: config.variant || 'default',
    });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction();
    }
    setIsOpen(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPendingAction(null);
  };

  return {
    isOpen,
    dialogConfig,
    confirm,
    handleConfirm,
    handleCancel,
    setIsOpen,
  };
};
