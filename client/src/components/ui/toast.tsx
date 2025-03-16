import React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { ToastProps, useToastStore } from "../../hooks/use-toast";

/**
 * Componente para mostrar una notificación toast individual
 */
export const Toast = ({
  id,
  title,
  description,
  action,
  variant = "default",
}: ToastProps) => {
  const { dismissToast } = useToastStore();

  // Cerrar el toast al hacer clic en el botón de cerrar
  const handleClose = () => {
    dismissToast(id);
  };

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-between space-x-4 rounded-lg border p-4 shadow-lg",
        variant === "default" 
          ? "bg-background border-muted-foreground/20"
          : "bg-destructive text-white border-destructive-foreground/30"
      )}
    >
      <div className="flex flex-col space-y-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <div className="flex items-center gap-3">
        {action}
        <button
          onClick={handleClose}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-foreground/10 focus:outline-none focus:ring-1"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Componente contenedor para mostrar múltiples toasts
 */
export const Toaster = () => {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end p-4 space-y-2 sm:bottom-4 sm:right-4 sm:gap-2 sm:p-0">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};