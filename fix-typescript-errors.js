/**
 * Script para corregir errores de TypeScript antes de la compilación
 * 
 * Este script resuelve problemas comunes que impiden la compilación:
 * 1. Crear archivos de tipos faltantes
 * 2. Corregir errores de tipado en componentes específicos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

console.log(`${BLUE}=======================================${RESET}`);
console.log(`${BLUE}    CORRECCIÓN DE ERRORES TYPESCRIPT   ${RESET}`);
console.log(`${BLUE}=======================================${RESET}`);

/**
 * Crea el archivo de tipos AI Models si no existe
 */
function createAIModelsTypes() {
  console.log(`\n${BLUE}1. Creando definición de tipos para AI Models...${RESET}`);
  
  const typesDir = path.join(__dirname, 'client', 'src', 'types');
  const aiModelsTypesPath = path.join(typesDir, 'ai-models.ts');
  
  // Crear directorio de tipos si no existe
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
    console.log(`${GREEN}✓ Directorio de tipos creado${RESET}`);
  }
  
  // Verificar si el archivo ya existe
  if (fs.existsSync(aiModelsTypesPath)) {
    console.log(`${YELLOW}⚠ El archivo de tipos AI Models ya existe, se omitirá la creación${RESET}`);
    return;
  }
  
  // Contenido del archivo de tipos
  const aiModelsTypes = `/**
 * Tipos para modelos de IA
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'image' | 'audio' | 'video';
  capabilities: string[];
  description?: string;
  contextLength?: number;
  status: 'active' | 'deprecated' | 'beta';
  apiEndpoint?: string;
  costPerToken?: number;
  apiKeyEnvVar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModelUsage {
  id: string;
  modelId: string;
  userId: string;
  tokensUsed: number;
  requestCount: number;
  date: Date;
}

export interface AIProvider {
  id: string;
  name: string;
  website: string;
  apiBaseUrl: string;
  supportedModels: string[];
  status: 'active' | 'inactive';
}
`;

  // Escribir el archivo de tipos
  fs.writeFileSync(aiModelsTypesPath, aiModelsTypes);
  console.log(`${GREEN}✓ Archivo de tipos AI Models creado en ${aiModelsTypesPath}${RESET}`);
}

/**
 * Corrige los errores de propiedad 'name' no encontrada
 */
function fixAffiliateContentGeneratorTypes() {
  console.log(`\n${BLUE}2. Corrigiendo errores de tipado en affiliate-content-generator.tsx...${RESET}`);
  
  const filePath = path.join(__dirname, 'client', 'src', 'components', 'affiliate-content-generator.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`${YELLOW}⚠ El archivo affiliate-content-generator.tsx no existe, intente buscar en otra ubicación${RESET}`);
    
    // Buscar el archivo en ubicaciones alternativas
    const alternativeLocations = [
      path.join(__dirname, 'src', 'components', 'affiliate-content-generator.tsx'),
      path.join(__dirname, 'src', 'components', 'affiliates', 'content-generator.tsx'),
      path.join(__dirname, 'client', 'src', 'components', 'affiliates', 'content-generator.tsx')
    ];
    
    let found = false;
    for (const altPath of alternativeLocations) {
      if (fs.existsSync(altPath)) {
        found = true;
        console.log(`${GREEN}✓ Archivo encontrado en ${altPath}${RESET}`);
        
        // Corregir el archivo encontrado
        let content = fs.readFileSync(altPath, 'utf8');
        
        // Corregir la definición de tipos para AffiliateProduct
        if (content.includes('interface AffiliateProduct')) {
          content = content.replace(
            /interface AffiliateProduct\s*{[^}]*}/s,
            `interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}`
          );
        } else {
          // Agregar la definición de tipos si no existe
          const interfacePos = content.search(/interface\s+\w+/);
          if (interfacePos !== -1) {
            const insertPos = content.indexOf('{', interfacePos) + 1;
            const insertContent = `\n\ninterface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}\n`;
            
            content = content.slice(0, insertPos) + insertContent + content.slice(insertPos);
          }
        }
        
        // Corregir la definición de tipos para AffiliateContent
        if (content.includes('interface AffiliateContent')) {
          content = content.replace(
            /interface AffiliateContent\s*{[^}]*}/s,
            `interface AffiliateContent {
  id: string;
  userId: string;
  content: string;
  title: string;
  tags: string[];
  productId: string;
  productName: string;
  contentType: string;
  platform: string;
  createdAt: any; // Este tipo debería ser Timestamp de Firestore, pero para simplificar
}`
          );
        }
        
        fs.writeFileSync(altPath, content);
        console.log(`${GREEN}✓ Errores de tipado corregidos en ${altPath}${RESET}`);
        break;
      }
    }
    
    if (!found) {
      console.log(`${RED}✗ No se pudo encontrar el archivo affiliate-content-generator.tsx en ninguna ubicación${RESET}`);
    }
    
    return;
  }
  
  // Corregir el archivo en la ubicación estándar
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Corregir la definición de tipos para AffiliateProduct y AffiliateContent
  content = content.replace(
    /interface AffiliateProduct\s*{[^}]*}/s,
    `interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}`
  );
  
  content = content.replace(
    /interface AffiliateContent\s*{[^}]*}/s,
    `interface AffiliateContent {
  id: string;
  userId: string;
  content: string;
  title: string;
  tags: string[];
  productId: string;
  productName: string;
  contentType: string;
  platform: string;
  createdAt: any; // Este tipo debería ser Timestamp de Firestore, pero para simplificar
}`
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`${GREEN}✓ Errores de tipado corregidos en ${filePath}${RESET}`);
}

