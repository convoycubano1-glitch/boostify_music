#!/usr/bin/env node
/**
 * Test Investor Email Script
 * Sends test emails to verify templates before going live
 */

import 'dotenv/config';
import { Resend } from 'resend';
import { generatePersonalizedEmail } from '../server/services/investor-outreach/email-templates';
import { InvestorLead } from '../server/services/investor-outreach/types';

const resend = new Resend(process.env.RESEND_API_KEY);

// Test recipient
const TEST_EMAIL = 'convoycubano@gmail.com';
const FROM_EMAIL = 'Boostify Music <info@boostifymusic.com>';

// Sample lead for testing
const testLead: InvestorLead = {
  id: 'test-001',
  email: TEST_EMAIL,
  firstName: 'John',
  lastName: 'Smith',
  fullName: 'John Smith',
  company: 'Music Ventures Capital',
  title: 'Managing Partner',
  industry: 'Venture Capital',
  source: 'manual',
  createdAt: new Date(),
  emailsSent: 0,
  status: 'new',
  investorType: 'vc_fund',
  personalizedData: {
    recentNews: 'Recently led $10M round in streaming startup',
    relevantInvestments: ['Spotify', 'SoundCloud', 'Bandcamp'],
  },
};

// All templates to test
const TEMPLATES = [
  'cold_outreach_direct',
  'cold_outreach_problem',
  'warm_vc_intro',
  'record_label_exec',
  'follow_up_3d',
  'follow_up_7d',
];

async function sendTestEmail(templateId: string): Promise<void> {
  console.log(`\n📧 Sending test email: ${templateId}...`);
  
  const { subject, html, text } = generatePersonalizedEmail(testLead, templateId);
  
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: `[TEST] ${subject}`,
      html,
      text,
      tags: [
        { name: 'type', value: 'test' },
        { name: 'template', value: templateId },
      ],
    });

    if (response.error) {
      console.error(`❌ Error: ${response.error.message}`);
    } else {
      console.log(`✅ Sent! Message ID: ${response.data?.id}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
  }
}

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('   🎵 BOOSTIFY - TEST INVESTOR EMAILS');
  console.log('═'.repeat(60));
  console.log(`\n📬 Sending to: ${TEST_EMAIL}`);
  console.log(`📤 From: ${FROM_EMAIL}`);
  console.log(`📋 Templates: ${TEMPLATES.length}`);
  
  // Check API key
  if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY not found in .env');
    process.exit(1);
  }
  
  const templateArg = process.argv[2];
  
  if (templateArg && templateArg !== 'all') {
    // Send specific template
    if (!TEMPLATES.includes(templateArg)) {
      console.error(`\n❌ Unknown template: ${templateArg}`);
      console.log('Available templates:', TEMPLATES.join(', '));
      process.exit(1);
    }
    await sendTestEmail(templateArg);
  } else {
    // Send all templates
    console.log('\n🚀 Sending all templates...\n');
    
    for (const template of TEMPLATES) {
      await sendTestEmail(template);
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test complete! Check your inbox at:');
  console.log(`   ${TEST_EMAIL}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
