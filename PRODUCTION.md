# Instrucciones para Producción

Este documento describe cómo preparar, compilar e implementar la aplicación Boostify Music en un entorno de producción.

## Requisitos Previos

- Node.js v20 o superior
- npm v10 o superior
- Acceso a las credenciales de Firebase para producción
- Acceso a las claves API necesarias para los servicios externos

## Pasos para Preparar el Entorno de Producción

### 1. Compilar la Aplicación

El proyecto incluye un script optimizado para compilación que resuelve varios problemas comunes y prepara todo para un entorno de producción:

```bash
node build-for-replit.js
```

Este script:
- Limpia el directorio de salida (dist)
- Copia los activos estáticos necesarios
- Crea archivos de configuración optimizados
- Genera un servidor mínimo para servir la aplicación

### 2. Configurar Variables de Entorno

Asegúrate de que las siguientes variables de entorno estén configuradas en el servidor de producción:

```
OPENAI_API_KEY=tu_clave_aquí
FAL_API_KEY=tu_clave_aquí
FIREBASE_CONFIG_JSON='{...tu configuración de Firebase en formato JSON...}'
PORT=3000 (puerto donde se ejecutará la aplicación)
```

### 3. Iniciar la Aplicación en Producción

Una vez compilada, puedes iniciar la aplicación en producción con:

```bash
cd dist && node server.js
```

Para entornos de producción reales, se recomienda usar PM2 o un servicio similar:

```bash
npm install -g pm2
cd dist
pm2 start server.js --name boostify-music
```

## Verificación de Implementación

Para verificar que la aplicación está funcionando correctamente:

1. Accede a la URL de la aplicación en un navegador
2. Verifica la API de estado: `curl http://tu-dominio.com/api/status`
3. Revisa los logs para detectar posibles errores: `pm2 logs boostify-music`

## Solución de Problemas Comunes

### Pantalla en Blanco o Error 404

Si la aplicación muestra una pantalla en blanco o errores 404:

- Verifica que el servidor Express esté configurado para servir el archivo index.html para rutas no encontradas
- Comprueba que los archivos estáticos estén correctamente copiados en dist/public
- Revisa los logs del servidor para posibles errores

### Errores de Conexión con APIs Externas

Si hay problemas conectando con APIs externas:

- Verifica que todas las claves API estén correctamente configuradas en las variables de entorno
- Comprueba los límites de las APIs y posibles restricciones de CORS
- Revisa la configuración de red del servidor (firewalls, etc.)

## Monitoreo y Mantenimiento

Se recomienda configurar monitoreo básico para la aplicación:

1. Configurar alertas para errores 500 y tiempos de respuesta elevados
2. Implementar un sistema de registro centralizado (ELK, Sentry, etc.)
3. Realizar copias de seguridad periódicas de datos críticos

---

Para cualquier consulta adicional sobre la implementación en producción, contacta al equipo de desarrollo.