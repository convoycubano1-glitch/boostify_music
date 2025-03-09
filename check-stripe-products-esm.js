/**
 * Script para verificar productos y precios disponibles en Stripe
 * 
 * Este script consulta la API de Stripe para obtener todos los productos y precios
 * disponibles en la cuenta, lo que nos ayuda a identificar los IDs correctos para usar.
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { createInterface } from 'readline';

// Cargar variables de entorno
dotenv.config();

// Inicializar Stripe con la API key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY no está definida en las variables de entorno');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function listAllProducts() {
  console.log('======= PRODUCTOS EN STRIPE =======');
  try {
    const products = await stripe.products.list({ limit: 100, active: true });
    
    if (products.data.length === 0) {
      console.log('No hay productos disponibles en la cuenta de Stripe.');
      return [];
    }
    
    products.data.forEach(product => {
      console.log(`- ${product.name} (${product.id}): ${product.description || 'Sin descripción'}`);
      console.log(`  Activo: ${product.active}, Creado: ${new Date(product.created * 1000).toLocaleString()}`);
    });
    
    return products.data;
  } catch (error) {
    console.error('Error al listar productos:', error);
    return [];
  }
}

async function listAllPrices() {
  console.log('\n======= PRECIOS EN STRIPE =======');
  try {
    const prices = await stripe.prices.list({ limit: 100, active: true });
    
    if (prices.data.length === 0) {
      console.log('No hay precios disponibles en la cuenta de Stripe.');
      return;
    }
    
    prices.data.forEach(price => {
      const amount = price.unit_amount / 100; // Stripe almacena los precios en centavos
      const currency = price.currency.toUpperCase();
      const interval = price.recurring ? ` / ${price.recurring.interval}` : '';
      
      console.log(`- ${price.id}: ${amount} ${currency}${interval}`);
      console.log(`  Producto: ${price.product}`);
      console.log(`  Activo: ${price.active}, Creado: ${new Date(price.created * 1000).toLocaleString()}`);
    });
  } catch (error) {
    console.error('Error al listar precios:', error);
  }
}

async function createSubscriptionProducts() {
  console.log('\n======= CREANDO PRODUCTOS DE SUSCRIPCIÓN =======');
  
  const products = [
    {
      name: 'Basic',
      description: 'Complete tools for emerging artists',
      metadata: { level: 'basic' }
    },
    {
      name: 'Pro',
      description: 'Advanced tools for professional artists',
      metadata: { level: 'pro' }
    },
    {
      name: 'Premium',
      description: 'Complete solution for established artists',
      metadata: { level: 'premium' }
    }
  ];
  
  for (const productData of products) {
    try {
      console.log(`Creando producto: ${productData.name}...`);
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        active: true,
        metadata: productData.metadata
      });
      
      console.log(`Producto creado: ${product.id}`);
      
      // Crear precio mensual para este producto
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.name === 'Basic' ? 5999 : 
                     productData.name === 'Pro' ? 9999 : 14999, // en centavos
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          level: productData.metadata.level
        }
      });
      
      console.log(`Precio mensual creado: ${price.id} ($${price.unit_amount/100}/mes)`);
    } catch (error) {
      console.error(`Error al crear producto ${productData.name}:`, error);
    }
  }
}

async function main() {
  // Lista los productos y precios existentes
  const products = await listAllProducts();
  await listAllPrices();
  
  // Comprobar si debemos crear productos nuevos (usando argumento de línea de comandos)
  if (process.argv.includes('--create')) {
    console.log('\nCreando productos para el sistema de música...');
    await createSubscriptionProducts();
    console.log('\nProductos creados. Vuelve a ejecutar este script sin --create para ver los IDs.');
  } else {
    // Sugerir próximos pasos
    console.log('\n======= PRÓXIMOS PASOS =======');
    console.log('1. Actualiza los IDs de precio en el archivo client/src/components/subscription/pricing-plans.tsx');
    console.log('2. O actualiza las variables de entorno STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO y STRIPE_PRICE_PREMIUM');
    console.log('3. Para crear productos nuevos, ejecuta este script con --create: node check-stripe-products-esm.js --create');
  }
}

main().catch(err => console.error('Error:', err));