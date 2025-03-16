/**
 * Componente para mostrar el historial de llamadas a los asesores
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LabelList 
} from 'recharts';
import { advisorCallService, AdvisorCall } from '../../lib/services/advisor-call-service';
import { Clock, Calendar, PhoneCall, User, Download } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';

// Colores para los gráficos
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#C7CEEA'];

export function AdvisorCallHistory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('history');
  
  // Consultar historial de llamadas
  const { data: callHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['advisor-calls', user?.uid],
    queryFn: () => advisorCallService.getUserCallHistory(50),
    enabled: !!user,
    refetchOnWindowFocus: false
  });
  
  // Exportar historial en formato CSV
  const exportToCSV = () => {
    try {
      if (!callHistory || callHistory.calls.length === 0) {
        toast({
          title: "No hay datos para exportar",
          description: "Tu historial de llamadas está vacío",
          variant: "destructive"
        });
        return;
      }
      
      // Crear cabeceras CSV
      const headers = [
        'Fecha',
        'Asesor',
        'Título',
        'Duración (min)',
        'Estado',
        'Plan'
      ].join(',');
      
      // Crear filas CSV
      const rows = callHistory.calls.map(call => {
        const date = call.timestamp instanceof Timestamp 
          ? call.timestamp.toDate() 
          : new Date(call.timestamp);
        
        return [
          format(date, 'yyyy-MM-dd HH:mm'),
          call.advisorName,
          call.advisorTitle,
          (call.duration / 60).toFixed(1),
          call.status,
          call.plan
        ].join(',');
      });
      
      // Combinar cabeceras y filas
      const csv = [headers, ...rows].join('\\n');
      
      // Crear y descargar archivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historial-asesores-${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
      
      toast({
        title: "Exportación exitosa",
        description: "El historial de llamadas se ha descargado correctamente",
        variant: "default"
      });
    } catch (err) {
      console.error('Error exporting call history:', err);
      toast({
        title: "Error al exportar",
        description: "No se pudo descargar el historial de llamadas",
        variant: "destructive"
      });
    }
  };
  
  // Preparar datos para gráficos
  const getChartData = () => {
    if (!callHistory || callHistory.calls.length === 0) return { byAdvisor: [], byPlan: [] };
    
    // Agrupar por asesor
    const advisorMap = new Map<string, number>();
    
    // Agrupar por plan
    const planMap = new Map<string, number>();
    
    callHistory.calls.forEach(call => {
      // Datos por asesor
      const advisorKey = call.advisorName;
      advisorMap.set(advisorKey, (advisorMap.get(advisorKey) || 0) + 1);
      
      // Datos por plan
      const planKey = call.plan || 'free';
      planMap.set(planKey, (planMap.get(planKey) || 0) + 1);
    });
    
    // Convertir a arrays para gráficos
    const byAdvisor = Array.from(advisorMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
    
    const byPlan = Array.from(planMap.entries()).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalizar
      count
    }));
    
    return { byAdvisor, byPlan };
  };
  
  // Formatear duración en minutos y segundos
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} seg`;
    }
    
    return `${minutes} min ${remainingSeconds} seg`;
  };
  
  const chartData = getChartData();
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar historial</CardTitle>
          <CardDescription>No se pudo cargar el historial de llamadas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Se produjo un error al obtener tu historial de llamadas. Por favor, intenta nuevamente.
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Historial de Llamadas</CardTitle>
          <CardDescription>
            Registro de tus consultas con los asesores IA
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={exportToCSV}
          disabled={isLoading || !callHistory || callHistory.calls.length === 0}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : callHistory?.calls.length === 0 ? (
              <div className="text-center py-8">
                <PhoneCall className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium">No hay llamadas registradas</h3>
                <p className="text-muted-foreground mt-1">
                  Tu historial de conversaciones con asesores aparecerá aquí.
                </p>
              </div>
            ) : (
              <Table>
                <TableCaption>
                  Historial de {callHistory?.totalCalls || 0} llamadas a tus asesores IA
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asesor</TableHead>
                    <TableHead className="hidden md:table-cell">Duración</TableHead>
                    <TableHead className="hidden md:table-cell">Plan</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callHistory?.calls.map((call) => {
                    // Convertir Timestamp a Date si es necesario
                    const callDate = call.timestamp instanceof Timestamp 
                      ? call.timestamp.toDate() 
                      : new Date(call.timestamp);
                    
                    return (
                      <TableRow key={call.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(callDate, 'dd/MM/yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(callDate, 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{call.advisorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {call.advisorTitle}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDuration(call.duration)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="capitalize">
                            {call.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              call.status === 'completed' ? 'default' : 
                              call.status === 'cancelled' ? 'secondary' : 
                              'destructive'
                            }
                            className="capitalize"
                          >
                            {call.status === 'completed' ? 'Completada' : 
                             call.status === 'cancelled' ? 'Cancelada' : 
                             'Fallida'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="stats">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : callHistory?.calls.length === 0 ? (
              <div className="text-center py-8">
                <BarChart className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium">No hay datos para mostrar</h3>
                <p className="text-muted-foreground mt-1">
                  Las estadísticas se generarán cuando tengas llamadas registradas.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Resumen de uso</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center">
                      <PhoneCall className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total de llamadas</p>
                        <p className="text-2xl font-bold">{callHistory?.totalCalls || 0}</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center">
                      <Clock className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tiempo total</p>
                        <p className="text-2xl font-bold">
                          {Math.floor((callHistory?.totalDuration || 0) / 60)} min
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center">
                      <Calendar className="w-8 h-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Primera llamada</p>
                        {callHistory?.calls.length ? (
                          <p className="text-lg font-bold">
                            {format(
                              callHistory.calls[callHistory.calls.length - 1].timestamp instanceof Timestamp 
                                ? callHistory.calls[callHistory.calls.length - 1].timestamp.toDate() 
                                : new Date(callHistory.calls[callHistory.calls.length - 1].timestamp),
                              'dd/MM/yyyy'
                            )}
                          </p>
                        ) : (
                          <p className="text-lg font-bold">-</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Gráfico de llamadas por asesor */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Llamadas por asesor</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.byAdvisor}>
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip 
                            formatter={(value) => [`${value} llamadas`, 'Total']}
                            contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', borderColor: 'rgba(63, 63, 70, 0.5)' }}
                            labelStyle={{ color: 'white' }}
                          />
                          <Bar dataKey="count" fill="#FF6B6B" radius={[4, 4, 0, 0]}>
                            {chartData.byAdvisor.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Gráfico de distribución por plan */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Distribución por plan</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.byPlan}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                          >
                            {chartData.byPlan.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke="rgba(0, 0, 0, 0.1)"
                              />
                            ))}
                            <LabelList dataKey="name" position="outside" fill="#888" />
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value} llamadas`, 'Total']}
                            contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', borderColor: 'rgba(63, 63, 70, 0.5)' }}
                            labelStyle={{ color: 'white' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}