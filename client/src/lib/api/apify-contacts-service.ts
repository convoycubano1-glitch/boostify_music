import { z } from "zod";
import { db, auth } from "../../firebase";
import { collection, addDoc, getDocs, query, where, serverTimestamp, DocumentData } from "firebase/firestore";
import { User } from "firebase/auth";
import { getAuthToken } from "../../lib/auth";
import { ApifyClient } from "apify-client";

// Define contact schema
export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url().optional().or(z.string()),
  address: z.string().optional(),
  notes: z.string().optional(),
  category: z.enum(["radio", "tv", "movie", "publishing", "other"]).default("other"),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  locality: z.string().optional(),
  extractedAt: z.date().default(() => new Date()),
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCategories = [
  { value: "radio", label: "Radio" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "publishing", label: "Publishing" },
  { value: "other", label: "Other" }
];

/**
 * Retrieves extraction limits for the current user
 * @returns Promise containing remaining extractions and limit status
 */
export async function getExtractionLimits(): Promise<{ 
  remaining: number; 
  limitReached: boolean; 
  isAdmin: boolean 
}> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch('/api/contacts/limits', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching extraction limits: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      remaining: data.remaining || 0,
      limitReached: data.remaining <= 0,
      isAdmin: data.isAdmin || false
    };
  } catch (error) {
    console.error("Error getting extraction limits:", error);
    return {
      remaining: 0,
      limitReached: true,
      isAdmin: false
    };
  }
}

/**
 * Extract contacts through the Apify API 
 * @param searchTerm Term to search for
 * @param locality Geographic location to search in
 * @param category Category of contacts to search for
 * @param maxPages Maximum number of pages to crawl (admin only)
 * @returns Promise with extracted contacts
 */
// Get the Apify token from environment
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || import.meta.env.VITE_APIFY_API_TOKEN;

/**
 * Create a new ApifyClient instance with authentication
 * @returns A configured ApifyClient instance
 */
function getApifyClient() {
  if (!APIFY_TOKEN) {
    console.warn("No Apify token found. Direct API calls will not work.");
    return null;
  }
  return new ApifyClient({
    token: APIFY_TOKEN,
  });
}

/**
 * Extract contacts directly using the Apify API
 * This function can be used client-side as an alternative to the server API
 * @param searchTerm Term to search for
 * @param locality Geographic location to search in
 * @param category Category of contacts to search for
 * @param maxPages Maximum number of pages to crawl
 * @returns Promise with extracted contacts
 */
export async function extractContactsWithApify(
  searchTerm: string,
  locality: string,
  category: "radio" | "tv" | "movie" | "publishing" | "other",
  maxPages: number = 1
): Promise<Contact[]> {
  try {
    // First check if we have the API token before proceeding
    const apifyClient = getApifyClient();
    if (!apifyClient) {
      throw new Error("Apify API token not available");
    }
    
    // Build a search query that combines the search term, category, and locality
    const queryWithCategory = `${searchTerm} ${category} ${locality}`;
    
    // Start an actor run with the Google SERP crawler
    const actor = apifyClient.actor("apify/google-search-scraper");
    const runInfo = await actor.call({
      queries: [queryWithCategory],
      maxPagesPerQuery: maxPages,
      resultsPerPage: 10,
      mobileResults: false,
      languageCode: "",
      countryCode: "US",
      includeUnfilteredResults: false,
      saveHtml: false,
      saveHtmlToKeyValueStore: false,
      customDataFunction: `
        ({ input, $, request, response, html }) => {
          const results = $(".g");
          const extractedItems = [];
          
          results.each((index, el) => {
            const title = $(el).find("h3").text().trim();
            const url = $(el).find("a").first().attr("href");
            const description = $(el).find(".VwiC3b").text().trim();
            
            if (title && url) {
              extractedItems.push({
                title,
                url,
                description
              });
            }
          });
          
          return {
            extractedItems
          };
        }
      `
    });
    
    // Get the dataset items
    const { items } = await apifyClient.dataset(runInfo.defaultDatasetId).listItems();
    
    // Process and format the contacts
    const contacts: Contact[] = items.flatMap((item: any) => {
      const organicResults = item.organicResults || [];
      
      return organicResults.map((result: any) => {
        // Extract company and other details from the title and description
        const title = result.title || "";
        const snippet = result.description || "";
        const url = result.url || "";
        
        // Try to extract contact information
        const emailMatch = snippet.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
        const phoneMatch = snippet.match(/\+?[0-9\s()-]{10,}/);
        
        // Create a contact object
        const contact: Contact = {
          name: title.split(' - ')[0] || title,
          category: category,
          company: title.includes(' - ') ? title.split(' - ')[1] : '',
          website: url,
          email: emailMatch ? emailMatch[0] : undefined,
          phone: phoneMatch ? phoneMatch[0] : undefined,
          locality: locality,
          notes: snippet,
          extractedAt: new Date()
        };
        
        return contact;
      });
    });
    
    return contacts;
  } catch (error) {
    console.error("Error extracting contacts with Apify:", error);
    throw error;
  }
}

