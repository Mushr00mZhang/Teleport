import { useToastStore } from '@/store/toast';

export const useToast = () => {
  const store = useToastStore();
  return {
    info: store.info,
    success: store.success,
    warning: store.warning,
    error: store.error,
  };
};
