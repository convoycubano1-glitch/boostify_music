import { z } from "zod";
import { getAuthToken } from "@/lib/auth";
import { User } from "firebase/auth";

/**
 * Schema for industry contacts
 */
export const contactSchema = z.object({
  name: z.string(),
  category: z.enum(["radio", "tv", "movie", "publishing", "other"]),
  title: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  locality: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  extractedAt: z.date().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional()
});

export type Contact = z.infer<typeof contactSchema>;

/**
 * Common contact categories
 */
export const contactCategories = [
  { value: "radio", label: "Radio Stations" },
  { value: "tv", label: "TV Networks" },
  { value: "movie", label: "Movie Industry" },
  { value: "publishing", label: "Publishing Houses" },
  { value: "other", label: "Other Contacts" }
];

/**
 * Parameters for contact extraction
 */
export interface ContactExtractParams {
  searchTerm: string;
  locality: string;
  category: 'radio' | 'tv' | 'movie' | 'publishing' | 'other';
  maxPages?: number;
}

/**
 * Response for contacts retrieval
 */
export interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  message?: string;
}

/**
 * Service class for handling contact extraction operations
 */
class ApifyContactsService {
  /**
   * Extract contacts using Apify based on search parameters
   */
  async extractContacts(params: ContactExtractParams): Promise<ContactsResponse> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch('/api/contacts/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          contacts: [],
          message: errorData.message || `Error: ${response.status} ${response.statusText}`
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error extracting contacts:", error);
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Get all contacts for the current user, optionally filtered by category
   */
  async getContacts(options?: { category?: string }): Promise<ContactsResponse> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const url = new URL('/api/contacts', window.location.origin);
      if (options?.category) {
        url.searchParams.append('category', options.category);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          contacts: [],
          message: errorData.message || `Error: ${response.status} ${response.statusText}`
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting contacts:", error);
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Search for contacts by query and category (uses demo data)
   */
  async searchContacts(query: string, category?: string): Promise<ContactsResponse> {
    try {
      const url = new URL('/api/contacts/search', window.location.origin);
      url.searchParams.append('q', query);
      if (category) {
        url.searchParams.append('category', category);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          contacts: [],
          message: errorData.message || `Error: ${response.status} ${response.statusText}`
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching contacts:", error);
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Save a contact to the user's collection
   */
  async saveContact(contact: Contact): Promise<ContactsResponse> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch('/api/contacts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contact })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          contacts: [],
          message: errorData.message || `Error: ${response.status} ${response.statusText}`
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving contact:", error);
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

export const apifyContactsService = new ApifyContactsService();