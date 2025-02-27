import { ApifyClient } from 'apify-client';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// Define the schema for industry contacts
export const industryContactSchema = z.object({
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

// Get Apify token from environment
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

// Initialize the ApifyClient
const apifyClient = new ApifyClient({
  token: APIFY_TOKEN,
});

/**
 * Extracts industry contacts using Apify web scraping
 * @param searchTerm What to search for (e.g., "Radio Publishing")
 * @param locality Location to search in (e.g., "Los Angeles")
 * @param maxPages Maximum number of pages to scrape
 * @param category Category to classify these contacts under
 * @returns Array of industry contacts
 */
export async function extractIndustryContacts(
  searchTerm: string,
  locality: string,
  maxPages: number = 1,
  category: 'radio' | 'tv' | 'movie' | 'publishing' | 'other' = 'other'
): Promise<IndustryContact[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Prepare Actor input
    const input = {
      "search": searchTerm,
      "locality": locality,
      "maxPages": maxPages,
      "proxyOptions": {
        "useApifyProxy": true,
        "apifyProxyGroups": [
          "BUYPROXIES94952"
        ]
      }
    };

    // Run the Actor and wait for it to finish
    const run = await apifyClient.actor("tz3kMHJE4vTnNSEf1").call(input);

    // Fetch results from the run's dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    // Process and validate the results
    const contacts: IndustryContact[] = [];
    
    for (const item of items) {
      try {
        // Transform Apify data to our schema
        const contact: IndustryContact = {
          name: item.name || 'Unknown',
          email: item.email || undefined,
          phone: item.phone || undefined,
          website: item.website || undefined,
          title: item.title || undefined,
          company: item.company || undefined,
          address: item.address || undefined,
          category,
          locality,
          notes: `Extracted from search: ${searchTerm}`,
          extractedAt: new Date(),
          userId: currentUser.uid
        };
        
        // Validate with zod
        const validatedContact = industryContactSchema.parse(contact);
        contacts.push(validatedContact);
        
        // Save to Firestore
        await saveContactToFirestore(validatedContact);
      } catch (error) {
        console.error('Error processing contact:', error);
      }
    }
    
    return contacts;
  } catch (error) {
    console.error('Error extracting contacts with Apify:', error);
    throw new Error('Failed to extract contacts. Please try again later.');
  }
}

/**
 * Saves a contact to Firestore
 * @param contact The industry contact to save
 * @returns Promise that resolves when the save is complete
 */
export async function saveContactToFirestore(contact: IndustryContact): Promise<void> {
  try {
    await addDoc(collection(db, 'industryContacts'), {
      ...contact,
      extractedAt: Timestamp.fromDate(contact.extractedAt)
    });
  } catch (error) {
    console.error('Error saving contact to Firestore:', error);
    throw new Error('Failed to save contact to database');
  }
}

/**
 * Gets saved industry contacts for a user
 * @param userId User ID to get contacts for
 * @param category Optional category filter
 * @returns Promise with array of contacts
 */
export async function getSavedContacts(
  userId: string,
  category?: 'radio' | 'tv' | 'movie' | 'publishing' | 'other'
): Promise<IndustryContact[]> {
  try {
    let contactsQuery;
    
    if (category) {
      contactsQuery = query(
        collection(db, 'industryContacts'),
        where('userId', '==', userId),
        where('category', '==', category)
      );
    } else {
      contactsQuery = query(
        collection(db, 'industryContacts'),
        where('userId', '==', userId)
      );
    }
    
    const snapshot = await getDocs(contactsQuery);
    const contacts: IndustryContact[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      contacts.push({
        ...data,
        extractedAt: data.extractedAt.toDate(),
      } as IndustryContact);
    });
    
    return contacts;
  } catch (error) {
    console.error('Error getting saved contacts:', error);
    throw new Error('Failed to retrieve saved contacts');
  }
}