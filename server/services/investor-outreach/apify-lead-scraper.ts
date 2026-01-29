/**
 * Apify Lead Scraper Service
 * Extracts investor leads from music industry, record labels, VCs, etc.
 */

import { ApifyClient } from 'apify-client';
import { InvestorLead, ApifyLeadSearchParams } from './types';
import { v4 as uuidv4 } from 'uuid';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_KEY,
});

// Target profiles for music industry investors
export const MUSIC_INDUSTRY_SEARCH_CONFIGS: ApifyLeadSearchParams[] = [
  {
    keywords: ['music tech investor', 'music startup investor', 'entertainment VC'],
    industries: ['Venture Capital', 'Music', 'Entertainment'],
    titles: ['Partner', 'Managing Director', 'Principal', 'Investor', 'CEO', 'Founder'],
    maxResults: 50,
  },
  {
    keywords: ['record label executive', 'music publisher', 'A&R director'],
    industries: ['Music', 'Entertainment', 'Media'],
    titles: ['CEO', 'President', 'VP', 'Director', 'Head of', 'SVP', 'EVP'],
    maxResults: 50,
  },
  {
    keywords: ['music technology', 'audio streaming', 'music distribution'],
    industries: ['Technology', 'Music', 'Software'],
    titles: ['CEO', 'Founder', 'CTO', 'VP Business Development', 'Chief Strategy Officer'],
    maxResults: 50,
  },
  {
    keywords: ['angel investor music', 'entertainment angel', 'media investor'],
    industries: ['Angel Investment', 'Entertainment', 'Media'],
    titles: ['Angel Investor', 'Investor', 'Advisor', 'Board Member'],
    maxResults: 50,
  },
  {
    keywords: ['music industry consultant', 'entertainment advisor', 'music business'],
    industries: ['Consulting', 'Music', 'Entertainment'],
    titles: ['Consultant', 'Advisor', 'Principal', 'Managing Partner'],
    maxResults: 50,
  },
];

