/**
 * Servidor simple para servir directamente la página de la tienda
 * Esto evita problemas de carga con el desarrollo completo de Vite
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde client/dist
app.use(express.static(path.join(__dirname, 'client/dist')));

// Ruta para la página de la tienda
app.get('/store', (req, res) => {
  // Leer el archivo HTML principal
  const htmlPath = path.join(__dirname, 'client/dist/index.html');
  
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // Si no existe, mostrar una página simple
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boostify Store</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            background-color: #f9f9f9;
          }
          header {
            margin-bottom: 20px;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #ff6b00;
          }
          .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #eaeaea;
          }
          .tab {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
          }
          .tab.active {
            border-bottom-color: #ff6b00;
            font-weight: bold;
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          .product-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .product-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .product-description {
            color: #666;
            margin-bottom: 15px;
            font-size: 14px;
          }
          .product-price {
            font-weight: bold;
            color: #ff6b00;
            font-size: 20px;
            margin: 15px 0;
          }
          .btn {
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #ff6b00;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            text-align: center;
          }
          .btn:hover {
            background-color: #e25d00;
          }
          .btn:disabled {
            background-color: #ffc299;
            cursor: not-allowed;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
            background-color: #ff6b00;
            color: white;
          }
          .feature {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .feature svg {
            margin-right: 8px;
            color: #ff6b00;
          }
          @media (max-width: 768px) {
            .products-grid {
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="logo">Boostify Store</div>
        </header>
        
        <div class="tabs">
          <div class="tab active" data-tab="bots">Automation Bots</div>
          <div class="tab" data-tab="apps">Mobile Apps</div>
        </div>
        
        <div class="tab-content active" id="bots-content">
          <h2>Social Media Automation Bots</h2>
          <p>Optimize your social media presence with our professional automation tools</p>
          
          <div class="products-grid">
            <div class="product-card">
              <span class="badge">Popular</span>
              <div class="product-name">InstagramPro Bot</div>
              <div class="product-description">Advanced automation bot for organic Instagram growth</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Automated follow/unfollow
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Comment management
              </div>
              <div class="product-price">$49.99/month</div>
              <button class="btn" onclick="handlePurchase('bot1')">Purchase Now</button>
            </div>
            
            <div class="product-card">
              <div class="product-name">Facebook Growth Engine</div>
              <div class="product-description">Complete automation for Facebook pages and groups</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Multi-page management
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Group automation
              </div>
              <div class="product-price">$59.99/month</div>
              <button class="btn" onclick="handlePurchase('bot2')">Purchase Now</button>
            </div>
            
            <div class="product-card">
              <div class="product-name">Social Media Suite</div>
              <div class="product-description">Complete bot suite for all platforms</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Multi-platform management
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Unified dashboard
              </div>
              <div class="product-price">$99.99/month</div>
              <button class="btn" onclick="handlePurchase('bot3')">Purchase Now</button>
            </div>
          </div>
        </div>
        
        <div class="tab-content" id="apps-content">
          <h2>Mobile Apps</h2>
          <p>Boost your creativity with our professional mobile applications for musicians and content creators</p>
          
          <div class="products-grid">
            <div class="product-card">
              <span class="badge">Popular</span>
              <span class="badge" style="background-color: #3b82f6;">Beta</span>
              <div class="product-name">VirtualFit Pro</div>
              <div class="product-description">Try on clothing virtually with AI-powered precision</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Real-time garment fitting
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Size recommendation
              </div>
              <div class="product-price">$4.99</div>
              <button class="btn" onclick="handlePurchase('app1')">
                Download
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 5px;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </div>
            
            <div class="product-card">
              <span class="badge" style="background: linear-gradient(to right, #ff6b00, #9333ea);">Premium</span>
              <span class="badge" style="background-color: #3b82f6;">Beta</span>
              <div class="product-name">LipSyncMaster</div>
              <div class="product-description">Professional lip syncing app for musicians and creators</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Real-time lip synchronization
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Multiple language support
              </div>
              <div class="product-price">$5.99</div>
              <button class="btn" onclick="handlePurchase('app2')">
                Download
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 5px;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </div>
            
            <div class="product-card">
              <div class="product-name">MusicVisualizerPro</div>
              <div class="product-description">Transform your music into stunning visual experiences</div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Real-time audio analysis
              </div>
              <div class="feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Custom visual themes
              </div>
              <div class="product-price">$4.99</div>
              <button class="btn" onclick="handlePurchase('app3')">
                Download
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 5px;">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <script>
          // Simple tab switching
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
              // Remove active class from all tabs
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              // Add active class to clicked tab
              tab.classList.add('active');
              const tabName = tab.getAttribute('data-tab');
              document.getElementById(tabName + '-content').classList.add('active');
            });
          });
          
          // Handle product purchase
          function handlePurchase(productId) {
            alert('Para finalizar la compra, por favor inicia sesión o crea una cuenta. Esta es una página de demostración.');
            
            // Aquí iría la lógica real para procesar la compra
            // Ejemplo: window.location.href = '/api/stripe/create-product-payment?product=' + productId;
          }
        </script>
      </body>
      </html>
    `);
  }
});

// Cualquier otra ruta redirige a la raíz
app.get('*', (req, res) => {
  res.redirect('/store');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de la tienda iniciado en el puerto ${PORT}`);
  console.log(`Accede a la tienda en: http://localhost:${PORT}/store`);
});