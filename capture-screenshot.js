/**
 * Script para capturar una imagen de la interfaz de Boostify Music
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function captureScreenshot() {
  console.log('🔍 Iniciando captura de pantalla...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar viewport para una buena captura
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    });
    
    // Visitar la URL de la aplicación
    console.log('🌐 Navegando a la página de inicio...');
    await page.goto('https://workspace.replit.app', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Esperar a que la aplicación se cargue completamente
    console.log('⏳ Esperando que la aplicación cargue...');
    await page.waitForTimeout(5000);
    
    // Capturar y guardar la pantalla
    const screenshotPath = path.join(__dirname, 'screenshots');
    
    // Crear directorio si no existe
    if (!fs.existsSync(screenshotPath)) {
      fs.mkdirSync(screenshotPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `boostify-homepage-${timestamp}.png`;
    const fullPath = path.join(screenshotPath, filename);
    
    console.log(`📸 Capturando pantalla...`);
    await page.screenshot({ path: fullPath, fullPage: true });
    
    console.log(`✅ Captura guardada en: ${fullPath}`);
    
    // Imprimir los elementos principales de la página
    const pageTitle = await page.title();
    console.log(`📄 Título de la página: ${pageTitle}`);
    
    const headings = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2'));
      return elements.map(el => ({
        type: el.tagName,
        text: el.innerText
      }));
    });
    
    console.log('📋 Elementos principales en la página:');
    headings.forEach(h => console.log(`  ${h.type}: ${h.text}`));
    
  } catch (error) {
    console.error('❌ Error al capturar la pantalla:', error);
  } finally {
    // Cerrar el navegador
    await browser.close();
    console.log('🏁 Proceso completado');
  }
}

// Ejecutar la captura
captureScreenshot().catch(console.error);