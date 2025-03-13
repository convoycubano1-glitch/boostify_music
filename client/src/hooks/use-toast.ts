/**
 * Hook para mostrar notificaciones toast
 * Adaptado de shadcn/ui toast
 */

import { 
  Toast,
  ToastActionElement,
  ToastProps 
} from "../components/ui/toast";

import { 
  useToast as useToastOriginal,
  toast as toastOriginal
} from "../components/ui/use-toast";

type ToastActionProps = React.ComponentPropsWithoutRef<typeof Toast>;

export type ToastOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
} & Pick<ToastActionProps, "className" | "id">;

// Exporta el hook y la función toast original
export const useToast = useToastOriginal;
export const toast = toastOriginal;

/**
 * Funciones de utilidad para mostrar toasts de diferentes tipos
 */
export function showToast(options: ToastOptions) {
  const { toast } = useToast();
  return toast(options);
}

export function showSuccessToast(options: Omit<ToastOptions, "variant">) {
  const { toast } = useToast();
  return toast({
    ...options,
    variant: "success"
  });
}

export function showErrorToast(options: Omit<ToastOptions, "variant">) {
  const { toast } = useToast();
  return toast({
    ...options,
    variant: "destructive"
  });
}

export function showWarningToast(options: Omit<ToastOptions, "variant">) {
  const { toast } = useToast();
  return toast({
    ...options,
    variant: "warning"
  });
}