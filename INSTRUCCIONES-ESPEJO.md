# Instrucciones para Desplegar en Modo Espejo

Este es un sistema especial que permite que tu aplicación en producción se vea exactamente igual que en desarrollo. En lugar de construir una versión estática de la aplicación, este sistema redirige todas las solicitudes a tu servidor de desarrollo.

## Ventajas

- **Siempre actualizado**: No necesitas reconstruir la aplicación para ver los cambios
- **Fidelidad completa**: La aplicación se ve y funciona exactamente igual que en desarrollo
- **Rápido de configurar**: No requiere un proceso complejo de construcción

## Instrucciones rápidas

1. **Inicia tu servidor de desarrollo** (si no está ya en ejecución):
   ```
   node start.js
   ```

2. **Inicia el servidor espejo** en otra terminal:
   ```
   node iniciar-espejo.js
   ```

3. **Accede a tu aplicación** a través del servidor espejo (generalmente en puerto 3000)

## Opciones Avanzadas

Puedes configurar el comportamiento usando variables de entorno:

```
DEV_HOST=mi-servidor DEV_PORT=5000 DEV_PROTOCOL=https node iniciar-espejo.js
```

O omitir la verificación del servidor (no recomendado):

```
node iniciar-espejo.js --skip-check
```

## Cómo funciona

Este sistema utiliza un simple servidor HTTP que:

1. Recibe solicitudes en el puerto de producción
2. Redirige automáticamente al servidor de desarrollo
3. Preserva todas las rutas y parámetros

Esto garantiza que lo que ves en producción es exactamente lo que tienes en desarrollo.

## Resolución de problemas

Si encuentras errores:

1. Asegúrate que el servidor de desarrollo esté en ejecución
2. Verifica que las URL y puertos configurados sean correctos
3. Si usas Replit, comprueba que la URL .replit.app sea accesible

## Crear build completo (alternativa)

Si necesitas una construcción completa para producción sin depender del servidor de desarrollo:

```
node compilar-exacto.js
```

Esto generará una versión autónoma en la carpeta `dist`.