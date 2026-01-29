/**
 * Intelligent Email Templates for Investor Outreach
 * Highly personalized, professional emails for music tech investors
 */

import { InvestorLead, EmailTemplate } from './types';

// ============================================
// EMAIL TEMPLATE SYSTEM
// ============================================

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  // ============================================
  // COLD OUTREACH - VARIANT A (Direct Pitch)
  // ============================================
  cold_outreach_direct: {
    id: 'cold_outreach_direct',
    name: 'Cold Outreach - Direct Pitch',
    subject: '{{firstName}}, Transforming How Independent Artists Build Careers',
    preheader: 'AI-powered music platform raising seed round on Wefunder',
    category: 'cold_outreach',
    abVariant: 'A',
    variables: ['firstName', 'company', 'personalHook', 'relevantInvestment'],
    htmlContent: ``,
    textContent: ``,
  },

  // ============================================
  // COLD OUTREACH - VARIANT B (Problem-First)
  // ============================================
  cold_outreach_problem: {
    id: 'cold_outreach_problem',
    name: 'Cold Outreach - Problem First',
    subject: 'The $43B Problem No One Is Solving for Musicians',
    preheader: 'AI-powered solution now raising on Wefunder',
    category: 'cold_outreach',
    abVariant: 'B',
    variables: ['firstName', 'company', 'personalHook'],
    htmlContent: ``,
    textContent: ``,
  },

  // ============================================
  // WARM INTRO - VC/Angel Focus
  // ============================================
  warm_vc_intro: {
    id: 'warm_vc_intro',
    name: 'VC/Angel Warm Introduction',
    subject: '{{firstName}} — Quick Question About Music Tech Investments',
    preheader: 'Saw your work with {{relevantInvestment}}',
    category: 'warm_intro',
    variables: ['firstName', 'company', 'relevantInvestment', 'personalHook'],
    htmlContent: ``,
    textContent: ``,
  },

  // ============================================
  // RECORD LABEL EXECUTIVE
  // ============================================
  record_label_exec: {
    id: 'record_label_exec',
    name: 'Record Label Executive',
    subject: '{{firstName}}, New Tech That Could Change Artist Development',
    preheader: 'AI tools designed for the modern music industry',
    category: 'cold_outreach',
    variables: ['firstName', 'company', 'personalHook'],
    htmlContent: ``,
    textContent: ``,
  },

  // ============================================
  // FOLLOW UP - 3 Days
  // ============================================
  follow_up_3d: {
    id: 'follow_up_3d',
    name: 'Follow Up - 3 Days',
    subject: 'Re: {{originalSubject}}',
    preheader: 'Quick follow-up on Boostify Music',
    category: 'follow_up',
    variables: ['firstName', 'originalSubject'],
    htmlContent: ``,
    textContent: ``,
  },

  // ============================================
  // FOLLOW UP - 7 Days (Final)
  // ============================================
  follow_up_7d: {
    id: 'follow_up_7d',
    name: 'Follow Up - 7 Days Final',
    subject: '{{firstName}} — Last Reach Out 🎵',
    preheader: 'Closing this loop',
    category: 'follow_up',
    variables: ['firstName'],
    htmlContent: ``,
    textContent: ``,
  },
};

// ============================================
// GENERATE PERSONALIZED EMAIL
// ============================================
export function generatePersonalizedEmail(
  lead: InvestorLead,
  templateId: string
): { subject: string; html: string; text: string } {
  const template = EMAIL_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Generate personalized hook based on lead data
  const personalHook = generatePersonalHook(lead);
  const relevantInvestment = lead.portfolioCompanies?.[0] || lead.investmentFocus?.[0] || 'music technology';

  // Prepare variables
  const variables: Record<string, string> = {
    firstName: lead.firstName || 'there',
    lastName: lead.lastName || '',
    fullName: lead.fullName || lead.firstName || 'there',
    company: lead.company || 'your company',
    title: lead.title || '',
    personalHook,
    relevantInvestment,
    recentNews: lead.personalizedData?.recentNews || '',
    originalSubject: 'Transforming How Independent Artists Build Careers',
  };

  // Generate the full email content
  const emailContent = generateEmailContent(lead, templateId, variables);

  // Replace variables in subject
  let subject = template.subject;
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return {
    subject,
    html: emailContent.html,
    text: emailContent.text,
  };
}

