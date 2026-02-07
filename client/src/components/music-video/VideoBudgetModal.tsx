/**
 * BOOSTIFY Video Budget Modal
 * Pre-generation budget system with dynamic pricing, Stripe payment, and contract
 * 
 * ADMIN: Sees full modal for analysis → can click "Cerrar y Continuar" to bypass payment
 * CLIENT: Sees full modal → MUST accept contract + pay through Stripe to unlock generation
 * 
 * 4x markup on internal costs | Commercial prices ending in $X9
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe as StripeType } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { logger } from '@/lib/logger';
import {
  calculateVideoBudget,
  getAvailableVideoModels,
  formatDuration,
  formatPrice,
  VIDEO_MODEL_PRICING,
  IMAGE_MODEL_PRICING,
  type BudgetConfig,
  type BudgetResult,
} from '../../../../shared/video-budget-calculator';
import {
  DollarSign, Shield, FileText, CreditCard, Lock, Check, X,
  Sparkles, Film, Image, Music, Zap, Clock, AlertTriangle,
  ChevronRight, Eye, EyeOff, Info, Crown, ArrowRight
} from 'lucide-react';

// ============================================
// STRIPE LOADER
// ============================================
const getStripe = async (): Promise<StripeType | null> => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!stripeKey) {
      logger.warn('[VideoBudget] Stripe public key not configured');
      return null;
    }
    return await loadStripe(stripeKey);
  } catch (error) {
    logger.error('[VideoBudget] Error loading Stripe:', error);
    return null;
  }
};

// ============================================
// TYPES
// ============================================
interface VideoBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBudgetApproved: (budgetId: number) => void;
  isAdmin: boolean;
  songDuration: number; // seconds
  numClips: number;
  clipDuration: number; // seconds per clip
  songTitle: string;
  userEmail: string;
  userId?: string;
  projectId?: number;
}

// ============================================
// CHECKOUT FORM (inside Stripe Elements)
// ============================================
function CheckoutForm({ 
  onPaymentSuccess, 
  budgetId,
  displayPrice,
}: { 
  onPaymentSuccess: (paymentIntentId: string) => void; 
  budgetId: number;
  displayPrice: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: 'Error de Pago',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify on server
        await apiRequest('POST', '/api/video-budget/verify-payment', {
          budgetId,
          paymentIntentId: paymentIntent.id,
        });

        toast({
          title: '✅ Pago Exitoso',
          description: 'Tu video ha sido desbloqueado. ¡Comienza la generación!',
        });

        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error procesando el pago',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            Procesando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Pagar ${displayPrice} y Generar Video
          </div>
        )}
      </Button>
    </form>
  );
}

// ============================================
// TIER BADGE COLORS
// ============================================
const tierColors: Record<string, string> = {
  cinematic: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black',
  ultra: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  premium: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  studio: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  standard: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
};

// ============================================
// MAIN MODAL
// ============================================
export function VideoBudgetModal({
  isOpen,
  onClose,
  onBudgetApproved,
  isAdmin,
  songDuration,
  numClips,
  clipDuration,
  songTitle,
  userEmail,
  userId,
  projectId,
}: VideoBudgetModalProps) {
  const { toast } = useToast();
  
  // Config state
  const [videoModelId, setVideoModelId] = useState('kling-2.6-pro');
  const [imageModelId, setImageModelId] = useState('nano-banana-pro');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [includesLipsync, setIncludesLipsync] = useState(true);
  const [includesMotion, setIncludesMotion] = useState(true);
  const [includesMicrocuts, setIncludesMicrocuts] = useState(true);
  const [showInternalCosts, setShowInternalCosts] = useState(false);
  
  // Contract state
  const [contractAccepted, setContractAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState('');
  
  // Payment state
  const [step, setStep] = useState<'config' | 'contract' | 'payment'>('config');
  const [clientSecret, setClientSecret] = useState('');
  const [budgetId, setBudgetId] = useState<number | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<StripeType | null> | null>(null);

  // Calculate budget in real-time
  const budgetConfig: BudgetConfig = useMemo(() => ({
    songDurationSec: songDuration,
    clipDurationSec: clipDuration || 5,
    videoModelId,
    imageModelId,
    includesLipsync,
    includesMotion,
    includesMicrocuts,
    resolution,
  }), [songDuration, clipDuration, videoModelId, imageModelId, includesLipsync, includesMotion, includesMicrocuts, resolution]);

  const budget: BudgetResult = useMemo(() => calculateVideoBudget(budgetConfig), [budgetConfig]);

  // Load Stripe on mount
  useEffect(() => {
    if (isOpen && !isAdmin) {
      setStripePromise(getStripe());
    }
  }, [isOpen, isAdmin]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setContractAccepted(false);
      setTermsAccepted(false);
      setSignature('');
      setClientSecret('');
      setBudgetId(null);
    }
  }, [isOpen]);

  // Admin bypass handler
  const handleAdminBypass = useCallback(async () => {
    try {
      // Create a budget record for tracking
      const response = await apiRequest('POST', '/api/video-budget/create-payment', {
        config: budgetConfig,
        userEmail,
        userId,
        songTitle,
        projectId,
      });

      if (response.adminBypass) {
        toast({
          title: '👑 Admin Bypass',
          description: `Presupuesto registrado: ${formatPrice(budget.displayPrice)} (interno: $${budget.internalCost.toFixed(2)})`,
        });
        onBudgetApproved(response.budgetId);
        return;
      }
    } catch (error: any) {
      logger.warn('[VideoBudget] Admin bypass API failed, using client-side bypass:', error.message);
      // Fallback: approve without DB record if API is unavailable
      toast({
        title: '👑 Admin Bypass (Local)',
        description: `Presupuesto: ${formatPrice(budget.displayPrice)} — registro pendiente`,
      });
      onBudgetApproved(-1); // -1 = no DB record
      return;
    }
  }, [budgetConfig, userEmail, userId, songTitle, projectId, budget, toast, onBudgetApproved]);

  // Proceed to contract step
  const handleProceedToContract = useCallback(() => {
    setStep('contract');
  }, []);

  // Proceed to payment step
  const handleProceedToPayment = useCallback(async () => {
    if (!contractAccepted || !termsAccepted || !signature.trim()) {
      toast({
        title: 'Contrato Incompleto',
        description: 'Debes aceptar los términos y firmar el contrato',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingPayment(true);
    try {
      const response = await apiRequest('POST', '/api/video-budget/create-payment', {
        config: budgetConfig,
        userEmail,
        userId,
        songTitle,
        projectId,
      });

      setBudgetId(response.budgetId);
      setClientSecret(response.clientSecret);

      // Sign contract on server
      await apiRequest('POST', '/api/video-budget/sign-contract', {
        budgetId: response.budgetId,
        signature: signature.trim(),
      });

      setStep('payment');
    } catch (error: any) {
      logger.error('[VideoBudget] Create payment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el pago',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingPayment(false);
    }
  }, [contractAccepted, termsAccepted, signature, budgetConfig, userEmail, userId, songTitle, projectId, toast]);

  // Payment success handler
  const handlePaymentSuccess = useCallback((paymentIntentId: string) => {
    if (budgetId) {
      onBudgetApproved(budgetId);
    }
  }, [budgetId, onBudgetApproved]);

  const videoModels = getAvailableVideoModels();

  // ============================================
  // RENDER
  // ============================================
  return (
    <Dialog open={isOpen} onOpenChange={isAdmin ? onClose : undefined}>
      <DialogContent 
        className="max-w-3xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-zinc-950 to-zinc-900 border border-zinc-700/50"
        onPointerDownOutside={(e) => { if (!isAdmin) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!isAdmin) e.preventDefault(); }}
      >
        {/* Header */}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Film className="w-7 h-7 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Presupuesto de Video Musical
            </span>
            {isAdmin && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Crown className="w-3 h-3 mr-1" /> ADMIN
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            {songTitle} · {formatDuration(songDuration)} · {numClips} clips
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['config', 'contract', 'payment'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-orange-500 text-white scale-110' : 
                ['config', 'contract', 'payment'].indexOf(step) > i ? 'bg-green-500/20 text-green-400' : 
                'bg-zinc-800 text-zinc-500'
              }`}>
                {['config', 'contract', 'payment'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-zinc-600" />}
            </div>
          ))}
        </div>

        {/* ============================================ */}
        {/* STEP 1: Configuration & Budget */}
        {/* ============================================ */}
        {step === 'config' && (
          <div className="space-y-4">
            {/* Model Selection */}
            <Card className="bg-zinc-900/50 border-zinc-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  Calidad del Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-zinc-500 mb-1 block">Motor de Video</Label>
                  <Select value={videoModelId} onValueChange={setVideoModelId}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {videoModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0 ${tierColors[model.tier]}`}>
                              {model.tier.toUpperCase()}
                            </Badge>
                            <span>{model.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {VIDEO_MODEL_PRICING[videoModelId]?.description}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-500 mb-1 block">Motor de Imágenes</Label>
                  <Select value={imageModelId} onValueChange={setImageModelId}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {Object.entries(IMAGE_MODEL_PRICING).map(([id, model]) => (
                        <SelectItem key={id} value={id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-zinc-500 mb-1 block">Resolución</Label>
                  <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="720p">720p HD</SelectItem>
                      <SelectItem value="1080p">1080p Full HD</SelectItem>
                      <SelectItem value="4k">4K Ultra HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Features Toggle */}
            <Card className="bg-zinc-900/50 border-zinc-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Efectos Profesionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="lipsync" 
                      checked={includesLipsync} 
                      onCheckedChange={(v) => setIncludesLipsync(!!v)}
                    />
                    <Label htmlFor="lipsync" className="text-sm cursor-pointer">
                      🎤 LipSync AI (PixVerse)
                    </Label>
                  </div>
                  <span className="text-xs text-zinc-500">Sincronización labial</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="motion" 
                      checked={includesMotion} 
                      onCheckedChange={(v) => setIncludesMotion(!!v)}
                    />
                    <Label htmlFor="motion" className="text-sm cursor-pointer">
                      🕺 Motion Transfer (DreamActor)
                    </Label>
                  </div>
                  <span className="text-xs text-zinc-500">Coreografía</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="microcuts" 
                      checked={includesMicrocuts} 
                      onCheckedChange={(v) => setIncludesMicrocuts(!!v)}
                    />
                    <Label htmlFor="microcuts" className="text-sm cursor-pointer">
                      ⚡ MicroCuts Engine
                    </Label>
                  </div>
                  <span className="text-xs text-zinc-500">Efectos cinematográficos</span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="bg-zinc-900/50 border-zinc-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Desglose de Costos
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowInternalCosts(!showInternalCosts)}
                      className="ml-auto h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300"
                    >
                      {showInternalCosts ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                      {showInternalCosts ? 'Ocultar Internos' : 'Ver Internos'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <CostLine 
                    label={`🖼️ ${budget.costBreakdown.images.count} imágenes`}
                    value={budget.costBreakdown.images.total}
                    showInternal={showInternalCosts}
                    detail={`${budget.costBreakdown.images.count} × $${budget.costBreakdown.images.unitCost}`}
                  />
                  <CostLine 
                    label={`🎬 ${budget.costBreakdown.videos.count} clips de video`}
                    value={budget.costBreakdown.videos.total}
                    showInternal={showInternalCosts}
                    detail={`${budget.costBreakdown.videos.count} × $${budget.costBreakdown.videos.unitCost.toFixed(3)}`}
                  />
                  {includesLipsync && (
                    <CostLine 
                      label={`🎤 ${budget.costBreakdown.lipsync.count} clips lipsync`}
                      value={budget.costBreakdown.lipsync.total}
                      showInternal={showInternalCosts}
                    />
                  )}
                  {includesMotion && (
                    <CostLine 
                      label={`🕺 ${budget.costBreakdown.motion.count} motion transfer`}
                      value={budget.costBreakdown.motion.total}
                      showInternal={showInternalCosts}
                    />
                  )}
                  <CostLine 
                    label="🤖 OpenAI Pipeline"
                    value={budget.costBreakdown.openai.total}
                    showInternal={showInternalCosts}
                  />
                  <CostLine 
                    label={`🎞️ ${budget.costBreakdown.render.passes} render passes`}
                    value={budget.costBreakdown.render.total}
                    showInternal={showInternalCosts}
                  />
                  <CostLine 
                    label="🔄 Buffer de correcciones"
                    value={budget.costBreakdown.corrections.total}
                    showInternal={showInternalCosts}
                    detail={`${(budget.costBreakdown.corrections.buffer * 100).toFixed(0)}% del subtotal`}
                  />

                  <Separator className="bg-zinc-700/50 my-2" />

                  {/* Internal cost - admin only */}
                  {isAdmin && showInternalCosts && (
                    <div className="flex justify-between items-center text-yellow-400 text-xs bg-yellow-500/5 rounded px-2 py-1">
                      <span>💰 Costo Interno</span>
                      <span className="font-mono font-bold">${budget.internalCost.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Display price */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${tierColors[budget.videoModel.tier]} text-xs`}>
                        {budget.tierEmoji} {budget.tierLabel}
                      </Badge>
                      <span className="text-zinc-300 font-medium">Total</span>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        ${budget.displayPrice}
                      </span>
                      <span className="text-xs text-zinc-500 block">USD · pago único</span>
                    </div>
                  </div>

                  {/* Per clip cost */}
                  <div className="text-center text-xs text-zinc-500 mt-1">
                    ${budget.costPerClip}/clip · {budget.numClips} clips · {formatDuration(songDuration)}
                  </div>

                  {/* Admin internal details */}
                  {isAdmin && showInternalCosts && (
                    <div className="mt-2 p-2 rounded bg-yellow-500/5 border border-yellow-500/20 text-[11px] text-yellow-400/70">
                      <p>Markup: {budget.markupMultiplier}x | Precio crudo: ${budget.userPrice.toFixed(2)} → Display: ${budget.displayPrice}</p>
                      <p>Margen: ${(budget.displayPrice - budget.internalCost).toFixed(2)} ({((1 - budget.internalCost / budget.displayPrice) * 100).toFixed(0)}%)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {isAdmin && (
                <Button
                  onClick={handleAdminBypass}
                  variant="outline"
                  className="flex-1 h-12 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Cerrar y Continuar
                </Button>
              )}
              <Button
                onClick={isAdmin ? handleProceedToContract : handleProceedToContract}
                className="flex-1 h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
              >
                {isAdmin ? 'Ver Contrato' : 'Continuar'} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 2: Contract */}
        {/* ============================================ */}
        {step === 'contract' && (
          <div className="space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Contrato de Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-48 overflow-y-auto text-xs text-zinc-400 bg-zinc-800/50 rounded p-3 border border-zinc-700/50 space-y-2">
                  <p className="font-bold text-zinc-300">CONTRATO DE GENERACIÓN DE VIDEO MUSICAL — BOOSTIFY</p>
                  <p>Fecha: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p>Cliente: {userEmail}</p>
                  <p>Proyecto: "{songTitle}" — {formatDuration(songDuration)}</p>
                  <Separator className="bg-zinc-700/30" />
                  
                  <p className="font-semibold text-zinc-300">1. SERVICIO</p>
                  <p>Boostify generará un video musical profesional utilizando inteligencia artificial de última generación. 
                  El servicio incluye: generación de {budget.numClips} clips con el motor {budget.videoModel.name}, 
                  {includesLipsync ? ' sincronización labial (LipSync),' : ''} 
                  {includesMotion ? ' transferencia de movimiento,' : ''} 
                  {includesMicrocuts ? ' efectos MicroCuts,' : ''} 
                  renderizado profesional en {resolution}, y correcciones incluidas.</p>
                  
                  <p className="font-semibold text-zinc-300">2. PRECIO Y PAGO</p>
                  <p>El precio total del servicio es de ${budget.displayPrice} USD, pagadero en su totalidad antes del inicio de la generación. 
                  El pago se procesa de forma segura a través de Stripe.</p>
                  
                  <p className="font-semibold text-zinc-300">3. TIEMPO DE ENTREGA</p>
                  <p>El video será generado en un plazo estimado de 15-45 minutos, dependiendo de la complejidad y 
                  la carga del sistema. Boostify no garantiza tiempos exactos.</p>
                  
                  <p className="font-semibold text-zinc-300">4. PROPIEDAD INTELECTUAL</p>
                  <p>El cliente retiene todos los derechos sobre el contenido original (música, letra, imagen del artista). 
                  Boostify retiene los derechos sobre la tecnología y procesos utilizados. El video generado es propiedad del cliente.</p>
                  
                  <p className="font-semibold text-zinc-300">5. CORRECCIONES</p>
                  <p>El presupuesto incluye un buffer de correcciones ({(budget.costBreakdown.corrections.buffer * 100).toFixed(0)}% del costo base). 
                  Correcciones adicionales más allá del buffer incluido podrían tener costos adicionales.</p>
                  
                  <p className="font-semibold text-zinc-300">6. REEMBOLSO</p>
                  <p>Boostify ofrece una garantía de satisfacción de 30 días. Si el resultado final no cumple 
                  con los estándares de calidad profesional, se procesará un reembolso completo.</p>
                  
                  <p className="font-semibold text-zinc-300">7. NATURALEZA DEL CONTENIDO IA</p>
                  <p>El contenido es generado por modelos de inteligencia artificial. Aunque Boostify emplea los mejores 
                  modelos disponibles (Kling, Veo, Grok), los resultados pueden variar. No se garantiza perfección 
                  fotorrealista en todos los casos.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="contract" 
                      checked={contractAccepted}
                      onCheckedChange={(v) => setContractAccepted(!!v)}
                    />
                    <Label htmlFor="contract" className="text-sm cursor-pointer leading-tight">
                      He leído y acepto los términos del contrato de servicio de generación de video musical.
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(v) => setTermsAccepted(!!v)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                      Acepto el cargo de <strong>${budget.displayPrice} USD</strong> a mi método de pago por 
                      la generación de este video musical.
                    </Label>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-zinc-500 mb-1 block">Firma Digital</Label>
                    <Input
                      placeholder="Escribe tu nombre completo como firma"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 font-serif italic"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              <div>
                <p className="text-sm text-zinc-300">
                  <Badge className={`${tierColors[budget.videoModel.tier]} text-xs mr-2`}>
                    {budget.tierEmoji} {budget.tierLabel}
                  </Badge>
                  {budget.numClips} clips · {budget.videoModel.name}
                </p>
              </div>
              <p className="text-2xl font-black text-green-400">${budget.displayPrice}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setStep('config')}
                variant="outline"
                className="flex-1 h-11 border-zinc-700"
              >
                ← Volver
              </Button>
              {isAdmin ? (
                <Button
                  onClick={handleAdminBypass}
                  className="flex-1 h-11 text-lg font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-600 hover:to-amber-600"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Aprobar como Admin
                </Button>
              ) : (
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!contractAccepted || !termsAccepted || !signature.trim() || isCreatingPayment}
                  className="flex-1 h-11 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {isCreatingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Preparando...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceder al Pago
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STEP 3: Payment */}
        {/* ============================================ */}
        {step === 'payment' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
              <div>
                <p className="text-lg font-bold text-zinc-200">{songTitle}</p>
                <p className="text-xs text-zinc-500">
                  {budget.numClips} clips · {budget.videoModel.name} · {resolution}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-green-400">${budget.displayPrice}</p>
                <p className="text-xs text-zinc-500">USD</p>
              </div>
            </div>

            {/* Stripe Payment */}
            <Card className="bg-zinc-900/50 border-zinc-700/50">
              <CardContent className="pt-4">
                {clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      onPaymentSuccess={handlePaymentSuccess}
                      budgetId={budgetId!}
                      displayPrice={budget.displayPrice}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security note */}
            <div className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Pago seguro con Stripe · Garantía de 30 días · Cifrado SSL
            </div>

            <Button
              onClick={() => setStep('contract')}
              variant="ghost"
              className="w-full text-zinc-500 hover:text-zinc-300"
            >
              ← Volver al contrato
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COST LINE HELPER
// ============================================
function CostLine({ 
  label, 
  value, 
  showInternal, 
  detail 
}: { 
  label: string; 
  value: number; 
  showInternal: boolean;
  detail?: string;
}) {
  return (
    <div className="flex justify-between items-center text-zinc-400">
      <div>
        <span>{label}</span>
        {detail && <span className="text-[10px] text-zinc-600 ml-1">({detail})</span>}
      </div>
      {showInternal ? (
        <span className="text-xs font-mono text-yellow-400/70">${value.toFixed(2)}</span>
      ) : (
        <span className="text-xs text-zinc-600">✓</span>
      )}
    </div>
  );
}
