/**
 * Script para probar el manejo de diferentes formatos de error
 * Simula los diferentes tipos de estructuras de error que puede devolver la API
 */

// Función que simula el comportamiento de extracción de mensajes de error implementado
function extractErrorMessage(errorObj) {
  // Caso 1: Si es un string, devolver directamente
  if (typeof errorObj === 'string') {
    return errorObj;
  }
  
  // Caso 2: Si es un objeto con propiedades específicas de error
  if (typeof errorObj === 'object' && errorObj !== null) {
    // Try to extract specific error message properties
    const errObj = errorObj;
    return errObj.message || 
           errObj.error || 
           errObj.errorMessage ||
           JSON.stringify(errorObj);
  }
  
  // Caso fallback
  return 'Error desconocido';
}

// Diferentes escenarios de error a probar
const errorScenarios = [
  // Escenario 1: Error como string simple
  "Error en el formato de imagen",
  
  // Escenario 2: Error como objeto con propiedad message
  { message: "Formato de imagen no soportado (código: 10000)" },
  
  // Escenario 3: Error como objeto con propiedad error
  { error: "La imagen no cumple con los requisitos mínimos" },
  
  // Escenario 4: Error como objeto con propiedad errorMessage
  { errorMessage: "Tamaño de imagen excede el límite máximo" },
  
  // Escenario 5: Error como objeto complejo anidado
  { 
    code: 500, 
    data: { 
      errorMessage: "Error interno del servidor al procesar la imagen",
      errorCode: "ERR_SERVER_PROCESS"
    }
  },
  
  // Escenario 6: Objeto genérico sin propiedades específicas de error
  { status: "failed", timestamp: "2023-05-15" }
];

// Probar cada escenario
console.log("==== Pruebas de extracción de mensajes de error ====");
errorScenarios.forEach((errorCase, index) => {
  console.log(`\nEscenario ${index + 1}:`);
  console.log(`Input: ${JSON.stringify(errorCase)}`);
  console.log(`Mensaje extraído: "${extractErrorMessage(errorCase)}"`);
});

// Probar el caso especial de error [object Object]
const objectErrorCase = { complex: { nested: { data: "error" } } };
console.log("\n==== Prueba de caso [object Object] ====");
console.log(`Input: objeto complejo`);
console.log(`Sin extracción adecuada: ${objectErrorCase}`);
console.log(`Con extracción adecuada: "${extractErrorMessage(objectErrorCase)}"`);