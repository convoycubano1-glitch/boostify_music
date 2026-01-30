/**
 * 🔍 CHECK LEADS - Verificar leads en Supabase
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.twlflkphpowpvjvoyrae:Metafeed2024%40@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  
  try {
    // Total por campaña
    const bySource = await client.query(`
      SELECT source, COUNT(*) as count 
      FROM leads 
      GROUP BY source 
      ORDER BY count DESC
    `);
    
    console.log('='.repeat(60));
    console.log('📊 LEADS POR CAMPAÑA');
    console.log('='.repeat(60));
    bySource.rows.forEach(r => {
      console.log(`  ${r.source}: ${r.count} leads`);
    });
    
    // Últimos leads
    const recent = await client.query(`
      SELECT email, full_name, job_title, source, created_at 
      FROM leads 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n' + '─'.repeat(60));
    console.log('📧 ÚLTIMOS 10 LEADS');
    console.log('─'.repeat(60));
    
    recent.rows.forEach(r => {
      console.log(`\n  ✅ ${r.email}`);
      console.log(`     ${r.full_name || 'Sin nombre'} | ${r.job_title || 'Sin cargo'}`);
      console.log(`     Campaña: ${r.source}`);
    });
    
    // Total
    const total = await client.query('SELECT COUNT(*) as count FROM leads');
    console.log('\n' + '='.repeat(60));
    console.log(`📈 TOTAL LEADS EN BASE: ${total.rows[0].count}`);
    console.log('='.repeat(60));
    
  } finally {
    client.release();
    await pool.end();
  }
}

check();
