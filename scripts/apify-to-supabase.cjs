/**
 * 🔄 APIFY TO SUPABASE - Extrae leads de Apify y los guarda en Supabase
 * Evita duplicados por email
 */

const { Pool } = require('pg');
const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets') });

// Supabase connection (from environment variables)
const pool = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Apify client (from environment variables)
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_INDUSTRY
});

// Configuración de búsqueda
const SEARCH_CONFIG = {
  query: 'music artist manager label A&R',
  country: 'United States',
  maxResults: 50  // Ajustar según necesidad
};

async function extractAndSaveLeads() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 APIFY TO SUPABASE - Extracción de Leads');
  console.log('='.repeat(60));
  console.log(`\nBúsqueda: "${SEARCH_CONFIG.query}"`);
  console.log(`País: ${SEARCH_CONFIG.country}`);
  console.log(`Máximo: ${SEARCH_CONFIG.maxResults} leads`);
  console.log('─'.repeat(60));

  const client = await pool.connect();
  
  try {
    // 1. Ejecutar Apify actor
    console.log('\n🚀 Ejecutando Apify actor...');
    
    const run = await apifyClient.actor('code_crafter/leads-finder').call({
      query: SEARCH_CONFIG.query,
      country: SEARCH_CONFIG.country,
      maxResults: SEARCH_CONFIG.maxResults
    });

    console.log(`   ✅ Actor completado (Run ID: ${run.id})`);

    // 2. Obtener resultados
    console.log('\n📥 Obteniendo resultados...');
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    console.log(`   ✅ ${items.length} leads extraídos`);

    if (items.length === 0) {
      console.log('\n⚠️  No se encontraron leads');
      return;
    }

    // 3. Insertar en Supabase (evitando duplicados)
    console.log('\n📦 Guardando en Supabase...');
    
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of items) {
      // Validar que tenga email
      const email = item.email || item.personal_email;
      if (!email) {
        errors++;
        continue;
      }

      try {
        // Insertar lead
        const leadResult = await client.query(`
          INSERT INTO leads (
            email, personal_email, first_name, last_name, full_name,
            job_title, company_name, company_website, company_description,
            industry, company_size, city, state, country, linkedin, keywords, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'apify')
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [
          email,
          item.personal_email || null,
          item.first_name || null,
          item.last_name || null,
          item.full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || null,
          item.job_title || null,
          item.company_name || null,
          item.company_website || null,
          item.company_description || null,
          item.industry || null,
          item.company_size || null,
          item.city || null,
          item.state || null,
          item.country || 'United States',
          item.linkedin || null,
          item.keywords || null
        ]);

        if (leadResult.rows.length > 0) {
          // Nuevo lead - crear status
          const leadId = leadResult.rows[0].id;
          await client.query(`
            INSERT INTO lead_status (lead_id, status, warmup_stage)
            VALUES ($1, 'new', 0)
          `, [leadId]);
          
          inserted++;
          console.log(`   ✅ ${item.first_name || email} - ${item.company_name || 'N/A'}`);
        } else {
          duplicates++;
        }
      } catch (err) {
        errors++;
        console.log(`   ❌ Error con ${email}: ${err.message}`);
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`   ✅ Nuevos leads insertados: ${inserted}`);
    console.log(`   ⏭️  Duplicados (ya existían): ${duplicates}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📦 Total procesados: ${items.length}`);

    // Mostrar stats actuales
    const totalLeads = await client.query('SELECT COUNT(*) FROM leads');
    const newLeads = await client.query("SELECT COUNT(*) FROM lead_status WHERE status = 'new'");
    
    console.log('\n📈 ESTADO ACTUAL EN SUPABASE:');
    console.log(`   • Total leads: ${totalLeads.rows[0].count}`);
    console.log(`   • Pendientes de contactar: ${newLeads.rows[0].count}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

extractAndSaveLeads();
