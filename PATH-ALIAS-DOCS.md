# Resolución de Alias de Rutas (@/) - Documentación
# Path Alias Resolution (@/) - Documentation

**Versión / Version:** 1.0.0  
**Fecha / Date:** 2025-03-12  

[🇪🇸 Español](#español) | [🇺🇸 English](#english)

---

## Español

### Introducción

Esta documentación describe la solución implementada para resolver el problema de los alias de rutas con el prefijo `@/` en una aplicación JavaScript/TypeScript con módulos ES (ESM). El problema ocurre cuando los alias configurados en `tsconfig.json` no se resuelven correctamente durante el tiempo de ejecución, causando errores como:

```
Failed to resolve import "@/components/ui/button" from "src/pages/example.tsx". Does the file exist?
```

### Descripción del Problema

En proyectos TypeScript/JavaScript modernos, es común utilizar alias de rutas para evitar rutas relativas complejas. Sin embargo, hay diferencias entre cómo se resuelven estos alias:

1. **Tiempo de compilación:** TypeScript y herramientas como Vite pueden resolver los alias a través de configuraciones en `tsconfig.json` o `vite.config.ts`.
2. **Tiempo de ejecución:** Los alias no se resuelven automáticamente por Node.js, especialmente en modo ESM.

Cuando utilizamos imports con alias como `import { Button } from "@/components/ui/button"`, pueden surgir problemas de resolución que impiden que la aplicación funcione correctamente.

### Solución Implementada

Hemos creado una solución completa que funciona tanto en desarrollo como en producción:

#### 1. Resolvedor de Alias (alias-resolver.mjs)

Un módulo ESM que proporciona:
- Un mapa de alias a rutas reales
- Funciones para resolver rutas con alias
- Verificación y creación automática de directorios

#### 2. Script de Configuración (setup-alias.mjs)

Un script que configura el entorno:
- Crea enlaces simbólicos para resolver alias
- Configura `jsconfig.json` para mejor soporte de IDE
- Actualiza permisos de los scripts

#### 3. Scripts Mejorados

- `build-fixed.mjs`: Script de construcción optimizado para producción
- `start-fixed.mjs`: Script para iniciar la aplicación con soporte de alias

### Cómo Usar

1. **Configuración inicial:**
   ```bash
   node setup-alias.mjs
   ```

2. **Iniciar la aplicación en desarrollo:**
   ```bash
   node start-fixed.mjs
   ```

3. **Construir para producción:**
   ```bash
   node build-fixed.mjs
   ```

### Solución de Problemas

Si sigues experimentando problemas con la resolución de alias:

1. Verifica que la estructura de directorios sea correcta: `client/src/components`, etc.
2. Asegúrate de que los enlaces simbólicos se hayan creado en `node_modules/@/`
3. Si estás en producción, verifica que `vite.config.prod.ts` tenga la configuración correcta
4. Intenta reiniciar el entorno o ejecutar nuevamente `setup-alias.mjs`

### Limitaciones

- La solución está optimizada para entornos Node.js y Vite
- En algunos sistemas operativos, los enlaces simbólicos pueden requerir permisos administrativos
- Si se modifica la estructura de directorios, es posible que se necesite volver a ejecutar el script de configuración

---

## English

### Introduction

This documentation describes the solution implemented to resolve path alias issues with the `@/` prefix in a JavaScript/TypeScript application using ES modules (ESM). The issue occurs when aliases configured in `tsconfig.json` are not properly resolved at runtime, causing errors such as:

```
Failed to resolve import "@/components/ui/button" from "src/pages/example.tsx". Does the file exist?
```

### Problem Description

In modern TypeScript/JavaScript projects, it's common to use path aliases to avoid complex relative paths. However, there are differences in how these aliases are resolved:

1. **Compile time:** TypeScript and tools like Vite can resolve aliases through configurations in `tsconfig.json` or `vite.config.ts`.
2. **Runtime:** Aliases are not automatically resolved by Node.js, especially in ESM mode.

When using imports with aliases like `import { Button } from "@/components/ui/button"`, resolution issues can arise that prevent the application from working properly.

### Implemented Solution

We have created a comprehensive solution that works both in development and production:

#### 1. Alias Resolver (alias-resolver.mjs)

An ESM module that provides:
- A map of aliases to real paths
- Functions to resolve aliased paths
- Automatic directory verification and creation

#### 2. Setup Script (setup-alias.mjs)

A script that configures the environment:
- Creates symbolic links to resolve aliases
- Configures `jsconfig.json` for better IDE support
- Updates script permissions

#### 3. Enhanced Scripts

- `build-fixed.mjs`: Optimized build script for production
- `start-fixed.mjs`: Script to start the application with alias support

### How to Use

1. **Initial setup:**
   ```bash
   node setup-alias.mjs
   ```

2. **Start the application in development:**
   ```bash
   node start-fixed.mjs
   ```

3. **Build for production:**
   ```bash
   node build-fixed.mjs
   ```

### Troubleshooting

If you still experience issues with alias resolution:

1. Verify that the directory structure is correct: `client/src/components`, etc.
2. Ensure that symbolic links have been created in `node_modules/@/`
3. If in production, verify that `vite.config.prod.ts` has the correct configuration
4. Try restarting the environment or running `setup-alias.mjs` again

### Limitations

- The solution is optimized for Node.js and Vite environments
- On some operating systems, symbolic links may require administrative permissions
- If the directory structure is modified, you may need to run the setup script again