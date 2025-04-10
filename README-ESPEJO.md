# Despliegue Exacto a Desarrollo 

Este proyecto incluye un sistema especial para asegurar que la aplicación en producción se vea exactamente igual que en desarrollo.

## Instrucciones Rápidas

1. **Modo Espejo (Recomendado)** - Redirige al servidor de desarrollo:

   ```
   node iniciar-espejo.js --skip-check
   ```

   Este modo configura un servidor que redirige todas las solicitudes al servidor de desarrollo, garantizando que se vea exactamente igual.

2. **Compilación Completa** - Crea una versión para producción:

   ```
   node compilar-exacto.js
   ```

   Este método construye una versión completa que puede ser desplegada independientemente.

## Modo Espejo - Ventajas

- **Misma experiencia garantizada**: Lo que ves en desarrollo es exactamente lo que verás en producción.
- **Sin reconstrucciones**: Los cambios en desarrollo se reflejan automáticamente en producción.
- **Fácil despliegue**: No requiere un proceso complejo de construcción.

## Configuración Avanzada

Puedes configurar el servidor espejo con variables de entorno:

```
DEV_HOST=miservidor DEV_PORT=5000 DEV_PROTOCOL=https node iniciar-espejo.js
```

Para más información, consulta [INSTRUCCIONES-ESPEJO.md](INSTRUCCIONES-ESPEJO.md).

## Resolución de problemas

Si encuentras algún problema:

1. Asegúrate que el servidor de desarrollo esté en ejecución
2. Usa la opción `--skip-check` si hay problemas de conectividad
3. Verifica que las URL configuradas sean correctas

## Escenarios de uso

- **Desarrollo rápido**: Ideal para hacer pruebas continuas mientras desarrollas.
- **Despliegue demostrativo**: Perfecto para mostrar el progreso a clientes o usuarios.
- **Entornos de prueba**: Garantiza consistencia entre pruebas y desarrollo.