// ============================================
// GENERATE PERSONAL HOOK
// ============================================
function generatePersonalHook(lead: InvestorLead): string {
  // Priority 1: Recent news
  if (lead.personalizedData?.recentNews) {
    return `I noticed the recent news about ${lead.personalizedData.recentNews.substring(0, 50)}...`;
  }

  // Priority 2: Portfolio companies
  if (lead.portfolioCompanies && lead.portfolioCompanies.length > 0) {
    return `I've been following ${lead.company}'s work with ${lead.portfolioCompanies[0]}, and I thought you might be interested in...`;
  }

  // Priority 3: Investment focus
  if (lead.investmentFocus && lead.investmentFocus.length > 0) {
    return `Given ${lead.company}'s focus on ${lead.investmentFocus[0]}, I wanted to share something that aligns perfectly with your thesis...`;
  }

  // Priority 4: Industry-based
  if (lead.industry.toLowerCase().includes('music') || lead.industry.toLowerCase().includes('entertainment')) {
    return `As someone deeply embedded in the music industry, you've likely seen the challenges independent artists face...`;
  }

  // Priority 5: Title-based
  if (lead.title.toLowerCase().includes('partner') || lead.title.toLowerCase().includes('investor')) {
    return `Your track record in identifying breakthrough companies caught my attention...`;
  }

  // Default hook
  return `I came across your profile while researching leaders in the music tech space...`;
}

// ============================================
// GENERATE FULL EMAIL CONTENT
// ============================================
function generateEmailContent(
  lead: InvestorLead,
  templateId: string,
  variables: Record<string, string>
): { html: string; text: string } {
  const isVC = lead.title.toLowerCase().includes('partner') || 
               lead.title.toLowerCase().includes('investor') ||
               lead.industry.toLowerCase().includes('venture');
  
  const isRecordLabel = lead.industry.toLowerCase().includes('music') ||
                        lead.company.toLowerCase().includes('record') ||
                        lead.company.toLowerCase().includes('music');

  // Select the appropriate email body
  let emailBody: { html: string; text: string };

  if (templateId.includes('follow_up')) {
    emailBody = generateFollowUpEmail(lead, variables, templateId);
  } else if (isVC) {
    emailBody = generateVCEmail(lead, variables);
  } else if (isRecordLabel) {
    emailBody = generateRecordLabelEmail(lead, variables);
  } else {
    emailBody = generateGenericInvestorEmail(lead, variables);
  }

  return emailBody;
}