/**
 * Extract contacts through the server API route
 * @param searchTerm Term to search for
 * @param locality Geographic location to search in
 * @param category Category of contacts to search for
 * @param maxPages Maximum number of pages to crawl (admin only)
 * @returns Promise with extracted contacts
 */
export async function extractContacts(
  searchTerm: string,
  locality: string,
  category: "radio" | "tv" | "movie" | "publishing" | "other",
  maxPages: number = 1
): Promise<Contact[]> {
  try {
    // First try direct Apify API call if token is available
    if (getApifyClient()) {
      try {
        return await extractContactsWithApify(searchTerm, locality, category, maxPages);
      } catch (apiError) {
        console.warn("Direct Apify API call failed, falling back to server API:", apiError);
        // Fall back to server API
      }
    }
    
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch('/api/contacts/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        searchTerm,
        locality,
        maxPages,
        category
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(response.status === 429 
        ? "Extraction limit reached" 
        : `Error extracting contacts: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || "Error extracting contacts");
    }
    
    return data.contacts.map((contact: any) => ({
      ...contact,
      extractedAt: new Date(contact.extractedAt)
    }));
  } catch (error) {
    console.error("Error extracting contacts:", error);
    throw error;
  }
}

/**
 * Gets search suggestions based on partial query
 */
export async function searchContacts(category: string, query: string): Promise<Contact[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch(`/api/contacts/search?category=${category}&query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error searching contacts: ${response.status}`);
    }
    
    const data = await response.json();
    return data.contacts.map((contact: any) => ({
      ...contact,
      extractedAt: new Date(contact.extractedAt)
    }));
  } catch (error) {
    console.error("Error searching contacts:", error);
    
    // Fallback to local mock data if the API fails
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockContacts: Contact[] = [
      {
        name: "John Smith",
        email: "john@example.com",
        phone: "+1 555-123-4567",
        title: "Music Director",
        company: "KEXP Radio",
        category: "radio" as const,
        extractedAt: new Date()
      },
      {
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "+1 555-234-5678",
        title: "Licensing Manager",
        company: "Universal Pictures",
        category: "movie" as const,
        extractedAt: new Date()
      }
    ];
    
    return mockContacts.filter(contact => 
      contact.category === category && 
      (contact.name.toLowerCase().includes(query.toLowerCase()) || 
       contact.company?.toLowerCase().includes(query.toLowerCase()) ||
       contact.title?.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

/**
 * Saves a contact to the user's database
 * @param user Current Firebase user
 * @param contact Contact to save
 */
export async function saveContact(user: User, contact: Contact): Promise<void> {
  try {
    await addDoc(collection(db, "contacts"), {
      ...contact,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving contact:", error);
    throw new Error("Failed to save contact");
  }
}

/**
 * Gets all contacts saved by the current user
 * @param user Current Firebase user
 * @param category Optional category filter
 */
export async function getSavedContacts(user: User, category?: string): Promise<Contact[]> {
  try {
    let q = query(collection(db, "contacts"), where("userId", "==", user.uid));
    
    if (category) {
      q = query(q, where("category", "==", category));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Make sure we have all required fields and convert Firebase Timestamp to Date
      const contact: Contact = {
        name: data.name,
        category: data.category || 'other',
        extractedAt: data.extractedAt?.toDate() || new Date(),
        // Optional fields
        email: data.email,
        phone: data.phone,
        title: data.title,
        company: data.company,
        website: data.website,
        address: data.address,
        notes: data.notes,
        instagram: data.instagram,
        twitter: data.twitter,
        linkedin: data.linkedin,
        locality: data.locality,
        // Add ID for reference
        id: doc.id as any
      };
      return contact;
    });
  } catch (error) {
    console.error("Error getting saved contacts:", error);
    throw new Error("Failed to get saved contacts");
  }
}

/**
 * Check the status of an Apify web scraping run
 * @param runId ID of the Apify run to check
 */
export async function checkApifyRun(runId: string): Promise<any> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch('/api/contacts/run-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ runId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check run status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error checking Apify run:", error);
    throw error;
  }
}

/**
 * Reset extraction limits (admin only)
 */
export async function resetExtractionLimits(userId?: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }
    
    const response = await fetch('/api/contacts/reset-limits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset limits: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error resetting extraction limits:", error);
    return false;
  }
}