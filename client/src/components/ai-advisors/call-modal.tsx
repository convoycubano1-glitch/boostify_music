/**
 * Componente modal para gestionar llamadas a los asesores
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Phone, PhoneOff, X, MessageSquare, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/use-auth';
import { useSubscription } from '../../lib/context/subscription-context';
import { useAdvisorAccess } from '../../hooks/use-advisor-access';
import { Advisor, advisorCallService } from '../../lib/services/advisor-call-service';
import { Progress } from '../ui/progress';

const MAX_CALL_DURATION = 300; // 5 minutos en segundos

export interface CallModalProps {
  advisor: Advisor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallModal({ advisor, open, onOpenChange }: CallModalProps) {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();
  const [calling, setCalling] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notes, setNotes] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Si el asesor no está definido, no mostrar el modal
  if (!advisor) return null;
  
  // Verificar acceso al asesor según el plan
  const { hasAccess, hasReachedLimit, callsRemaining, isLoading } = useAdvisorAccess(
    advisor.id,
    ['publicist'] // Asesores disponibles en el plan gratuito
  );
  
  // Efecto para iniciar la llamada cuando se abre el modal
  useEffect(() => {
    if (open && advisor) {
      // Si el usuario tiene acceso, simular el inicio de la llamada
      if (hasAccess && !isLoading) {
        simulateCall();
      }
    } else {
      // Si se cierra el modal, limpiar el estado
      resetCallState();
    }
    
    // Limpiar al desmontar
    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
    };
  }, [open, advisor, hasAccess, isLoading]);
  
  // Simular una llamada al asesor
  const simulateCall = () => {
    if (!user) return;
    
    setCalling(true);
    
    // Simular tiempo de conexión (2 segundos)
    setTimeout(() => {
      setCalling(false);
      setConnected(true);
      
      // Iniciar temporizador de duración de la llamada
      startCallTimer();
      
      toast({
        title: "Llamada conectada",
        description: `Estás hablando con ${advisor.name}, tu ${advisor.title.toLowerCase()}.`,
      });
      
    }, 2000);
  };
  
  // Iniciar temporizador de duración de la llamada
  const startCallTimer = () => {
    // Iniciar un intervalo para actualizar la duración cada segundo
    const timer = setInterval(() => {
      setCallDuration(prev => {
        // Si se alcanza la duración máxima, finalizar la llamada
        if (prev >= MAX_CALL_DURATION) {
          endCall();
          return MAX_CALL_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
    
    setCallTimer(timer);
  };
  
  // Finalizar la llamada
  const endCall = async () => {
    // Detener el temporizador
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Si la llamada estaba conectada, registrar en Firestore
    if (connected && user) {
      try {
        // Registrar la llamada en Firestore
        await advisorCallService.registerCall(
          advisor,
          callDuration,
          notes,
          [], // Sin temas específicos por ahora
          'completed',
          currentPlan
        );
        
        toast({
          title: "Llamada finalizada",
          description: `Tu llamada con ${advisor.name} ha sido registrada.`,
        });
      } catch (error) {
        console.error('Error registering call:', error);
        toast({
          title: "Error al registrar llamada",
          description: "No se pudo guardar el registro de la llamada.",
          variant: "destructive"
        });
      }
    }
    
    // Cerrar el modal
    onOpenChange(false);
    
    // Resetear el estado
    resetCallState();
  };
  
  // Cancelar la llamada
  const cancelCall = async () => {
    // Detener el temporizador
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Si la llamada estaba conectada, registrar como cancelada
    if (connected && user) {
      try {
        // Registrar la llamada cancelada en Firestore
        await advisorCallService.registerCall(
          advisor,
          callDuration,
          notes,
          [],
          'cancelled',
          currentPlan
        );
      } catch (error) {
        console.error('Error registering cancelled call:', error);
      }
    }
    
    // Cerrar el modal
    onOpenChange(false);
    
    // Resetear el estado
    resetCallState();
  };
  
  // Resetear el estado de la llamada
  const resetCallState = () => {
    setCalling(false);
    setConnected(false);
    setNotes('');
    setCallDuration(0);
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
  };
  
  // Formatear duración en minutos:segundos
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Calcular porcentaje de tiempo transcurrido
  const durationPercentage = (callDuration / MAX_CALL_DURATION) * 100;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md border-[#27272A] bg-[#16161A] text-white" 
        aria-describedby="advisor-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-white">
            {calling ? (
              <span className="flex items-center">
                <span className="animate-pulse mr-2">📞</span> 
                Llamando...
              </span>
            ) : connected ? (
              <div className="flex items-center justify-between w-full">
                <span>Conectado con {advisor.name}</span>
                <Badge variant="outline" className="ml-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(callDuration)}
                </Badge>
              </div>
            ) : (
              <span>
                {hasAccess ? 'Conectando con asesor...' : 'Acceso restringido'}
              </span>
            )}
          </DialogTitle>
          <DialogDescription id="advisor-dialog-description" className="text-gray-400">
            {calling ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative w-24 h-24 mb-4">
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                </div>
                <p className="text-center text-sm text-gray-400">
                  Conectando con {advisor.name}, tu {advisor.title.toLowerCase()}...
                </p>
              </div>
            ) : connected ? (
              <div className="py-4 space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`flex p-3 rounded-full bg-gradient-to-br ${advisor.color}`}>
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{advisor.name}</h3>
                    <p className="text-xs font-medium text-gray-400">{advisor.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {advisor.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span>Tiempo de llamada restante</span>
                    <span>{formatDuration(MAX_CALL_DURATION - callDuration)}</span>
                  </div>
                  <Progress 
                    value={durationPercentage} 
                    className={`h-2 ${
                      durationPercentage > 80 ? 'bg-red-200' : 
                      durationPercentage > 60 ? 'bg-amber-200' : 'bg-muted'
                    }`}
                  />
                </div>
                
                <div className="mt-4">
                  <Textarea
                    placeholder="Toma notas de tu conversación aquí..."
                    className="h-24 text-sm bg-[#1C1C24] border-[#27272A] resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                    <p className="text-center text-sm text-gray-400 mt-4">
                      Verificando tu acceso...
                    </p>
                  </div>
                ) : !hasAccess ? (
                  <div className="flex flex-col items-center py-6">
                    {hasReachedLimit ? (
                      <div className="text-center space-y-2">
                        <PhoneOff className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-white">Límite de llamadas alcanzado</h3>
                        <p className="text-sm text-gray-400">
                          Has alcanzado tu límite de {advisorCallService.getMonthlyCallLimit(currentPlan)} llamadas mensuales con tu plan {currentPlan}.
                        </p>
                        <p className="text-sm text-gray-400">
                          Actualiza a un plan superior para obtener más llamadas.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <PhoneOff className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-white">Asesor no disponible en tu plan</h3>
                        <p className="text-sm text-gray-400">
                          Este asesor solo está disponible en el plan PRO o superior.
                        </p>
                        <p className="text-sm text-gray-400">
                          Actualiza tu plan para acceder a todo el equipo de asesores.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-400">
                    Este asesor te brindará consejos profesionales en su área de especialidad.
                  </p>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          {!hasAccess && !isLoading ? (
            <Button
              type="button" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              onClick={() => window.location.href = '/pricing'}
            >
              Actualizar Plan
            </Button>
          ) : connected ? (
            <div className="w-full grid grid-cols-2 gap-2">
              <Button
                type="button" 
                variant="outline" 
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
              <Button
                type="button" 
                variant="default"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={endCall}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Guardar Notas
              </Button>
            </div>
          ) : calling ? (
            <Button
              type="button" 
              variant="destructive"
              onClick={cancelCall}
            >
              Cancelar
            </Button>
          ) : (
            <Button
              type="button" 
              variant="outline" 
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}