// ============================================
// VC/ANGEL INVESTOR EMAIL
// ============================================
function generateVCEmail(lead: InvestorLead, vars: Record<string, string>): { html: string; text: string } {
  const text = `Hi ${vars.firstName},

${vars.personalHook}

I'm the founder of Boostify Music — an AI-powered platform that's transforming how independent artists create, distribute, and monetize their music. Think of us as the "Shopify for musicians," but with cutting-edge AI at the core.

THE OPPORTUNITY:
• $43.6B TAM in music tech (growing 18.5% CAGR)
• 80% of artists struggle with distribution and promotion
• We're solving this with AI-generated music videos, smart distribution, and blockchain royalties

TRACTION:
• Live platform with early adopters
• AI video generation producing professional content in minutes
• Integrated blockchain for transparent royalty payments

We've just opened our Seed round on Wefunder:
→ $124K target (min $50K committed)
→ $5.5M valuation cap (Post-Money SAFE)
→ Minimum investment: $100

Given ${vars.company}'s focus on ${vars.relevantInvestment}, I'd love to get your perspective on our approach. Would you have 15 minutes this week for a quick call?

View our investor deck: https://boostifymusic.com/investors

Best regards,

---
Boostify Music
The AI-Powered Music Platform
🎵 boostifymusic.com
💰 wefunder.com/boostify.music`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 20px; }
    .highlight-box { background: linear-gradient(135deg, #f97316 0%, #eab308 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .stats { display: flex; justify-content: space-between; margin: 15px 0; }
    .stat { text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; }
    .stat-label { font-size: 12px; opacity: 0.9; }
    .cta-button { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 10px 5px 10px 0; }
    .cta-button.secondary { background: #1a1a1a; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <p>Hi ${vars.firstName},</p>
    <p>${vars.personalHook}</p>
  </div>

  <p>I'm the founder of <strong>Boostify Music</strong> — an AI-powered platform that's transforming how independent artists create, distribute, and monetize their music. Think of us as the <em>"Shopify for musicians,"</em> but with cutting-edge AI at the core.</p>

  <div class="highlight-box">
    <h3 style="margin-top: 0;">🎯 THE OPPORTUNITY</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li><strong>$43.6B TAM</strong> in music tech (growing 18.5% CAGR)</li>
      <li><strong>80% of artists</strong> struggle with distribution and promotion</li>
      <li>We're solving this with <strong>AI-generated music videos, smart distribution, and blockchain royalties</strong></li>
    </ul>
  </div>

  <h3>📈 TRACTION</h3>
  <ul>
    <li>Live platform with early adopters</li>
    <li>AI video generation producing professional content in minutes</li>
    <li>Integrated blockchain for transparent royalty payments</li>
  </ul>

  <h3>💰 INVESTMENT DETAILS</h3>
  <p>We've just opened our Seed round on Wefunder:</p>
  <ul>
    <li><strong>$124K target</strong> (min $50K committed)</li>
    <li><strong>$5.5M valuation cap</strong> (Post-Money SAFE)</li>
    <li><strong>Minimum investment: $100</strong></li>
  </ul>

  <p>Given ${vars.company}'s focus on ${vars.relevantInvestment}, I'd love to get your perspective on our approach. <strong>Would you have 15 minutes this week for a quick call?</strong></p>

  <div style="margin: 25px 0;">
    <a href="https://boostifymusic.com/investors" class="cta-button">📊 View Investor Deck</a>
    <a href="https://wefunder.com/boostify.music" class="cta-button secondary">💰 Invest on Wefunder</a>
  </div>

  <p>Best regards,</p>

  <div class="footer">
    <p><strong>Boostify Music</strong><br>The AI-Powered Music Platform</p>
    <p>
      🎵 <a href="https://boostifymusic.com">boostifymusic.com</a> | 
      💰 <a href="https://wefunder.com/boostify.music">wefunder.com/boostify.music</a>
    </p>
  </div>
</body>
</html>`;

  return { html, text };
}

// ============================================
// RECORD LABEL EXECUTIVE EMAIL
// ============================================
function generateRecordLabelEmail(lead: InvestorLead, vars: Record<string, string>): { html: string; text: string } {
  const text = `Hi ${vars.firstName},

${vars.personalHook}

As someone at ${vars.company}, you understand the challenges artists face in today's fragmented music landscape. I'm reaching out because we've built something that could transform artist development.

BOOSTIFY MUSIC is an AI-powered platform that gives independent artists the tools that were previously only available to major label artists:

• AI Music Video Generation — Professional videos in minutes, not weeks
• Smart Distribution — Multi-platform releases with intelligent optimization
• Blockchain Royalties — 100% transparent, automated payments
• Artist Branding Suite — AI-powered visual identity and marketing

We're currently raising our Seed round on Wefunder ($5.5M cap), and I thought someone with your industry experience might be interested — either as an investor or as a potential strategic partner.

Would you be open to a brief conversation about how we might work together?

Best,

---
Boostify Music
boostifymusic.com | wefunder.com/boostify.music`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .feature { background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; }
    .feature h4 { margin: 0 0 5px 0; color: #f97316; font-size: 14px; }
    .feature p { margin: 0; font-size: 13px; color: #666; }
    .cta-button { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 10px 5px 10px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <p>Hi ${vars.firstName},</p>

  <p>${vars.personalHook}</p>

  <p>As someone at <strong>${vars.company}</strong>, you understand the challenges artists face in today's fragmented music landscape. I'm reaching out because we've built something that could transform artist development.</p>

  <p><strong>BOOSTIFY MUSIC</strong> is an AI-powered platform that gives independent artists the tools that were previously only available to major label artists:</p>

  <div class="feature-grid">
    <div class="feature">
      <h4>🎬 AI Music Videos</h4>
      <p>Professional videos in minutes, not weeks</p>
    </div>
    <div class="feature">
      <h4>📡 Smart Distribution</h4>
      <p>Multi-platform releases with optimization</p>
    </div>
    <div class="feature">
      <h4>⛓️ Blockchain Royalties</h4>
      <p>100% transparent, automated payments</p>
    </div>
    <div class="feature">
      <h4>🎨 Artist Branding</h4>
      <p>AI-powered visual identity & marketing</p>
    </div>
  </div>

  <p>We're currently raising our Seed round on Wefunder (<strong>$5.5M cap</strong>), and I thought someone with your industry experience might be interested — either as an investor or as a potential strategic partner.</p>

  <p><strong>Would you be open to a brief conversation about how we might work together?</strong></p>

  <div style="margin: 25px 0;">
    <a href="https://boostifymusic.com/investors" class="cta-button">Learn More</a>
    <a href="https://wefunder.com/boostify.music" class="cta-button" style="background: #10b981;">Invest Now</a>
  </div>

  <p>Best,</p>

  <div class="footer">
    <p><strong>Boostify Music</strong></p>
    <p>🎵 <a href="https://boostifymusic.com">boostifymusic.com</a> | 💰 <a href="https://wefunder.com/boostify.music">wefunder.com/boostify.music</a></p>
  </div>
</body>
</html>`;

  return { html, text };
}

// ============================================
// GENERIC INVESTOR EMAIL
// ============================================
function generateGenericInvestorEmail(lead: InvestorLead, vars: Record<string, string>): { html: string; text: string } {
  const text = `Hi ${vars.firstName},

${vars.personalHook}

I'm building Boostify Music — the first all-in-one AI-powered platform for independent musicians. We're tackling a $43.6B market where 80% of artists lack access to professional tools for creating, distributing, and monetizing their music.

WHAT WE'VE BUILT:
• AI Video Generation — Create professional music videos in minutes
• Smart Distribution — Reach all major platforms with one click
• Blockchain Royalties — Transparent, automated payments
• MotionDNA™ — Unique visual identity system for each artist

We've just opened our Seed round on Wefunder:
• $124K target | $5.5M valuation cap
• Post-Money SAFE | $100 minimum

Would you be interested in learning more? I'd be happy to share our deck or jump on a quick call.

Best,

---
Boostify Music
boostifymusic.com | wefunder.com/boostify.music`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background: linear-gradient(135deg, #f97316 0%, #eab308 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 10px 5px 10px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <p>Hi ${vars.firstName},</p>

  <p>${vars.personalHook}</p>

  <p>I'm building <strong>Boostify Music</strong> — the first all-in-one AI-powered platform for independent musicians. We're tackling a <strong>$43.6B market</strong> where 80% of artists lack access to professional tools.</p>

  <div class="highlight">
    <h3 style="margin-top: 0;">🚀 WHAT WE'VE BUILT</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li><strong>AI Video Generation</strong> — Professional music videos in minutes</li>
      <li><strong>Smart Distribution</strong> — All major platforms, one click</li>
      <li><strong>Blockchain Royalties</strong> — Transparent, automated payments</li>
      <li><strong>MotionDNA™</strong> — Unique visual identity for each artist</li>
    </ul>
  </div>

  <h3>💰 INVESTMENT OPPORTUNITY</h3>
  <p>We've just opened our Seed round on Wefunder:</p>
  <ul>
    <li><strong>$124K target</strong> | <strong>$5.5M valuation cap</strong></li>
    <li>Post-Money SAFE | <strong>$100 minimum</strong></li>
  </ul>

  <p><strong>Would you be interested in learning more?</strong> I'd be happy to share our deck or jump on a quick call.</p>

  <div style="margin: 25px 0;">
    <a href="https://boostifymusic.com/investors" class="cta-button">📊 View Pitch Deck</a>
    <a href="https://wefunder.com/boostify.music" class="cta-button" style="background: #10b981;">💰 Invest Now</a>
  </div>

  <p>Best,</p>

  <div class="footer">
    <p><strong>Boostify Music</strong></p>
    <p>🎵 <a href="https://boostifymusic.com">boostifymusic.com</a> | 💰 <a href="https://wefunder.com/boostify.music">wefunder.com/boostify.music</a></p>
  </div>
</body>
</html>`;

  return { html, text };
}

// ============================================
// FOLLOW UP EMAILS
// ============================================
function generateFollowUpEmail(lead: InvestorLead, vars: Record<string, string>, templateId: string): { html: string; text: string } {
  if (templateId === 'follow_up_3d') {
    const text = `Hi ${vars.firstName},

I wanted to follow up on my previous email about Boostify Music.

Given your background in ${lead.industry}, I thought you might find our approach interesting:

• We're using AI to democratize music video production (10x faster than traditional methods)
• Our blockchain integration ensures artists get paid fairly and transparently
• Early traction shows strong product-market fit

Our Wefunder campaign is gaining momentum — we'd love to have you as part of our investor community.

Would you have 10 minutes this week for a quick call?

Best,
Boostify Music Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta-button { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <p>Hi ${vars.firstName},</p>

  <p>I wanted to follow up on my previous email about Boostify Music.</p>

  <p>Given your background in <strong>${lead.industry}</strong>, I thought you might find our approach interesting:</p>

  <ul>
    <li>We're using AI to democratize music video production (<strong>10x faster</strong> than traditional methods)</li>
    <li>Our blockchain integration ensures artists get paid <strong>fairly and transparently</strong></li>
    <li>Early traction shows strong product-market fit</li>
  </ul>

  <p>Our Wefunder campaign is gaining momentum — we'd love to have you as part of our investor community.</p>

  <p><strong>Would you have 10 minutes this week for a quick call?</strong></p>

  <div style="margin: 25px 0;">
    <a href="https://wefunder.com/boostify.music" class="cta-button">View Campaign →</a>
  </div>

  <p>Best,<br>Boostify Music Team</p>
</body>
</html>`;

    return { html, text };
  }

  // Final follow up
  const text = `Hi ${vars.firstName},

I know you're busy, so I'll keep this brief.

This is my last follow-up about Boostify Music. If the timing isn't right, no worries at all.

But if you're curious about what we're building in the AI + music space, our Wefunder page has all the details: wefunder.com/boostify.music

Either way, I appreciate your time. If you know anyone in your network who might be interested, I'd be grateful for an introduction.

Best of luck with everything at ${vars.company}!

Cheers,
Boostify Music Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta-button { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <p>Hi ${vars.firstName},</p>

  <p>I know you're busy, so I'll keep this brief.</p>

  <p>This is my last follow-up about Boostify Music. If the timing isn't right, no worries at all.</p>

  <p>But if you're curious about what we're building in the AI + music space, our Wefunder page has all the details:</p>

  <div style="margin: 20px 0;">
    <a href="https://wefunder.com/boostify.music" class="cta-button">View Wefunder Campaign</a>
  </div>

  <p>Either way, I appreciate your time. If you know anyone in your network who might be interested, I'd be grateful for an introduction.</p>

  <p>Best of luck with everything at <strong>${vars.company}</strong>!</p>

  <p>Cheers,<br>Boostify Music Team</p>
</body>
</html>`;

  return { html, text };
}

// ============================================
// SELECT BEST TEMPLATE FOR LEAD
// ============================================
export function selectBestTemplate(lead: InvestorLead): string {
  // Check if this is a follow-up
  if (lead.emailsSent === 1) return 'follow_up_3d';
  if (lead.emailsSent >= 2) return 'follow_up_7d';

  // VC/Angel investor
  if (
    lead.title.toLowerCase().includes('partner') ||
    lead.title.toLowerCase().includes('investor') ||
    lead.industry.toLowerCase().includes('venture') ||
    lead.industry.toLowerCase().includes('angel')
  ) {
    return 'warm_vc_intro';
  }

  // Record label/music industry
  if (
    lead.industry.toLowerCase().includes('music') ||
    lead.industry.toLowerCase().includes('entertainment') ||
    lead.company.toLowerCase().includes('record') ||
    lead.company.toLowerCase().includes('music') ||
    lead.company.toLowerCase().includes('label')
  ) {
    return 'record_label_exec';
  }

  // A/B test for cold outreach
  return Math.random() > 0.5 ? 'cold_outreach_direct' : 'cold_outreach_problem';
}

export default {
  EMAIL_TEMPLATES,
  generatePersonalizedEmail,
  selectBestTemplate,
};