// LinkedIn Sales Navigator Scraper
export async function scrapeLinkedInLeads(params: ApifyLeadSearchParams): Promise<Partial<InvestorLead>[]> {
  try {
    const searchQuery = params.keywords.join(' OR ');
    const titleFilters = (params.titles || []).join(' OR ');
    
    // Using LinkedIn Profile Scraper actor
    const run = await apifyClient.actor('anchor/linkedin-profile-scraper').call({
      searchQuery: `${searchQuery} (${titleFilters})`,
      maxResults: params.maxResults || 50,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    return items.map((item: any) => ({
      id: uuidv4(),
      email: item.email || '',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      fullName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
      company: item.companyName || item.currentCompany || '',
      title: item.title || item.headline || '',
      linkedInUrl: item.linkedInUrl || item.profileUrl || '',
      industry: item.industry || (params.industries && params.industries[0]) || '',
      location: item.location || '',
      source: 'apify' as const,
      sourceUrl: item.profileUrl || '',
      createdAt: new Date(),
      emailsSent: 0,
      status: 'new' as const,
    }));
  } catch (error) {
    console.error('Error scraping LinkedIn leads:', error);
    return [];
  }
}

// Crunchbase Investor Scraper
export async function scrapeCrunchbaseInvestors(category: string = 'music'): Promise<Partial<InvestorLead>[]> {
  try {
    const run = await apifyClient.actor('epctex/crunchbase-scraper').call({
      searchQuery: `${category} investors`,
      entityType: 'investors',
      maxResults: 100,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    return items.map((item: any) => ({
      id: uuidv4(),
      email: item.email || '',
      firstName: item.name?.split(' ')[0] || '',
      lastName: item.name?.split(' ').slice(1).join(' ') || '',
      fullName: item.name || '',
      company: item.organization || '',
      title: item.title || 'Investor',
      industry: 'Venture Capital',
      subIndustry: category,
      location: item.location || '',
      investmentFocus: item.investmentFocus || [category],
      portfolioCompanies: item.portfolioCompanies || [],
      source: 'apify' as const,
      sourceUrl: item.url || '',
      createdAt: new Date(),
      emailsSent: 0,
      status: 'new' as const,
    }));
  } catch (error) {
    console.error('Error scraping Crunchbase:', error);
    return [];
  }
}

// Email Finder using Hunter.io via Apify
export async function findEmail(firstName: string, lastName: string, company: string): Promise<string | null> {
  try {
    const domain = await findCompanyDomain(company);
    if (!domain) return null;

    const run = await apifyClient.actor('drobnikj/hunter-email-finder').call({
      firstName,
      lastName,
      domain,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0] as Record<string, any> | undefined;
    return (firstItem?.email as string) || null;
  } catch (error) {
    console.error('Error finding email:', error);
    return null;
  }
}

// Helper to find company domain
async function findCompanyDomain(companyName: string): Promise<string | null> {
  try {
    const run = await apifyClient.actor('apify/google-search-scraper').call({
      queries: [`${companyName} official website`],
      maxPagesPerQuery: 1,
      resultsPerPage: 3,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0] as Record<string, any> | undefined;
    const firstResult = firstItem?.organicResults?.[0];
    
    if (firstResult?.link) {
      const url = new URL(firstResult.link);
      return url.hostname.replace('www.', '');
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Main function to collect all leads
export async function collectAllLeads(): Promise<Partial<InvestorLead>[]> {
  console.log('🎯 Starting investor lead collection...');
  const allLeads: Partial<InvestorLead>[] = [];

  // 1. LinkedIn leads from all search configs
  for (const config of MUSIC_INDUSTRY_SEARCH_CONFIGS) {
    console.log(`📊 Scraping LinkedIn for: ${config.keywords.join(', ')}`);
    const linkedInLeads = await scrapeLinkedInLeads(config);
    allLeads.push(...linkedInLeads);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 2. Crunchbase investors
  console.log('📊 Scraping Crunchbase for music investors...');
  const crunchbaseLeads = await scrapeCrunchbaseInvestors('music technology');
  allLeads.push(...crunchbaseLeads);

  // 3. Crunchbase entertainment investors
  console.log('📊 Scraping Crunchbase for entertainment investors...');
  const entertainmentLeads = await scrapeCrunchbaseInvestors('entertainment');
  allLeads.push(...entertainmentLeads);

  // Deduplicate by email and LinkedIn URL
  const uniqueLeads = deduplicateLeads(allLeads);
  
  console.log(`✅ Collected ${uniqueLeads.length} unique leads`);
  return uniqueLeads;
}

// Deduplicate leads
function deduplicateLeads(leads: Partial<InvestorLead>[]): Partial<InvestorLead>[] {
  const seen = new Set<string>();
  return leads.filter(lead => {
    const key = lead.email || lead.linkedInUrl || `${lead.fullName}-${lead.company}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Enrich lead with additional data
export async function enrichLead(lead: Partial<InvestorLead>): Promise<InvestorLead> {
  // Try to find email if missing
  if (!lead.email && lead.firstName && lead.lastName && lead.company) {
    lead.email = await findEmail(lead.firstName, lead.lastName, lead.company) || '';
  }

  // Search for recent news about the person/company
  try {
    const newsSearch = await apifyClient.actor('apify/google-search-scraper').call({
      queries: [`${lead.fullName} ${lead.company} news 2025 2026`],
      maxPagesPerQuery: 1,
      resultsPerPage: 3,
    });

    const { items } = await apifyClient.dataset(newsSearch.defaultDatasetId).listItems();
    const firstItem = items[0] as Record<string, any> | undefined;
    const recentNews = firstItem?.organicResults?.[0]?.title || null;
    
    if (recentNews) {
      lead.personalizedData = {
        ...lead.personalizedData,
        recentNews,
      };
    }
  } catch (error) {
    // Ignore enrichment errors
  }

  return lead as InvestorLead;
}

export default {
  collectAllLeads,
  scrapeLinkedInLeads,
  scrapeCrunchbaseInvestors,
  findEmail,
  enrichLead,
  MUSIC_INDUSTRY_SEARCH_CONFIGS,
};
