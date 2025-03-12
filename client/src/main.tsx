import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // Usamos la versión completa de App para tener acceso a todas las rutas
import "./index.css";

// Diagnóstico: comprobar si React se importa correctamente
console.log("React cargado correctamente:", React !== undefined);
console.log("React versión:", React.version);

// Configurar un manejador de errores global para diagnosticar problemas de renderizado
window.addEventListener('error', function(event) {
  console.error('Error global capturado:', event.error);
});

// Obtener el elemento raíz
const rootElement = document.getElementById("root");
console.log("Elemento raíz encontrado:", rootElement !== null);

if (rootElement) {
  try {
    // Reemplazamos el enrutador de hash y usamos el enfoque básico
    // Esto evitará problemas de reactividad y carga infinita
    const root = createRoot(rootElement);
    console.log("Root creado correctamente");
    
    // Intentar renderizar la aplicación
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Renderizado iniciado");
  } catch (error) {
    console.error("Error al renderizar React:", error);
    
    // Mostrar un mensaje de error visual en la página
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #333;">
        <h2 style="color: #e74c3c;">Error al iniciar la aplicación</h2>
        <p>Se ha producido un error al cargar la aplicación:</p>
        <pre style="background: #f8f8f8; padding: 10px; border-radius: 5px; overflow: auto;">${error?.message || 'Error desconocido'}</pre>
        <p>Por favor, revisa la consola para más detalles.</p>
      </div>
    `;
  }
} else {
  console.error("No se encontró el elemento raíz con ID 'root'");
}
