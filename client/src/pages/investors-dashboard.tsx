import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  BarChart2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
  BarChart,
  Target,
  CreditCard,
  Check, 
  Calculator,
  UserPlus,
  Save,
  PenSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
// Investment Calculator Component
function InvestmentCalculator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [returnRate, setReturnRate] = useState(5); // Default to 5%
  const [durationMonths, setDurationMonths] = useState(12);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [email, setEmail] = useState("");

  // Recalculate returns whenever inputs change
  useEffect(() => {
    const calculatedMonthlyReturn = (investmentAmount * returnRate) / 100;
    const calculatedTotalReturn = calculatedMonthlyReturn * durationMonths;
    const calculatedFinalAmount = investmentAmount + calculatedTotalReturn;

    setMonthlyReturn(calculatedMonthlyReturn);
    setTotalReturn(calculatedTotalReturn);
    setFinalAmount(calculatedFinalAmount);
  }, [investmentAmount, returnRate, durationMonths]);

  // Función para procesar la inversión con Stripe
  const handleInvestmentPayment = async () => {
    try {
      setIsLoading(true);
      
      // Si el usuario no está autenticado y no ha proporcionado un email, mostrar advertencia
      if (!user && !email) {
        setShowAuthWarning(true);
        setIsLoading(false);
        return;
      }
      
      // Preparar datos para la solicitud
      const paymentData = {
        amount: investmentAmount,
        duration: durationMonths,
        rate: returnRate,
        name: `Inversión de $${investmentAmount} por ${durationMonths} meses`,
        userId: user?.uid,
        email: email || user?.email
      };
      
      // Enviar solicitud al servidor
      const response = await fetch('/api/investors/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        // Redirigir al usuario a la página de pago de Stripe
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }
    } catch (error: any) {
      console.error('Error al procesar inversión:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar tu inversión. Inténtalo de nuevo más tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card className="p-6 mb-6">
          <h4 className="text-base font-medium mb-6">Adjust Parameters</h4>
          
          <div className="space-y-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Investment Amount</label>
                <span className="text-sm font-medium">${investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[investmentAmount]}
                  min={2000}
                  max={100000}
                  step={1000}
                  onValueChange={(value) => setInvestmentAmount(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Return Rate</label>
                <span className="text-sm font-medium">{returnRate}% monthly</span>
              </div>
              <div className="flex items-center gap-4">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[returnRate]}
                  min={4}
                  max={6}
                  step={0.1}
                  onValueChange={(value) => setReturnRate(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Duration</label>
                <span className="text-sm font-medium">{durationMonths} months</span>
              </div>
              <div className="flex items-center gap-4">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[durationMonths]}
                  min={6}
                  max={36}
                  step={1}
                  onValueChange={(value) => setDurationMonths(value[0])}
                  className="flex-1"
                />
              </div>
            </div>
            
            {!user && (
              <div className="mt-4">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email para contacto (requerido para no usuarios)
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="mt-1"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {showAuthWarning && !email && (
                  <p className="text-sm text-red-500 mt-1">
                    Por favor proporciona un email para continuar
                  </p>
                )}
              </div>
            )}

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                // Solo actualiza los cálculos, mantiene valores actuales
                const event = new Event('recalculate');
                window.dispatchEvent(event);
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate
            </Button>
          </div>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            This calculator provides an estimate based on our current investment plans. Actual returns may vary.
          </p>
        </div>
      </div>

      <div>
        <Card className="p-6 overflow-hidden bg-gradient-to-br from-orange-500/10 to-background border-orange-500/20">
          <h4 className="text-lg font-medium mb-8">Investment Results</h4>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Return</p>
                <p className="text-2xl font-bold">${monthlyReturn.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-2xl font-bold">${totalReturn.toFixed(2)}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
            
            <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <div>
                <p className="text-sm text-muted-foreground">Monto Final</p>
                <p className="text-3xl font-bold">${finalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className="text-xl font-bold text-orange-500">{((totalReturn / investmentAmount) * 100).toFixed(2)}%</p>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
              onClick={handleInvestmentPayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Invertir Ahora
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Componente Timeline Roadmap
function RoadmapTimeline() {
  const roadmapData = [
    {
      date: "1 Marzo 2025",
      title: "Lanzamiento Oficial de Boostify",
      description: "Lanzamiento oficial de la plataforma completa de Boostify Music con todas las funcionalidades centrales y herramientas de IA.",
      stats: "Objetivo: 100 artistas verificados",
      status: "upcoming",
      isKey: true
    },
    {
      date: "15 Marzo 2025",
      title: "Integración con Spotify y Apple Music",
      description: "Conexión directa con las principales plataformas de streaming para sincronización de perfiles y estadísticas.",
      stats: "Mejora de engagement: +30%",
      status: "upcoming"
    },
    {
      date: "Abril 2025",
      title: "Lanzamiento de Herramientas para Managers",
      description: "Suite completa de herramientas de gestión para managers musicales, incluyendo contratos automatizados y booking digital.",
      stats: "Objetivo: 250 usuarios activos",
      status: "upcoming"
    },
    {
      date: "Mayo 2025",
      title: "Integración de Pasarela de Pagos",
      description: "Implementación de sistema de pagos para monetización directa de contenido y servicios entre artistas y fans.",
      stats: "Proyección: primeros $10k en transacciones",
      status: "upcoming"
    },
    {
      date: "Junio 2025",
      title: "Hito: 500 Usuarios Activos",
      description: "Primera meta de crecimiento, con foco en artistas emergentes y productores independientes.",
      stats: "500 usuarios, $25k en transacciones mensuales",
      status: "upcoming",
      isKey: true
    },
    {
      date: "Julio 2025",
      title: "Lanzamiento de Distribuidor Digital",
      description: "Servicio propio de distribución digital a todas las plataformas con analíticas avanzadas y pagos transparentes.",
      stats: "Comisión competitiva: solo 10%",
      status: "upcoming"
    },
    {
      date: "Agosto 2025",
      title: "Marketplace para Colaboraciones",
      description: "Plataforma para conectar artistas, productores, ingenieros y otros creativos para colaboraciones remuneradas.",
      stats: "Proyección: 120 colaboraciones mensuales",
      status: "upcoming"
    },
    {
      date: "Septiembre 2025",
      title: "Hito: 1,500 Usuarios Activos",
      description: "Expansión significativa de la base de usuarios. Inicio de adquisición de sellos independientes.",
      stats: "1,500 usuarios, $80k en transacciones",
      status: "upcoming",
      isKey: true
    },
    {
      date: "Octubre 2025",
      title: "Lanzamiento de Festival Virtual",
      description: "Primer festival virtual de Boostify con artistas de la plataforma, utilizando tecnología de streaming inmersivo.",
      stats: "Meta: 5,000 asistentes virtuales",
      status: "upcoming"
    },
    {
      date: "Noviembre 2025",
      title: "Integración con TikTok y YouTube",
      description: "Herramientas avanzadas para promoción y monetización en las principales plataformas de video social.",
      stats: "Proyección: +40% de visibilidad para artistas",
      status: "upcoming"
    },
    {
      date: "Diciembre 2025",
      title: "Hito: 10,000 Usuarios Activos",
      description: "Meta ambiciosa de crecimiento para el cierre del año 2025, consolidando Boostify como plataforma líder.",
      stats: "10,000 usuarios, $250k en transacciones mensuales",
      status: "upcoming",
      isKey: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Gráfica de Crecimiento Proyectado */}
      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-lg mb-8">
        <h4 className="text-lg font-semibold mb-4">Crecimiento Proyectado de Usuarios en 2025</h4>
        <div className="h-64 relative">
          {/* Eje Y */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between items-end pr-2">
            <span className="text-xs text-muted-foreground">10K</span>
            <span className="text-xs text-muted-foreground">7.5K</span>
            <span className="text-xs text-muted-foreground">5K</span>
            <span className="text-xs text-muted-foreground">2.5K</span>
            <span className="text-xs text-muted-foreground">0</span>
          </div>
          
          {/* Gráfica */}
          <div className="ml-12 h-full flex items-end">
            <div className="flex-1 flex items-end space-x-4">
              {[
                { month: "Mar", users: 100, height: "1%" },
                { month: "Abr", users: 250, height: "2.5%" },
                { month: "May", users: 375, height: "3.75%" },
                { month: "Jun", users: 500, height: "5%" },
                { month: "Jul", users: 750, height: "7.5%" },
                { month: "Ago", users: 1200, height: "12%" },
                { month: "Sep", users: 1500, height: "15%" },
                { month: "Oct", users: 3000, height: "30%" },
                { month: "Nov", users: 6000, height: "60%" },
                { month: "Dic", users: 10000, height: "100%" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full max-w-[50px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t relative group cursor-pointer"
                    style={{ height: item.height }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.users.toLocaleString()} usuarios
                    </div>
                  </div>
                  <span className="text-xs mt-2 text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative mt-8">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-orange-500/20"></div>
        <div className="space-y-8">
          {roadmapData.map((item, index) => (
            <div key={index} className="relative pl-16">
              <div className={`absolute left-5 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                item.status === 'completed' ? 'bg-orange-500 border-orange-500' : 
                item.status === 'inProgress' ? 'bg-background border-orange-500' : 
                item.isKey ? 'bg-background border-yellow-500' : 'bg-background border-muted-foreground'
              }`}>
                {item.status === 'completed' ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : item.status === 'inProgress' ? (
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                ) : item.isKey ? (
                  <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                ) : (
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>

              <div className={`pb-4 ${item.isKey ? 'bg-orange-500/5 p-4 rounded-lg border border-orange-500/20' : ''}`}>
                <span className={`text-sm font-medium ${item.isKey ? 'text-orange-500' : 'text-muted-foreground'} px-2 py-1 ${item.isKey ? 'bg-orange-500/10' : 'bg-muted/50'} rounded mb-2 inline-block`}>
                  {item.date}
                </span>
                <h4 className={`text-base font-medium mt-2 mb-1 ${item.isKey ? 'text-orange-500' : ''}`}>{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {item.stats && (
                  <div className="mt-2 text-xs inline-block px-2 py-1 bg-black/20 rounded font-medium">
                    {item.stats}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente Gráfico de Rendimiento de Inversión
function InvestmentPerformanceChart({ data }: { data: { month: string; return: number }[] }) {
  return (
    <div className="w-full h-64 flex flex-col justify-center">
      <div className="flex justify-between items-center h-full">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center justify-end h-full flex-1">
            <div 
              className="w-8 bg-orange-500 rounded-t-sm relative group"
              style={{ height: `${(item.return / 6) * 100}%` }}
            >
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-background border border-border px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.return}% en {item.month}
              </div>
            </div>
            <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Rendimiento mensual en porcentaje (%)
      </div>
    </div>
  );
}

// Componente Tabla de Riesgo/Retorno
function RiskReturnTable() {
  const riskReturnData = [
    { riskLevel: "Bajo", returnRange: "4.0 - 4.5%", volatility: "Baja", recommendation: "Conservadores" },
    { riskLevel: "Medio", returnRange: "4.5 - 5.5%", volatility: "Media", recommendation: "Balanceados" },
    { riskLevel: "Alto", returnRange: "5.5 - 6.0%", volatility: "Alta", recommendation: "Crecimiento" }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3">Nivel de Riesgo</th>
            <th className="text-left py-2 px-3">Retorno Mensual</th>
            <th className="text-left py-2 px-3">Volatilidad</th>
            <th className="text-left py-2 px-3">Recomendado para</th>
          </tr>
        </thead>
        <tbody>
          {riskReturnData.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.riskLevel === "Bajo" ? "bg-blue-500" :
                    item.riskLevel === "Medio" ? "bg-orange-500" : "bg-red-500"
                  }`}></div>
                  {item.riskLevel}
                </div>
              </td>
              <td className="py-3 px-3">{item.returnRange}</td>
              <td className="py-3 px-3">{item.volatility}</td>
              <td className="py-3 px-3">Inversores {item.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Investor Registration Form Component
function InvestorRegistrationForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form validation schema
  const formSchema = z.object({
    fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().min(10, { message: "Please enter a valid phone number." }),
    country: z.string().min(2, { message: "Please select your country." }),
    investmentAmount: z.string().min(1, { message: "Please enter your investment amount." }),
    investmentGoals: z.string().min(10, { message: "Please describe your investment goals." }),
    riskTolerance: z.enum(["low", "medium", "high"], {
      required_error: "Please select your risk tolerance.",
    }),
    investorType: z.enum(["individual", "corporate", "institutional"], {
      required_error: "Please select your investor type.",
    }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: user?.email || "",
      phone: "",
      country: "",
      investmentAmount: "",
      investmentGoals: "",
      riskTolerance: "medium",
      investorType: "individual",
      termsAccepted: false,
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to register as an investor.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create document with investor data
      const investorData = {
        ...values,
        userId: user.uid,
        investmentAmount: parseFloat(values.investmentAmount),
        createdAt: serverTimestamp(),
        status: "pending"
      };
      
      // Direct Firestore access (with updated security rules)
      try {
        // Add document to Firestore collection
        const docRef = await addDoc(collection(db, "investors"), investorData);
        console.log("Investor registration saved with ID:", docRef.id);
        
        toast({
          title: "Registration Successful",
          description: "Your investor registration has been submitted successfully.",
          variant: "default",
        });
        
        // Reset form
        form.reset();
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        
        if (firestoreError instanceof Error && firestoreError.message.includes("permission-denied")) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to register as an investor. Please check your account or contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: "There was an error registering your investor information. Please try again.",
            variant: "destructive",
          });
        }
        
        throw firestoreError;
      }
      
    } catch (error) {
      console.error("Error submitting investor registration:", error);
      
      if (!(error instanceof Error) || !error.message.includes("permission-denied")) {
        toast({
          title: "Registration Failed",
          description: "There was an unexpected error. Please try again or contact support.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-full">
          <UserPlus className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Investor Registration</h3>
          <p className="text-sm text-muted-foreground">
            Register to become an investor in Boostify Music
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investmentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Amount (USD)</FormLabel>
                  <FormControl>
                    <Input placeholder="5000" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="investorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investor Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskTolerance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tolerance</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="investmentGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your investment goals and expectations..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-muted/50">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-1"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I accept the terms and conditions of investment
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, you agree to our investment terms, privacy policy, and acknowledge the risks involved.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Submitting</span>
                <Clock className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Register as Investor
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

// Componente Estadísticas del Inversor 
function InvestorStats() {
  const stats = [
    { 
      title: "Inversores Activos", 
      value: "187", 
      growth: "+12%", 
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10" 
    },
    { 
      title: "Inversión Promedio", 
      value: "$7,250", 
      growth: "+5%", 
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10" 
    },
    { 
      title: "Retorno Promedio", 
      value: "4.8%", 
      growth: "+0.2%", 
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10" 
    },
    { 
      title: "Capital Recaudado", 
      value: "$3.2M", 
      growth: "+8%", 
      icon: BarChart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10" 
    }
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${stat.bgColor} rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stat.value}</p>
                <span className="text-xs font-medium text-green-500">{stat.growth}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

export default function InvestorsDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { user } = useAuth();

  // Simulated user investment data
  const investmentData = {
    totalInvested: 5000,
    currentValue: 5450,
    monthlyReturns: [
      { month: 'Jan', return: 4.2 },
      { month: 'Feb', return: 5.1 },
      { month: 'Mar', return: 4.8 },
      { month: 'Apr', return: 5.3 },
      { month: 'May', return: 4.9 },
      { month: 'Jun', return: 5.5 }
    ],
    nextPaymentDate: '2025-03-15',
    investmentRounds: [
      { name: 'Seed Round', date: '2024-06-01', status: 'Closed', raised: '$500K' },
      { name: 'Angel Round', date: '2024-09-15', status: 'Closed', raised: '$1.2M' },
      { name: 'Series A', date: '2025-01-30', status: 'Active', raised: '$3.5M' },
      { name: 'Series B', date: '2025-07-15', status: 'Upcoming', target: '$8M' }
    ]
  };

  // Handle investment button click
  const handleInvestNow = async () => {
    try {
      // Obtener información del usuario actual
      if (!user) {
        // Mostrar un mensaje para que el usuario inicie sesión o vaya a la calculadora
        toast({
          title: "Necesitas iniciar sesión",
          description: "Puedes utilizar nuestra calculadora de inversiones para procesar un pago sin iniciar sesión",
          variant: "default",
          action: (
            <Button 
              onClick={() => setSelectedTab("calculator")}
              variant="outline" 
              size="sm"
            >
              Ir a calculadora
            </Button>
          )
        });
        return;
      }
      
      // Valores predeterminados para inversión rápida
      const paymentData = {
        amount: 5000, // Monto predeterminado
        duration: 12, // 12 meses
        rate: 5, // 5% mensual
        name: `Inversión Rápida en Boostify Music`,
        userId: user.uid,
        email: user.email
      };
      
      // Iniciar pantalla de carga
      toast({
        title: "Preparando pago",
        description: "Estamos configurando tu sesión de pago...",
        variant: "default"
      });
      
      // Enviar solicitud al servidor
      const response = await fetch('/api/investors/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        // Redirigir al usuario a la página de pago de Stripe
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }
    } catch (error: any) {
      console.error('Error al procesar inversión rápida:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar tu inversión. Inténtalo usando la calculadora.",
        variant: "destructive"
      });
    }
  };

  // Handle contract download
  const handleDownloadContract = () => {
    console.log("Downloading investment contract...");
    alert("Downloading investment contract template... This is a simulation.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-14 sm:pb-0">
      <Header />
      <main className="flex-1 pt-14 sm:pt-16">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
            {/* Hero Section */}
            <section className="relative rounded-xl overflow-hidden mb-6 sm:mb-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-4 sm:p-8">
              <div className="relative">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Investor Dashboard
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-6">
                  Manage your investments, monitor returns, and explore new opportunities with Boostify Music
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={handleInvestNow} size="lg" className="bg-orange-500 hover:bg-orange-600">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Invest Now
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleDownloadContract}>
                    <Download className="mr-2 h-5 w-5" />
                    Download Contract
                  </Button>
                </div>
              </div>
            </section>

            {/* Main Content Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-5 max-w-[1000px] mb-4 sm:mb-8 text-xs">
                <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
                  <BarChart2 className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="calculator" className="data-[state=active]:bg-orange-500">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Calculator</span>
                </TabsTrigger>
                <TabsTrigger value="investments" className="data-[state=active]:bg-orange-500">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Investments</span>
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="data-[state=active]:bg-orange-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Roadmap</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-orange-500">
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Register</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <InvestorStats />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Investment Performance</h3>
                    <InvestmentPerformanceChart data={investmentData.monthlyReturns} />
                  </Card>

                  <Card className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Risk and Return</h3>
                    <RiskReturnTable />
                  </Card>
                </div>

                <Card className="p-4 sm:p-6 mb-8">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">Investor Information</h3>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Info
                    </Button>
                  </div>

                  <div className="prose prose-orange dark:prose-invert max-w-none text-sm sm:text-base">
                    <h4 className="text-base sm:text-lg font-medium text-white">Investing in Boostify Music</h4>
                    <p className="text-white">
                      Boostify Music offers a unique opportunity to invest in the future of the music industry. Our AI-powered platform is revolutionizing how artists, producers, and fans interact with music.
                    </p>
                    
                    <h4 className="text-base sm:text-lg font-medium mt-4 text-white">Investment Benefits</h4>
                    <ul className="space-y-2 text-white">
                      <li><strong className="text-white">Monthly Returns:</strong> 4-6% based on your selected investment plan</li>
                      <li><strong className="text-white">Minimum Investment:</strong> $2,000 USD</li>
                      <li><strong className="text-white">Monthly Payments:</strong> Profit distribution on the 15th of each month</li>
                      <li><strong className="text-white">Transparent Contracts:</strong> Clear terms and comprehensive documentation</li>
                      <li><strong className="text-white">Exclusive Dashboard:</strong> Access to real-time statistics and analysis tools</li>
                    </ul>

                    <h4 className="text-base sm:text-lg font-medium mt-4 text-white">Upcoming Milestones</h4>
                    <p className="text-white">
                      We're rapidly expanding, with the upcoming launch of our AI-enhanced streaming platform and new creator tools. Series B funding will accelerate our international growth.
                    </p>
                    
                    <div className="not-prose mt-6">
                      <Button onClick={handleInvestNow} className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Start Investing
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Calculator Tab */}
              <TabsContent value="calculator">
                <Card className="p-4 sm:p-6 mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Investment Calculator</h3>
                  <InvestmentCalculator />
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">Investment Plans</h3>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="p-4 sm:p-6 border-2 border-muted">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Standard Plan</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Low Risk</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">4%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $2,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 6 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Plan</Button>
                    </Card>

                    <Card className="p-4 sm:p-6 border-2 border-orange-500 shadow-lg relative">
                      <div className="absolute -top-3 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full">
                        Recommended
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Premium Plan</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Medium Risk</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">5%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $5,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 12 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Access to exclusive events</span>
                        </li>
                      </ul>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">Select Plan</Button>
                    </Card>

                    <Card className="p-4 sm:p-6 border-2 border-muted sm:col-span-2 md:col-span-1">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-base sm:text-lg font-medium">Elite Plan</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">High Potential</span>
                      </div>
                      <div className="flex items-baseline mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold">6%</span>
                        <span className="text-muted-foreground ml-1">monthly</span>
                      </div>
                      <ul className="space-y-2 mb-4 sm:mb-6 text-sm sm:text-base">
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum investment: $25,000</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Minimum term: 18 months</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Monthly payments</span>
                        </li>
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                          <span>Participation in strategic decisions</span>
                        </li>
                      </ul>
                      <Button className="w-full" variant="outline">Select Plan</Button>
                    </Card>
                  </div>

                  <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm sm:text-base">Important Notice</h4>
                        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                          All investments involve risks. Past returns do not guarantee future results. Please read the contract carefully and consult a financial advisor before investing.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Investments Tab */}
              <TabsContent value="investments">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Investment</p>
                        <p className="text-xl sm:text-2xl font-bold">${investmentData.totalInvested}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Current Value</p>
                        <p className="text-xl sm:text-2xl font-bold">${investmentData.currentValue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6 sm:col-span-1">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Next Payment</p>
                        <p className="text-xl sm:text-2xl font-bold">{new Date(investmentData.nextPaymentDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Investment History</h3>
                  
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Date</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Type</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Amount</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Return</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 sm:py-3 px-4">Jan 15, 2025</td>
                          <td className="py-2 sm:py-3 px-4">Premium Plan</td>
                          <td className="py-2 sm:py-3 px-4">$5,000</td>
                          <td className="py-2 sm:py-3 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                          <td className="py-2 sm:py-3 px-4">$250 / month</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 sm:py-3 px-4">Dec 20, 2024</td>
                          <td className="py-2 sm:py-3 px-4">Monthly Payment</td>
                          <td className="py-2 sm:py-3 px-4">$250</td>
                          <td className="py-2 sm:py-3 px-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Received</span></td>
                          <td className="py-2 sm:py-3 px-4">-</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 sm:py-3 px-4">Nov 20, 2024</td>
                          <td className="py-2 sm:py-3 px-4">Monthly Payment</td>
                          <td className="py-2 sm:py-3 px-4">$250</td>
                          <td className="py-2 sm:py-3 px-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Received</span></td>
                          <td className="py-2 sm:py-3 px-4">-</td>
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-2 sm:py-3 px-4">Oct 20, 2024</td>
                          <td className="py-2 sm:py-3 px-4">Monthly Payment</td>
                          <td className="py-2 sm:py-3 px-4">$250</td>
                          <td className="py-2 sm:py-3 px-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Received</span></td>
                          <td className="py-2 sm:py-3 px-4">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold">Investment Rounds</h3>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Invest
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Round</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Date</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Amount</th>
                          <th className="text-left py-2 sm:py-3 px-4 text-xs sm:text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        {investmentData.investmentRounds.map((round, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-2 sm:py-3 px-4">{round.name}</td>
                            <td className="py-2 sm:py-3 px-4">{round.date}</td>
                            <td className="py-2 sm:py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                round.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                round.status === 'Closed' ? 'bg-gray-100 text-gray-800' : 
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {round.status}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 px-4">{round.raised || round.target}</td>
                            <td className="py-2 sm:py-3 px-4">
                              {round.status === 'Active' && (
                                <Button size="sm" variant="outline">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Invest
                                </Button>
                              )}
                              {round.status === 'Upcoming' && (
                                <Button size="sm" variant="ghost" disabled>
                                  Coming Soon
                                </Button>
                              )}
                              {round.status === 'Closed' && (
                                <Button size="sm" variant="ghost" disabled>
                                  Closed
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              {/* Roadmap Tab */}
              <TabsContent value="roadmap">
                <Card className="p-4 sm:p-6 mb-6 sm:mb-8 bg-black/20 border-orange-500/20">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white">Boostify Music Roadmap</h3>
                  <RoadmapTimeline />
                </Card>

                <Card className="p-4 sm:p-6 bg-black/20 border-orange-500/20">
                  <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-white">Financial Projections</h3>
                  
                  <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <h4 className="text-sm sm:text-base font-medium mb-3 sm:mb-4 text-white">Projected User Growth</h4>
                      <div className="h-48 sm:h-64 bg-black/30 rounded-lg p-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-500/10"></div>
                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/70">Users (millions)</span>
                            <div className="flex space-x-2">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">Current</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200">Projected</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 flex items-end space-x-2">
                            {/* Q1 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[15%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[25%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q1</span>
                            </div>
                            
                            {/* Q2 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[22%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[35%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q2</span>
                            </div>
                            
                            {/* Q3 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[30%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[45%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q3</span>
                            </div>
                            
                            {/* Q4 2025 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[40%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[60%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q4</span>
                            </div>
                            
                            {/* Q1 2026 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[50%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-[80%] w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q1 '26</span>
                            </div>
                            
                            {/* Q2 2026 */}
                            <div className="flex-1 flex flex-col items-center">
                              <div className="h-[60%] w-3 bg-blue-500 rounded-t mb-1"></div>
                              <div className="h-full w-3 bg-orange-500/70 rounded-t"></div>
                              <span className="text-[8px] sm:text-xs mt-1 text-white/70">Q2 '26</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-white/70">0.8M now</span>
                              <span className="text-xs text-white/70">2.5M by Q2 '26</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm sm:text-base font-medium mb-3 sm:mb-4 text-white">Projected Revenue Growth</h4>
                      <div className="h-48 sm:h-64 bg-black/30 rounded-lg p-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-500/10"></div>
                        <div className="relative z-10 h-full flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/70">Revenue ($ millions)</span>
                            <div className="flex space-x-2">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-200">Actual</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200">Projected</span>
                            </div>
                          </div>
                          
                          {/* Line chart */}
                          <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            <div className="absolute left-0 right-0 top-0 bottom-0">
                              <div className="border-t border-white/10 absolute top-0 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-1/4 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-1/2 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute top-3/4 left-0 right-0"></div>
                              <div className="border-t border-white/10 absolute bottom-0 left-0 right-0"></div>
                            </div>
                            
                            {/* Actual revenue line */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <path 
                                d="M0,100 L10,90 L20,85 L30,75 L40,65 L50,55" 
                                fill="none" 
                                stroke="#22c55e" 
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              
                              {/* Projected revenue line (dashed) */}
                              <path 
                                d="M50,55 L60,45 L70,35 L80,25 L90,15 L100,5" 
                                fill="none" 
                                stroke="#f97316" 
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="2 2"
                              />
                              
                              {/* Dots for data points */}
                              <circle cx="0" cy="100" r="1.5" fill="#22c55e" />
                              <circle cx="10" cy="90" r="1.5" fill="#22c55e" />
                              <circle cx="20" cy="85" r="1.5" fill="#22c55e" />
                              <circle cx="30" cy="75" r="1.5" fill="#22c55e" />
                              <circle cx="40" cy="65" r="1.5" fill="#22c55e" />
                              <circle cx="50" cy="55" r="1.5" fill="#22c55e" />
                              
                              <circle cx="60" cy="45" r="1.5" fill="#f97316" />
                              <circle cx="70" cy="35" r="1.5" fill="#f97316" />
                              <circle cx="80" cy="25" r="1.5" fill="#f97316" />
                              <circle cx="90" cy="15" r="1.5" fill="#f97316" />
                              <circle cx="100" cy="5" r="1.5" fill="#f97316" />
                            </svg>
                          </div>
                          
                          <div className="grid grid-cols-6 mt-2">
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2023</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2024</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2025</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2026</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2027</div>
                            <div className="text-center text-[8px] sm:text-xs text-white/70">2028</div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between">
                              <span className="text-xs text-white/70">$4.5M now</span>
                              <span className="text-xs text-white/70">$20M by 2028</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-blue-500/20">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Projected Users</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">2.5M</p>
                      <p className="text-xs sm:text-sm text-white/70">By the end of 2025</p>
                    </Card>
                    
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-green-500/20">
                          <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Annual Revenue</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">$12M</p>
                      <p className="text-xs sm:text-sm text-white/70">Projected for 2025</p>
                    </Card>
                    
                    <Card className="p-3 sm:p-4 bg-black/30 border-orange-500/20">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 rounded-full bg-orange-500/20">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                        </div>
                        <h4 className="text-sm sm:text-base font-medium text-white">Return on Investment</h4>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">78%</p>
                      <p className="text-xs sm:text-sm text-white/70">Projected ROI over 24 months</p>
                    </Card>
                  </div>
                </Card>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Investor Registration</h3>
                    <p className="text-muted-foreground">
                      Complete the form below to register as an investor in Boostify Music. 
                      All information will be kept confidential and secure.
                    </p>
                  </div>
                  
                  <InvestorRegistrationForm />
                  
                  <div className="mt-8 bg-muted p-4 sm:p-6 rounded-lg">
                    <h4 className="text-lg font-medium mb-4">After Registration</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Verification Process</h5>
                          <p className="text-sm text-muted-foreground">
                            Our team will review your application and contact you within 48 hours.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Investment Options</h5>
                          <p className="text-sm text-muted-foreground">
                            You'll receive personalized investment plans based on your profile and preferences.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="bg-orange-500/10 p-2 rounded h-min">
                          <Check className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h5 className="font-medium">Contract Signing</h5>
                          <p className="text-sm text-muted-foreground">
                            Once approved, you'll receive a digital contract to sign securely online.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}