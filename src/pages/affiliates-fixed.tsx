import React, { useState } from 'react';

// Tipos de datos para planes de inversión
interface InvestmentPlan {
  id: string;
  name: string;
  description: string;
  returnRate: number;
  minimumInvestment: number;
  duration: number;
  currency: string;
}

// Planes de inversión (datos de ejemplo)
const investmentPlans: InvestmentPlan[] = [
  {
    id: "plan1",
    name: "Standard",
    description: "Plan de inversión básico con rentabilidad moderada",
    returnRate: 0.04, // 4% mensual
    minimumInvestment: 2000,
    duration: 6, // 6 meses
    currency: "USD"
  },
  {
    id: "plan2",
    name: "Premium",
    description: "Mayor rentabilidad con compromiso a mediano plazo",
    returnRate: 0.05, // 5% mensual
    minimumInvestment: 5000,
    duration: 12, // 12 meses
    currency: "USD"
  },
  {
    id: "plan3",
    name: "Elite",
    description: "Máxima rentabilidad para inversiones grandes",
    returnRate: 0.06, // 6% mensual
    minimumInvestment: 25000,
    duration: 18, // 18 meses
    currency: "USD"
  }
];

// Componente de página de afiliados
export default function AffiliatesFixedPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('ABC123456');

  // Función para calcular ganancias potenciales
  const calculatePotentialEarnings = (plan: InvestmentPlan, referralLevel: 'Básico' | 'Plata' | 'Oro' | 'Platino') => {
    // Tasas de comisión por nivel de afiliado
    const commissionRates = {
      'Básico': 0.02, // 2%
      'Plata': 0.03, // 3%
      'Oro': 0.04,   // 4%
      'Platino': 0.05 // 5%
    };
    
    // Calcula la comisión potencial
    const rate = commissionRates[referralLevel];
    const investmentAmount = plan.minimumInvestment;
    const commissionAmount = investmentAmount * rate;
    
    return commissionAmount;
  };

  // Simulación de registro como afiliado
  const handleRegisterAsAffiliate = () => {
    setIsLoading(true);
    // Simulamos un proceso de registro
    setTimeout(() => {
      setIsRegistered(true);
      setIsLoading(false);
      setReferralCode('USR123-AFF456');
    }, 1000);
  };

  // Copiar código de referido al portapapeles
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
      .then(() => {
        alert("Código de referido copiado al portapapeles");
      })
      .catch(err => {
        console.error("Error al copiar código:", err);
        alert("No se pudo copiar el código. Inténtalo manualmente.");
      });
  };

  // Si el usuario no está registrado como afiliado, mostrar página de registro
  if (!isRegistered) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Programa de Afiliados</h1>
        
        <div className="bg-white shadow-md rounded-lg mb-8 overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">¡Únete a nuestro programa de afiliados!</h2>
            <p className="text-gray-600 mt-1">
              Gana comisiones atractivas por referir inversores a nuestra plataforma
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Beneficios del programa:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Comisiones de hasta 5% por cada inversión referida</li>
                <li>Sistema de niveles para aumentar tus ganancias</li>
                <li>Panel de control detallado para seguir tus estadísticas</li>
                <li>Pagos puntuales y métodos de pago flexibles</li>
                <li>Materiales promocionales de alta calidad</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6">Niveles de afiliado:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-white border rounded-lg shadow-sm p-4">
                  <h4 className="text-lg font-medium mb-2">Básico</h4>
                  <p>2% de comisión</p>
                  <p className="text-sm text-gray-500">0-5 referidos activos</p>
                </div>
                
                <div className="bg-white border rounded-lg shadow-sm p-4">
                  <h4 className="text-lg font-medium mb-2">Plata</h4>
                  <p>3% de comisión</p>
                  <p className="text-sm text-gray-500">6-15 referidos activos</p>
                </div>
                
                <div className="bg-white border rounded-lg shadow-sm p-4">
                  <h4 className="text-lg font-medium mb-2">Oro</h4>
                  <p>4% de comisión</p>
                  <p className="text-sm text-gray-500">16-30 referidos activos</p>
                </div>
                
                <div className="bg-white border rounded-lg shadow-sm p-4">
                  <h4 className="text-lg font-medium mb-2">Platino</h4>
                  <p>5% de comisión</p>
                  <p className="text-sm text-gray-500">31+ referidos activos</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t">
            <button 
              className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
              onClick={handleRegisterAsAffiliate} 
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Registrarme como afiliado"}
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Potencial de ganancias</h2>
            <p className="text-gray-600 mt-1">
              Estimación de comisiones que podrías ganar por cada plan de inversión referido
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Plan</th>
                    <th className="text-left p-2">Inversión mínima</th>
                    <th className="text-left p-2">Nivel Básico (2%)</th>
                    <th className="text-left p-2">Nivel Plata (3%)</th>
                    <th className="text-left p-2">Nivel Oro (4%)</th>
                    <th className="text-left p-2">Nivel Platino (5%)</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentPlans.map(plan => (
                    <tr key={plan.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{plan.name}</td>
                      <td className="p-2">${plan.minimumInvestment.toLocaleString()}</td>
                      <td className="p-2">${calculatePotentialEarnings(plan, 'Básico').toLocaleString()}</td>
                      <td className="p-2">${calculatePotentialEarnings(plan, 'Plata').toLocaleString()}</td>
                      <td className="p-2">${calculatePotentialEarnings(plan, 'Oro').toLocaleString()}</td>
                      <td className="p-2">${calculatePotentialEarnings(plan, 'Platino').toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Usuario registrado - mostrar panel de afiliado  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Afiliado</h1>
      
      <div className="mb-6">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Tu código de referido</h2>
            <p className="text-gray-600 mt-1">
              Comparte este código o úsalo en los enlaces para recibir crédito por tus referidos
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <code className="px-4 py-2 rounded bg-gray-100 text-black font-mono text-lg">
                {referralCode}
              </code>
              <button 
                className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200"
                onClick={copyReferralCode}
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Resumen
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'earnings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('earnings')}
            >
              Ganancias
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'referrals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('referrals')}
            >
              Referidos
            </button>
            <button
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('materials')}
            >
              Materiales
            </button>
          </nav>
        </div>
        
        <div className="py-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-sm font-medium text-gray-500 mb-1">Nivel actual</p>
                  <p className="text-2xl font-bold">Básico</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-sm font-medium text-gray-500 mb-1">Clics totales</p>
                  <p className="text-2xl font-bold">145</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-sm font-medium text-gray-500 mb-1">Conversiones</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <p className="text-sm font-medium text-gray-500 mb-1">Ganancias totales</p>
                  <p className="text-2xl font-bold">$560.75</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Desempeño reciente</h3>
                <p className="text-gray-500">Esta visualización de datos estará disponible próximamente</p>
                <div className="h-[200px] flex items-center justify-center border rounded-md mt-4">
                  <p className="text-center text-gray-400">Gráfico de rendimiento</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Resumen de ganancias</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Ganancias totales</h4>
                    <p className="text-2xl font-bold">$560.75</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Pago pendiente</h4>
                    <p className="text-2xl font-bold">$320.50</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">Próximo pago</h4>
                    <p className="text-lg">15 de abril, 2025</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-3">Historial de pagos</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">15 Mar 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">$240.50</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Transferencia bancaria</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">15 Feb 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">$150.25</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">Transferencia bancaria</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completado</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Método de pago</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Transferencia bancaria</h4>
                      <p className="text-sm text-gray-500">
                        Banco Internacional: ****5678
                      </p>
                    </div>
                    <button className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Tus referidos</h3>
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inversión</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Ana Martínez</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10 Mar 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$5,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$150</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Juan Pérez</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">27 Feb 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$2,500</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$75</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Carlos Rodríguez</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15 Feb 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Herramientas de referidos</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Enlaces personalizados</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={`https://invest.example.com/?ref=${referralCode}`}
                        readOnly
                      />
                      <button className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                        Copiar
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Redes sociales</h4>
                    <div className="flex gap-2">
                      <button className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        Facebook
                      </button>
                      <button className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                        Twitter
                      </button>
                      <button className="py-2 px-4 border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        Instagram
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Materiales promocionales</h3>
                <p className="text-gray-600 mb-4">
                  Utiliza estos recursos para promocionar nuestros planes de inversión
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                      <h4 className="text-lg font-medium">Banners</h4>
                    </div>
                    <div className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                        <p className="text-sm text-gray-500">Vista previa del banner</p>
                      </div>
                      <div className="flex justify-between">
                        <button className="py-1 px-3 text-sm border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                          Descargar
                        </button>
                        <button className="py-1 px-3 text-sm border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                          Copiar código
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                      <h4 className="text-lg font-medium">Folletos PDF</h4>
                    </div>
                    <div className="p-4">
                      <div className="aspect-[3/4] bg-gray-100 rounded-md flex items-center justify-center mb-4">
                        <p className="text-sm text-gray-500">Vista previa del folleto</p>
                      </div>
                      <button className="w-full py-1 px-3 text-sm border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                      <h4 className="text-lg font-medium">Plantillas de correo</h4>
                    </div>
                    <div className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-4">
                        <p className="text-sm text-gray-500">Vista previa del correo</p>
                      </div>
                      <button className="w-full py-1 px-3 text-sm border border-gray-300 hover:bg-gray-50 rounded-md transition duration-200">
                        Copiar texto
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Información de productos</h3>
                <div className="space-y-6">
                  {investmentPlans.map(plan => (
                    <div key={plan.id} className="border rounded-md p-4">
                      <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                      <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Rentabilidad</p>
                          <p className="font-medium">{plan.returnRate * 100}% mensual</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Inversión mínima</p>
                          <p className="font-medium">${plan.minimumInvestment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duración</p>
                          <p className="font-medium">{plan.duration} meses</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Su comisión</p>
                          <p className="font-medium">${calculatePotentialEarnings(plan, 'Básico').toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}