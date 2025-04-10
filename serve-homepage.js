// Servidor simple para mostrar el homepage
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Ruta principal que sirve un HTML básico que carga home.tsx
app.get('/', (req, res) => {
  console.log('Sirviendo la página principal');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music - Home</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
      background-color: #121212;
      color: white;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 24px;
    }
  </style>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root">
    <div class="loading">Cargando home.tsx...</div>
  </div>

  <script type="text/babel">
    // Componente principal que cargará src/pages/home.tsx
    function App() {
      const [homeContent, setHomeContent] = React.useState('');
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState(null);

      React.useEffect(() => {
        // Cargar el contenido de home.tsx
        fetch('/get-home-content')
          .then(response => {
            if (!response.ok) {
              throw new Error('Error al cargar el contenido de home.tsx');
            }
            return response.text();
          })
          .then(content => {
            setHomeContent(content);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message);
            setLoading(false);
          });
      }, []);

      if (loading) {
        return <div className="loading">Cargando home.tsx...</div>;
      }

      if (error) {
        return <div className="text-red-500 p-4">Error: {error}</div>;
      }

      return (
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Contenido de src/pages/home.tsx:</h1>
          <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm text-gray-300" style={{maxHeight: '80vh'}}>
            {homeContent}
          </pre>
        </div>
      );
    }

    // Renderizar la aplicación
    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Ruta para obtener el contenido de home.tsx
app.get('/get-home-content', (req, res) => {
  fs.readFile('./src/pages/home.tsx', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer home.tsx:', err);
      return res.status(500).send('Error al leer el archivo home.tsx');
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(data);
  });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
});