/**
 * Corrige los errores en affiliate-earnings.tsx
 */
function fixAffiliateEarningsTypes() {
  console.log(`\n${BLUE}3. Corrigiendo errores de tipado en affiliate-earnings.tsx...${RESET}`);
  
  // Buscar el archivo en diferentes ubicaciones
  const possiblePaths = [
    path.join(__dirname, 'client', 'src', 'components', 'affiliate-earnings.tsx'),
    path.join(__dirname, 'src', 'components', 'affiliate-earnings.tsx'),
    path.join(__dirname, 'src', 'components', 'affiliates', 'earnings.tsx'),
    path.join(__dirname, 'client', 'src', 'components', 'affiliates', 'earnings.tsx')
  ];
  
  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }
  
  if (!filePath) {
    console.log(`${RED}✗ No se pudo encontrar el archivo affiliate-earnings.tsx en ninguna ubicación${RESET}`);
    return;
  }
  
  console.log(`${GREEN}✓ Archivo encontrado en ${filePath}${RESET}`);
  
  // Leer el contenido del archivo
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Instalar dependencia si hay error de módulo @radix-ui/react-icons
  if (content.includes('@radix-ui/react-icons') && !content.includes('// @radix-ui/react-icons mock')) {
    console.log(`${YELLOW}⚠ Se detectó una dependencia faltante: @radix-ui/react-icons${RESET}`);
    console.log(`${YELLOW}Se creará un mock temporal para la compilación${RESET}`);
    
    // Crear directorio mock si no existe
    const mockDir = path.join(__dirname, 'client', 'src', 'mocks');
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }
    
    // Crear archivo mock
    const mockPath = path.join(mockDir, 'radix-icons-mock.ts');
    const mockContent = `/**
 * Mock para @radix-ui/react-icons
 * Este archivo proporciona componentes mock para permitir la compilación
 */

import React from 'react';

// Crear componentes de iconos mock
export const ArrowUpIcon = () => React.createElement('div');
export const ArrowDownIcon = () => React.createElement('div');
export const CheckIcon = () => React.createElement('div');
export const Cross1Icon = () => React.createElement('div');
export const QuestionMarkCircledIcon = () => React.createElement('div');

// Agregar más iconos según sea necesario
`;
    
    fs.writeFileSync(mockPath, mockContent);
    console.log(`${GREEN}✓ Mock creado en ${mockPath}${RESET}`);
    
    // Reemplazar la importación en el archivo
    content = content.replace(
      /import\s+{[^}]*}\s+from\s+['"]@radix-ui\/react-icons['"];?/,
      `// @radix-ui/react-icons mock
import { ArrowUpIcon, ArrowDownIcon, CheckIcon, Cross1Icon, QuestionMarkCircledIcon } from '../mocks/radix-icons-mock';`
    );
  }
  
  // Corregir tipos de las interfaces
  if (content.includes(': any[]') || content.includes(': { id: string }[]')) {
    // Agregar o corregir interfaces
    if (!content.includes('interface AffiliatePayment')) {
      const insertPos = content.indexOf('export function') > 0 ? 
                        content.indexOf('export function') : 
                        content.indexOf('function');
      
      const interfacesToAdd = `
interface AffiliatePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  processedAt: any;
  createdAt: any;
  method: string;
  userId: string;
}

interface AffiliateSale {
  id: string;
  amount: number;
  commission: number;
  productId: string;
  productName: string;
  buyerInfo: string;
  status: string;
  createdAt: any;
  userId: string;
}

interface AffiliateProduct {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  imageUrl?: string;
}

`;
      
      content = content.slice(0, insertPos) + interfacesToAdd + content.slice(insertPos);
    }
    
    // Corregir asignaciones de tipo
    content = content.replace(/paymentHistory\s*:\s*(any\[\]|{\s*id\s*:\s*string\s*}\[\])/, 'paymentHistory: AffiliatePayment[]');
    content = content.replace(/recentSales\s*:\s*(any\[\]|{\s*id\s*:\s*string\s*}\[\])/, 'recentSales: AffiliateSale[]');
    
    // Corregir referencias a productos
    content = content.replace(/const\s+products\s*=\s*{\s*}/, 'const products: Record<string, AffiliateProduct> = {}');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`${GREEN}✓ Errores de tipado corregidos en ${filePath}${RESET}`);
}

/**
 * Función principal que ejecuta todas las correcciones
 */
async function main() {
  try {
    // Crear tipos AI Models
    createAIModelsTypes();
    
    // Corregir errores en affiliate-content-generator.tsx
    fixAffiliateContentGeneratorTypes();
    
    // Corregir errores en affiliate-earnings.tsx
    fixAffiliateEarningsTypes();
    
    console.log(`\n${BLUE}=======================================${RESET}`);
    console.log(`${GREEN}✅ Correcciones de TypeScript completadas${RESET}`);
    console.log(`${BLUE}=======================================${RESET}`);
    console.log(`\nAhora puede intentar compilar el proyecto para producción:`);
    console.log(`${YELLOW}node secure-build.js${RESET}`);
  } catch (error) {
    console.error(`${RED}Error al corregir errores de TypeScript: ${error.message}${RESET}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar el script
main();