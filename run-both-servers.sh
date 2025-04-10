#!/bin/bash

# Iniciar el servidor Express en segundo plano
node server-express.js &

# Esperar un momento para que el servidor Express inicie
sleep 3

# Iniciar el servidor Vite
cd client && npx vite --host 0.0.0.0
