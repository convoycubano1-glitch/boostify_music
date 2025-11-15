import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { auth } from "../firebase";
import { signInWithRedirect, signInWithPopup, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

export default function AuthDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // Cargar logs guardados al montar
  useEffect(() => {
    const savedLogs = localStorage.getItem('auth_debug_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Error loading saved logs:', e);
      }
    }
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    const newLog = `[${time}] ${msg}`;
    
    setLogs(prev => {
      const updated = [...prev, newLog];
      // GUARDAR EN LOCALSTORAGE para que no se pierda
      localStorage.setItem('auth_debug_logs', JSON.stringify(updated));
      return updated;
    });
    
    console.log(`[AUTH DEBUG] ${msg}`);
    
    // Contar errores
    if (msg.includes('❌') || msg.includes('🚨')) {
      setErrorCount(prev => prev + 1);
    }
  };
  
  const clearLogs = () => {
    setLogs([]);
    setErrorCount(0);
    localStorage.removeItem('auth_debug_logs');
  };

  const testPopup = async () => {
    setLogs([]);
    addLog("🧪 Iniciando test de POPUP...");
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      addLog("📋 authDomain: " + auth.config.authDomain);
      addLog("📋 Dominio actual: " + window.location.hostname);
      addLog("📋 URL completa: " + window.location.href);
      
      addLog("🔄 Llamando a signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      
      addLog("✅ POPUP EXITOSO!");
      addLog(`✅ Usuario: ${result.user.email}`);
      addLog(`✅ UID: ${result.user.uid}`);
      
    } catch (error: any) {
      addLog(`❌ ERROR en popup: ${error.code}`);
      addLog(`❌ Mensaje: ${error.message}`);
      
      if (error.code === 'auth/unauthorized-domain') {
        addLog("🚨 PROBLEMA: Dominio no autorizado en Firebase Console");
        addLog(`🔧 SOLUCIÓN: Agrega "${window.location.hostname}" a Firebase Console > Authentication > Settings > Authorized domains`);
      } else if (error.code === 'auth/popup-blocked') {
        addLog("🚨 PROBLEMA: Navegador bloqueó el popup");
        addLog("🔧 SOLUCIÓN: Habilita popups para este sitio");
      } else if (error.code === 'auth/popup-closed-by-user') {
        addLog("⚠️ Usuario cerró el popup manualmente");
      } else if (error.code === 'auth/cancelled-popup-request') {
        addLog("⚠️ Se canceló una solicitud de popup previa");
        addLog("💡 Esto pasa si haces clic muy rápido múltiples veces");
      }
    }
  };

  const testRedirect = async () => {
    setLogs([]);
    addLog("🧪 Iniciando test de REDIRECT...");
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      addLog("📋 authDomain: " + auth.config.authDomain);
      addLog("📋 Dominio actual: " + window.location.hostname);
      
      localStorage.setItem('auth_test_redirect', 'true');
      localStorage.setItem('auth_test_timestamp', Date.now().toString());
      
      addLog("🔄 Guardando estado en localStorage...");
      addLog("🔄 Llamando a signInWithRedirect...");
      addLog("⏳ La página se recargará en 3 segundos...");
      
      setTimeout(async () => {
        await signInWithRedirect(auth, provider);
      }, 3000);
      
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.code}`);
      addLog(`❌ Mensaje: ${error.message}`);
    }
  };

  const checkRedirect = async () => {
    setLogs([]);
    addLog("🔍 Verificando resultado de redirect...");
    
    try {
      const testFlag = localStorage.getItem('auth_test_redirect');
      const timestamp = localStorage.getItem('auth_test_timestamp');
      
      if (testFlag) {
        const elapsed = Date.now() - parseInt(timestamp || '0');
        addLog(`📊 Test de redirect activo (hace ${Math.round(elapsed/1000)} segundos)`);
      } else {
        addLog("📊 No hay test de redirect activo");
      }
      
      addLog("🔄 Llamando a getRedirectResult...");
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        addLog("✅ REDIRECT EXITOSO!");
        addLog(`✅ Usuario: ${result.user.email}`);
        addLog(`✅ UID: ${result.user.uid}`);
        
        localStorage.removeItem('auth_test_redirect');
        localStorage.removeItem('auth_test_timestamp');
      } else {
        addLog("ℹ️ No hay resultado de redirect pendiente");
      }
      
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.code}`);
      addLog(`❌ Mensaje: ${error.message}`);
      
      if (error.code === 'auth/unauthorized-domain') {
        addLog("🚨 PROBLEMA: Dominio no autorizado");
        addLog(`🔧 SOLUCIÓN: Agrega "${window.location.hostname}" en Firebase Console`);
      }
      
      localStorage.removeItem('auth_test_redirect');
      localStorage.removeItem('auth_test_timestamp');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">
          Diagnóstico de Autenticación
        </h1>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Dominio actual:</strong> {window.location.hostname}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
            <p><strong>Auth Domain:</strong> {auth.config.authDomain}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Tests de Autenticación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button
                onClick={testPopup}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Test POPUP
              </Button>
              <Button
                onClick={testRedirect}
                className="bg-green-600 hover:bg-green-700"
              >
                Test REDIRECT
              </Button>
              <Button
                onClick={checkRedirect}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Verificar Redirect
              </Button>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-xs">
              <p className="font-bold text-yellow-300 mb-1">ℹ️ Instrucciones:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li><strong>Test POPUP:</strong> Intenta abrir ventana emergente de Google</li>
                <li><strong>Test REDIRECT:</strong> Te lleva a Google y regresa (espera 3 seg)</li>
                <li><strong>Verificar Redirect:</strong> Después de regresar, verifica el resultado</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className={`${logs.length > 0 ? 'bg-gray-900' : 'bg-gray-800'} border-gray-700`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                Resultados del Test
                {errorCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {errorCount} error{errorCount > 1 ? 'es' : ''}
                  </span>
                )}
              </span>
              {logs.length > 0 && (
                <Button
                  onClick={clearLogs}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Limpiar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Presiona un botón arriba para empezar el diagnóstico</p>
              </div>
            ) : (
              <div className="bg-black p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-auto">
                {logs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`${
                      log.includes('❌') || log.includes('🚨') 
                        ? 'text-red-400 font-bold' 
                        : log.includes('✅') 
                        ? 'text-green-400' 
                        : log.includes('⚠️')
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm">
          <p className="font-bold text-red-300 mb-2">🚨 Si ves error "unauthorized-domain":</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-300 ml-2">
            <li>Ve a <a href="https://console.firebase.google.com" target="_blank" className="text-blue-400 underline">Firebase Console</a></li>
            <li>Selecciona tu proyecto "artist-boost"</li>
            <li>Ve a Authentication → Settings → Authorized domains</li>
            <li>Agrega el dominio: <strong className="text-orange-400">{window.location.hostname}</strong></li>
            <li>Guarda y espera 1-2 minutos</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
