import { Request, Response } from 'express';
import { Express } from 'express';
import { ApifyClient } from 'apify-client';
import { authenticate } from '../middleware/auth';
import { db } from '@db';
import { z } from 'zod';
import { auth, db as firebaseDb } from '../firebase';

// Define validation schema for request body
const contactExtractionSchema = z.object({
  searchTerm: z.string().min(1),
  locality: z.string().min(1),
  maxPages: z.number().int().min(1).max(5).default(1),
  category: z.enum(['radio', 'tv', 'movie', 'publishing', 'other']).default('other')
});

// Define the schema for industry contacts
export const industryContactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.string()),
  title: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  category: z.enum(['radio', 'tv', 'movie', 'publishing', 'other']).default('other'),
  locality: z.string().optional(),
  notes: z.string().optional(),
  extractedAt: z.date().default(() => new Date()),
  userId: z.string()
});

export type IndustryContact = z.infer<typeof industryContactSchema>;

/**
 * Setup Apify related API routes
 */
export function setupApifyRoutes(app: Express) {
  // Get Apify token from environment
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
  
  if (!APIFY_TOKEN) {
    console.error('APIFY_API_TOKEN is not configured in environment variables');
  } else {
    console.log('APIFY_API_TOKEN is configured and ready for use');
  }
  
  // Initialize the ApifyClient with token from environment variables
  const getApifyClient = () => {
    // Always get a fresh token from environment to ensure we have the latest
    return new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
  };

  /**
   * Extract contacts using Apify and save to database
   * Protected route - requires authentication
   */
  app.post('/api/contacts/extract', authenticate, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = contactExtractionSchema.parse(req.body);
      const { searchTerm, locality, maxPages, category } = validatedData;
      
      // Ensure user is authenticated
      if (!req.user || !req.user.uid) {
        console.error('User not authenticated in /api/contacts/extract');
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      const userId = req.user.uid;
      console.log(`Processing contact extraction for user ${userId}`);
      
      // Check if Apify token is available
      if (!process.env.APIFY_API_TOKEN) {
        console.error('Apify API token not found in environment');
        return res.status(500).json({ 
          success: false, 
          message: 'Apify API token not configured. Please contact administrator.' 
        });
      }
      
      // Get the apify client
      const apifyClient = getApifyClient();
      
      // Prepare Actor input
      const input = {
        "search": searchTerm,
        "locality": locality,
        "maxPages": maxPages,
        "proxyOptions": {
          "useApifyProxy": true
        }
      };

      // Run the Actor and wait for it to finish
      console.log(`Starting Apify actor run for search: ${searchTerm} in ${locality}`);
      const run = await apifyClient.actor("apify/google-search-scraper").call(input);
      console.log(`Apify run completed, dataset ID: ${run.defaultDatasetId}`);

      // Fetch results from the run's dataset
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      console.log(`Retrieved ${items.length} contacts from Apify`);
      
      // Process and save the results
      const savedContacts = [];
      
      for (const item of items) {
        try {
          // Transform Apify data to our schema with proper string handling
          const contact: IndustryContact = {
            name: typeof item.name === 'string' ? item.name : 
                  typeof item.title === 'string' ? item.title : 'Unknown',
            email: typeof item.email === 'string' ? item.email : undefined,
            phone: typeof item.phone === 'string' ? item.phone : undefined,
            website: typeof item.website === 'string' ? item.website : 
                     typeof item.url === 'string' ? item.url : undefined,
            title: typeof item.jobTitle === 'string' ? item.jobTitle : 
                   typeof item.title === 'string' ? item.title : undefined,
            company: typeof item.company === 'string' ? item.company : 
                     typeof item.domain === 'string' ? item.domain : undefined,
            address: typeof item.address === 'string' ? item.address : locality,
            category,
            locality,
            notes: `Extracted from search: ${searchTerm}`,
            extractedAt: new Date(),
            userId
          };
        
          // Save to Firebase Firestore
          await firebaseDb.collection('industry_contacts').add({
            ...contact,
            extractedAt: new Date(),  // Convert Date to Firestore Timestamp
          });
          
          // Add to response array
          savedContacts.push(contact);
        } catch (error) {
          console.error('Error processing contact:', error);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Successfully extracted ${savedContacts.length} contacts`, 
        contacts: savedContacts 
      });
    } catch (error) {
      console.error('Error in contact extraction:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to extract contacts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * Get saved contacts for the authenticated user
   * Optionally filter by category
   */
  app.get('/api/contacts', authenticate, async (req: Request, res: Response) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      const userId = req.user.uid;
      const category = req.query.category as string;
      
      // Validate category if provided
      if (category && !['radio', 'tv', 'movie', 'publishing', 'other'].includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      
      // Query Firebase for contacts
      let query = firebaseDb.collection('industry_contacts').where('userId', '==', userId);
      
      // Add category filter if provided
      if (category) {
        query = query.where('category', '==', category);
      }
      
      // Execute query
      const snapshot = await query.get();
      
      // Format the results
      const contacts: IndustryContact[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        contacts.push({
          ...data,
          extractedAt: data.extractedAt.toDate(),
          id: doc.id
        } as IndustryContact);
      });
      
      return res.status(200).json({ 
        success: true, 
        contacts 
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch contacts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}