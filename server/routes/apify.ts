import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { ApifyClient } from 'apify-client';
import { authenticate } from '../middleware/auth';
import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';

// Schema for industry contacts
export const industryContactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  locality: z.string().optional(),
  notes: z.string().optional(),
  category: z.enum(['radio', 'tv', 'movie', 'publishing', 'other']),
  extractedAt: z.date()
});

export type IndustryContact = z.infer<typeof industryContactSchema>;

/**
 * Setup Apify related API routes
 */
export function setupApifyRoutes(app: Express) {
  /**
   * Extract contacts using Apify and save to database
   * Protected route - requires authentication
   */
  app.post('/api/contacts/extract', authenticate, async (req: Request, res: Response) => {
    try {
      const { searchTerm, locality, category, maxPages = 2 } = req.body;
      
      if (!searchTerm || !locality || !category) {
        return res.status(400).json({ 
          success: false, 
          message: 'Search term, locality, and category are required' 
        });
      }
      
      // Get authenticated user
      const user = req.user;
      
      if (!user || !user.uid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Check extraction limit
      const contactsRef = collection(db, 'industryContacts');
      const q = query(
        contactsRef,
        where('userId', '==', user.uid),
        where('category', '==', category)
      );
      
      const snapshot = await getDocs(q);
      const currentCount = snapshot.size;
      
      // You can adjust this limit or make it configurable per user
      const maxExtractions = 100;
      
      if (currentCount >= maxExtractions) {
        return res.status(403).json({
          success: false,
          message: `You've reached the maximum limit of ${maxExtractions} extractions for ${category} contacts`
        });
      }
      
      // Initialize Apify client
      const apifyClient = new ApifyClient({
        token: process.env.APIFY_API_TOKEN,
      });
      
      // Run the web scraper actor
      const run = await apifyClient.actor('apify/web-scraper').call({
        startUrls: [{ url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm + ' in ' + locality)}` }],
        maxRequestsPerCrawl: maxPages * 10,
        maxCrawlingDepth: 2,
        pageFunction: `async function pageFunction(context) {
          const { request, log, $, enqueueRequest } = context;
          const title = $('title').text();
          
          log.info(\`Page opened: \${title}\`);
          
          // Extract relevant data from Google search results
          const results = [];
          
          $('.g').each(function() {
            const titleElement = $(this).find('h3');
            const link = $(this).find('a').first().attr('href');
            const snippet = $(this).find('.IsZvec').text();
            
            // Try to extract contact information
            const phoneMatch = snippet.match(/[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}/);
            const emailMatch = snippet.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}/);
            
            if (titleElement.length > 0) {
              results.push({
                name: titleElement.text().trim(),
                url: link,
                description: snippet,
                email: emailMatch ? emailMatch[0] : undefined,
                phone: phoneMatch ? phoneMatch[0] : undefined
              });
            }
          });
          
          // Enqueue next page if available
          const nextPageLink = $('a#pnnext').attr('href');
          if (nextPageLink) {
            await enqueueRequest({ url: \`https://www.google.com\${nextPageLink}\` });
          }
          
          return { results };
        }`
      });
      
      // Get dataset items
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      
      // Process and save contacts
      const contacts: IndustryContact[] = [];
      
      for (const item of items) {
        if (item.results && Array.isArray(item.results)) {
          for (const result of item.results) {
            // Create a contact object
            const contact: IndustryContact = {
              name: result.name || 'Unknown',
              category: category,
              userId: user.uid,
              extractedAt: new Date(),
              email: result.email,
              phone: result.phone,
              website: result.url,
              locality: locality,
              notes: result.description,
              title: result.title,
              company: result.company,
              address: result.address
            };
            
            // Save to Firestore
            await addDoc(collection(db, 'industryContacts'), {
              ...contact,
              extractedAt: serverTimestamp(),
            });
            
            contacts.push(contact);
          }
        }
      }
      
      res.json({ 
        success: true, 
        contacts,
        message: `Successfully extracted ${contacts.length} contacts`
      });
    } catch (error) {
      console.error('Error extracting contacts with Apify:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  });
  
  /**
   * Get saved contacts for the authenticated user
   * Optionally filter by category
   */
  app.get('/api/contacts', authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      
      if (!user || !user.uid) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const { category } = req.query;
      const contactsRef = collection(db, 'industryContacts');
      
      let q;
      if (category) {
        q = query(
          contactsRef,
          where('userId', '==', user.uid),
          where('category', '==', category)
        );
      } else {
        q = query(
          contactsRef,
          where('userId', '==', user.uid)
        );
      }
      
      const snapshot = await getDocs(q);
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        extractedAt: doc.data().extractedAt?.toDate() || new Date()
      }));
      
      res.json({
        success: true,
        contacts
      });
    } catch (error) {
      console.error('Error getting contacts:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });
  
  /**
   * Search contacts API - provides a simplified search functionality
   * This endpoint can be public since it only returns sample data for demo purposes
   */
  app.get('/api/contacts/search', async (req: Request, res: Response) => {
    try {
      const { q: query = '', category } = req.query;
      
      // Return sample contacts for demo purposes
      // In a production app, you would search a database or connect to a real API
      const sampleContacts = [
        {
          id: '1',
          name: 'ABC Radio Station',
          email: 'contact@abcradio.com',
          phone: '123-456-7890',
          website: 'https://www.abcradio.com',
          category: 'radio',
          locality: 'New York',
          extractedAt: new Date()
        },
        {
          id: '2',
          name: 'XYZ TV Network',
          email: 'info@xyztv.com',
          phone: '234-567-8901',
          website: 'https://www.xyztv.com',
          category: 'tv',
          locality: 'Los Angeles',
          extractedAt: new Date()
        },
        {
          id: '3',
          name: 'Blockbuster Studios',
          email: 'licensing@blockbuster.com',
          phone: '345-678-9012',
          website: 'https://www.blockbusterstudios.com',
          category: 'movie',
          locality: 'Hollywood',
          extractedAt: new Date()
        },
        {
          id: '4',
          name: 'Songwriters Publishing Co.',
          email: 'rights@songwriters.com',
          phone: '456-789-0123',
          website: 'https://www.songwriterspublishing.com',
          category: 'publishing',
          locality: 'Nashville',
          extractedAt: new Date()
        }
      ];
      
      // Filter by query and category if provided
      let filteredContacts = sampleContacts;
      
      if (query) {
        const searchStr = String(query).toLowerCase();
        filteredContacts = filteredContacts.filter(contact => 
          contact.name.toLowerCase().includes(searchStr) || 
          contact.email?.toLowerCase().includes(searchStr) ||
          contact.locality?.toLowerCase().includes(searchStr)
        );
      }
      
      if (category) {
        filteredContacts = filteredContacts.filter(contact => 
          contact.category === category
        );
      }
      
      res.json({
        success: true,
        contacts: filteredContacts
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  });
}