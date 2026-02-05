/**
 * Migration: Add email verification columns to leads tables
 * 
 * Run with: npx tsx scripts/migrations/add-email-verification-columns.ts
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting email verification migration...\n');
    
    // 1. Add columns to artist_leads
    console.log('📋 Adding columns to artist_leads...');
    await client.query(`
      ALTER TABLE artist_leads 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS bounce_reason TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS spam_complaint_at TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP DEFAULT NULL
    `);
    console.log('   ✅ artist_leads updated');
    
    // 2. Add columns to investor_leads
    console.log('📋 Adding columns to investor_leads...');
    try {
      await client.query(`
        ALTER TABLE investor_leads 
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS verification_score INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS bounce_reason TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS spam_complaint_at TIMESTAMP DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP DEFAULT NULL
      `);
      console.log('   ✅ investor_leads updated');
    } catch (error) {
      console.log('   ⚠️ investor_leads table may not exist, skipping');
    }
    
    // 3. Create email_bounces table
    console.log('📋 Creating email_bounces table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_bounces (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        bounce_type VARCHAR(50) NOT NULL DEFAULT 'hard',
        bounce_count INTEGER DEFAULT 1,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_bounce_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ email_bounces created');
    
    // 4. Create email_blacklist table
    console.log('📋 Creating email_blacklist table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_blacklist (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        reason VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ email_blacklist created');
    
    // 5. Create indexes for faster lookups
    console.log('📋 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_artist_leads_email_verified 
      ON artist_leads(email_verified);
      
      CREATE INDEX IF NOT EXISTS idx_artist_leads_lead_status 
      ON artist_leads(lead_status);
      
      CREATE INDEX IF NOT EXISTS idx_email_bounces_email 
      ON email_bounces(email);
      
      CREATE INDEX IF NOT EXISTS idx_email_blacklist_email 
      ON email_blacklist(email);
    `);
    console.log('   ✅ Indexes created');
    
    // 6. Update lead_status enum values if needed
    console.log('📋 Checking lead_status values...');
    await client.query(`
      UPDATE artist_leads SET lead_status = 'new' WHERE lead_status IS NULL;
    `);
    console.log('   ✅ NULL statuses updated');
    
    // 7. Report current status
    const stats = await client.query(`
      SELECT 
        lead_status,
        COUNT(*) as count
      FROM artist_leads
      GROUP BY lead_status
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Current lead status distribution:');
    for (const row of stats.rows) {
      console.log(`   ${row.lead_status || 'NULL'}: ${row.count}`);
    }
    
    // 8. Count emails that need verification
    const unverified = await client.query(`
      SELECT COUNT(*) as count 
      FROM artist_leads 
      WHERE email_verified IS NULL 
        AND lead_status NOT IN ('bounced', 'invalid', 'spam_complaint', 'unsubscribed')
    `);
    
    console.log(`\n📧 Emails pending verification: ${unverified.rows[0].count}`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npx tsx scripts/verify-email-list.ts');
    console.log('   2. Review invalid emails and fix with --fix flag');
    console.log('   3. Configure Brevo webhook URL: https://boostifymusic.com/api/webhooks/brevo');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
