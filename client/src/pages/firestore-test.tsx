import { useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function FirestoreTestPage() {
  const [slug, setSlug] = useState("reyfranck");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const clearLogs = () => setLogs([]);

  const testQueryBySlug = async () => {
    clearLogs();
    setLoading(true);
    
    try {
      addLog(`🔍 Buscando artista con slug: "${slug}"`);
      addLog(`📱 User Agent: ${navigator.userAgent.substring(0, 100)}...`);
      addLog(`📐 Dimensiones: ${window.innerWidth}x${window.innerHeight}`);
      
      const usersRef = collection(db, "users");
      addLog(`✅ Colección "users" referenciada`);
      
      const q = query(usersRef, where("slug", "==", slug));
      addLog(`✅ Query creada: where("slug", "==", "${slug}")`);
      
      addLog(`⏳ Ejecutando getDocs()...`);
      const snapshot = await getDocs(q);
      addLog(`✅ getDocs() completado: ${snapshot.size} documentos encontrados`);
      
      if (snapshot.empty) {
        addLog(`❌ La query no retornó documentos`);
        addLog(`💡 Esto puede indicar:`);
        addLog(`   1. El slug no existe en Firestore`);
        addLog(`   2. Las reglas de Firestore bloquean la lectura`);
        addLog(`   3. App Check está bloqueando la petición`);
      } else {
        snapshot.forEach((doc) => {
          addLog(`✅ Documento encontrado: ${doc.id}`);
          const data = doc.data();
          addLog(`   - UID: ${data.uid}`);
          addLog(`   - Nombre: ${data.name || data.displayName}`);
          addLog(`   - Slug: ${data.slug}`);
          addLog(`   - Email: ${data.email || 'N/A'}`);
        });
      }
      
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
      addLog(`   Código: ${error.code || 'N/A'}`);
      addLog(`   Nombre: ${error.name || 'N/A'}`);
      
      if (error.code === 'permission-denied') {
        addLog(`🔒 PROBLEMA: Permisos denegados por Firestore`);
        addLog(`💡 SOLUCIÓN: Actualizar reglas de seguridad`);
      } else if (error.code === 'failed-precondition') {
        addLog(`⚠️ PROBLEMA: App Check o índices faltantes`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testListAllUsers = async () => {
    clearLogs();
    setLoading(true);
    
    try {
      addLog(`🔍 Listando TODOS los usuarios...`);
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      
      addLog(`✅ Total de usuarios en Firestore: ${snapshot.size}`);
      
      let idx = 0;
      snapshot.forEach((doc) => {
        idx++;
        const data = doc.data();
        addLog(`${idx}. ${data.name || data.displayName} (slug: ${data.slug || 'NO-SLUG'})`);
      });
      
      if (snapshot.size === 0) {
        addLog(`❌ No se pudieron leer usuarios`);
        addLog(`🔒 Posible problema de permisos`);
      }
      
    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
      addLog(`   Código: ${error.code || 'N/A'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">
          Test de Firestore
        </h1>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Buscar por Slug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ingresa el slug"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                onClick={testQueryBySlug}
                disabled={loading || !slug}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Buscar
              </Button>
            </div>
            
            <Button
              onClick={testListAllUsers}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Listar Todos Los Usuarios
            </Button>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Resultados</span>
                <Button
                  onClick={clearLogs}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400"
                >
                  Limpiar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black p-4 rounded-lg font-mono text-xs space-y-1 max-h-96 overflow-auto">
                {logs.map((log, idx) => (
                  <div key={idx} className="text-gray-300">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
