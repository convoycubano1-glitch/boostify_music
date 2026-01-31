/**
 * 🔐 SECRETS LOADER - Carga las API keys desde variables de entorno o .env local
 * 
 * En LOCAL: Las keys están en el archivo .env.secrets (no se sube a git)
 * En GITHUB: Las keys están en GitHub Secrets
 */

// Cargar .env.secrets si existe (solo en local)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env.secrets') });
} catch (e) {
  // dotenv no disponible o archivo no existe - usar variables de entorno directas
}

const secrets = {
  // OpenAI (compartido por todas las campañas)
  openai: process.env.OPENAI_API_KEY || '',
  
  // Supabase
  supabase: process.env.SUPABASE_CONNECTION_STRING || 'postgresql://postgres.twlflkphpowpvjvoyrae:Metafeed2024%40@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  
  // Brevo API (para boostifymusic.com - reemplaza RESEND_API_INDUSTRY)
  brevo: process.env.BREVO_API_KEY || '',
  
  // Resend APIs por campaña (para otros dominios como boostifymusic.site)
  resend: {
    INDUSTRY: process.env.BREVO_API_KEY || '', // Ahora usa Brevo
    ARTISTS_1: process.env.RESEND_API_ARTISTS_1 || '',
    ARTISTS_2: process.env.RESEND_API_ARTISTS_2 || '',
    ARTISTS_3: process.env.RESEND_API_ARTISTS_3 || '',
    ARTISTS_4: process.env.RESEND_API_ARTISTS_4 || '',
  },
  
  // Apify APIs por campaña
  apify: {
    INDUSTRY: process.env.APIFY_API_INDUSTRY || '',
    ARTISTS_1: process.env.APIFY_API_ARTISTS_1 || '',
    ARTISTS_2: process.env.APIFY_API_ARTISTS_2 || '',
    ARTISTS_3: process.env.APIFY_API_ARTISTS_3 || '',
    ARTISTS_4: process.env.APIFY_API_ARTISTS_4 || '',
  }
};

module.exports = secrets;
