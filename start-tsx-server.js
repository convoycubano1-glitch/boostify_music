#!/usr/bin/env node

const { exec } = require("child_process");
const watch = require("node-watch");

// Usar tsx para ejecutar el servidor
let serverProcess = exec("npx tsx server/index.ts", { stdio: "inherit" });
console.log("Servidor iniciado con tsx");

serverProcess.stdout.on("data", (data) => {
  console.log(`[SERVER]: ${data}`);
});

serverProcess.stderr.on("data", (data) => {
  console.error(`[SERVER ERROR]: ${data}`);
});

// Vigilar cambios en el directorio del servidor
watch("./server", { recursive: true }, function(evt, name) {
  console.log(`Cambio detectado en: ${name}`);
  console.log("Reiniciando servidor...");
  
  // Matar el proceso anterior
  serverProcess.kill();
  
  // Iniciar un nuevo proceso
  serverProcess = exec("npx tsx server/index.ts", { stdio: "inherit" });
  
  serverProcess.stdout.on("data", (data) => {
    console.log(`[SERVER]: ${data}`);
  });
  
  serverProcess.stderr.on("data", (data) => {
    console.error(`[SERVER ERROR]: ${data}`);
  });
});

// Manejar señales de terminación
process.on("SIGINT", () => {
  console.log("Deteniendo el servidor...");
  serverProcess.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("Deteniendo el servidor...");
  serverProcess.kill();
  process.exit();
});
