# Guía de Despliegue - Boostify Music

## Instrucciones para despliegue en producción

### 1. Compilar para producción

Para construir la aplicación para producción, ejecute:

```
npm run build:deploy
```

Este comando:
- Ignora errores no críticos de TypeScript
- Compila el servidor y el cliente
- Genera una versión optimizada para producción en la carpeta `dist/`

### 2. Implementar en producción

La carpeta `dist/` contiene todos los archivos necesarios para el despliegue:

1. Copie todo el contenido de la carpeta `dist/` a su servidor
2. Instale las dependencias: `npm install --production`
3. Inicie la aplicación: `npm start`

### Variables de entorno requeridas

Asegúrese de que las siguientes variables estén configuradas:

- `NODE_ENV=production`
- `PORT=5000` (o el puerto deseado)
- `DATABASE_URL` (URL de conexión a PostgreSQL si se usa)
- `FIREBASE_CONFIG` (Configuración de Firebase)
- `OPENAI_API_KEY` (Clave de API de OpenAI)

## Solución de problemas comunes

Si encuentra errores durante el despliegue, verifique:

1. Que todas las variables de entorno están correctamente configuradas
2. Que los puertos necesarios están abiertos
3. Logs de la aplicación para información específica sobre errores
