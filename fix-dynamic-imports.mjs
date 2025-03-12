import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos a actualizar con sus importaciones dinámicas
const filesToFix = [
  {
    path: 'client/src/pages/course-detail.tsx',
    replacements: [
      {
        from: "import('../../lib/api/fal-ai')",
        to: "import('../lib/api/fal-ai')"
      }
    ]
  },
  {
    path: 'client/src/pages/ai-agents.tsx',
    replacements: [
      {
        from: "import('../../lib/firebase')",
        to: "import('../lib/firebase')"
      },
      {
        from: "import('../../lib/api/openrouteraiagents')",
        to: "import('../lib/api/openrouteraiagents')"
      }
    ]
  }
];

// Función para reemplazar importaciones en un archivo
async function fixImports(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  console.log(`Arreglando importaciones dinámicas en ${fullPath}`);
  
  try {
    // Leer el contenido del archivo
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Aplicar todos los reemplazos
    for (const rep of replacements) {
      // Escapa caracteres especiales en la expresión regular
      const escapedFrom = rep.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Reemplaza la importación con la ruta relativa
      const regex = new RegExp(escapedFrom, 'g');
      content = content.replace(regex, rep.to);
      
      console.log(`  Reemplazado: ${rep.from} → ${rep.to}`);
    }
    
    // Guardar el contenido actualizado
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Archivo actualizado correctamente`);
  } catch (error) {
    console.error(`  ❌ Error al procesar el archivo ${fullPath}:`, error);
  }
}

// Procesar todos los archivos
async function main() {
  console.log('Iniciando corrección de importaciones dinámicas...');
  
  for (const file of filesToFix) {
    await fixImports(file.path, file.replacements);
  }
  
  console.log('✅ Proceso completado');
}

// Ejecutar el script
main().catch(error => {
  console.error('Error durante la ejecución:', error);
  process.exit(1);
});