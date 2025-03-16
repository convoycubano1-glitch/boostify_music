// Toast hook basado en un store para mostrar notificaciones en la aplicación
// Adaptado para nuestro sistema

import { ReactNode } from "react";
import { create } from "zustand";

// Tipos para los mensajes toast
export type ToastProps = {
  id: string;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number; // Duración en milisegundos
  onDismiss?: () => void;
};

// Tipos para el store
type ToastState = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
};

// Crear el store con zustand
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    // Crear un ID único para el toast
    const id = Math.random().toString(36).substring(2, 9);
    
    // Añadir el toast al listado
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Si tiene duración, establecer un temporizador para eliminarlo automáticamente
    if (toast.duration) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
        
        // Ejecutar callback si existe
        toast.onDismiss?.();
      }, toast.duration);
    }
    
    return id;
  },
  dismissToast: (id) => {
    // Buscar el toast a eliminar para ejecutar su callback
    const toastToDismiss = useToastStore.getState().toasts.find((t) => t.id === id);
    
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
    
    // Ejecutar callback si existe
    toastToDismiss?.onDismiss?.();
  },
  dismissAllToasts: () => {
    // Ejecutar callbacks de todos los toasts
    const { toasts } = useToastStore.getState();
    toasts.forEach((toast) => toast.onDismiss?.());
    
    set({ toasts: [] });
  },
}));

/**
 * Hook para mostrar notificaciones toast en la aplicación
 * @returns Funciones para mostrar y ocultar notificaciones
 */
export function useToast() {
  const { addToast, dismissToast, dismissAllToasts, toasts } = useToastStore();
  
  return {
    /**
     * Mostrar un toast con las propiedades especificadas
     */
    toast: (props: Omit<ToastProps, "id">) => {
      return addToast({
        ...props,
        duration: props.duration || 5000, // Duración por defecto: 5 segundos
      });
    },
    
    /**
     * Ocultar un toast específico
     */
    dismiss: (id: string) => dismissToast(id),
    
    /**
     * Ocultar todos los toasts
     */
    dismissAll: () => dismissAllToasts(),
    
    /**
     * Listado de toasts activos
     */
    toasts,
  };
}