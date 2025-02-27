import { Request, Response } from 'express';
import { Express } from 'express';
import { ApifyClient } from 'apify-client';
import { authenticate } from '../middleware/auth';
import { db as drizzleDb } from '@db';
import { db as firestoreDb } from '../firebase';
import { z } from 'zod';

// Define validation schema for request body
const contactExtractionSchema = z.object({
  searchTerm: z.string().min(1),
  locality: z.string().min(1),
  maxPages: z.number().int().min(1).max(5).default(1),
  category: z.enum(['radio', 'tv', 'movie', 'publishing', 'other']).default('other')
});

// Define the schema for industry contacts
const industryContactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
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
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
  
  // Initialize the ApifyClient
  const apifyClient = new ApifyClient({
    token: APIFY_TOKEN,
  });

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
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }
      
      const userId = req.user.uid;
      
      // Check if Apify token is available
      if (!APIFY_TOKEN) {
        return res.status(500).json({ 
          success: false, 
          message: 'Apify API token not configured. Please contact administrator.' 
        });
      }
      
      // Prepare Actor input
      const input = {
        "search": searchTerm,
        "locality": locality,
        "maxPages": maxPages,
        "proxyOptions": {
          "useApifyProxy": true,
          "apifyProxyGroups": ["BUYPROXIES94952"]
        }
      };

      // Run the Actor and wait for it to finish
      console.log(`Starting Apify actor run for search: ${searchTerm} in ${locality}`);
      const run = await apifyClient.actor("tz3kMHJE4vTnNSEf1").call(input);
      console.log(`Apify run completed, dataset ID: ${run.defaultDatasetId}`);

      // Fetch results from the run's dataset
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      console.log(`Retrieved ${items.length} contacts from Apify`);
      
      // Process and save the results
      const savedContacts = [];
      
      for (const item of items) {
        try {
          // Transform Apify data to our schema
          const contact: IndustryContact = {
            name: typeof item.name === 'string' ? item.name : 'Unknown',
            email: typeof item.email === 'string' ? item.email : undefined,
            phone: typeof item.phone === 'string' ? item.phone : undefined,
            website: typeof item.website === 'string' ? item.website : undefined,
            title: typeof item.jobTitle === 'string' ? item.jobTitle : 
                   typeof item.title === 'string' ? item.title : undefined,
            company: typeof item.company === 'string' ? item.company : undefined,
            address: typeof item.address === 'string' ? item.address : undefined,
            category,
            locality,
            notes: `Extracted from search: ${searchTerm}`,
            extractedAt: new Date(),
            userId
          };
          
          // Save to Firestore
          try {
            const contactRef = await firestoreDb.collection('industry_contacts').add(contact);
            console.log(`Saved contact to Firestore with ID: ${contactRef.id}`);
            
            // Add to the response array with the Firestore ID
            savedContacts.push({ ...contact, id: contactRef.id });
          } catch (firestoreError) {
            console.error('Error saving contact to Firestore:', firestoreError);
            // Still add to response array even if Firestore save fails
            savedContacts.push(contact);
          }
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
      
      try {
        // Build the Firestore query
        let contactsQuery = db.collection('industry_contacts').where('userId', '==', userId);
        
        // Add category filter if provided
        if (category) {
          contactsQuery = contactsQuery.where('category', '==', category);
        }
        
        // Execute the query
        const snapshot = await contactsQuery.get();
        
        // Convert query results to contacts array
        const contacts: IndustryContact[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as IndustryContact;
          contacts.push({
            ...data,
            id: doc.id,
            // Convert Firestore timestamp to Date if needed
            extractedAt: data.extractedAt instanceof Date ? 
              data.extractedAt : new Date(data.extractedAt.toDate())
          });
        });
        
        return res.status(200).json({ 
          success: true, 
          contacts 
        });
      } catch (dbError) {
        console.error('Firestore query error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving contacts from database',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        });
      }
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