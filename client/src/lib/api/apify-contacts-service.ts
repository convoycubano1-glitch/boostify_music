import { z } from 'zod';
import { getAuthToken } from '@/lib/auth';

export const contactSchema = z.object({
  id: z.string().optional(),
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
  extractedAt: z.date(),
  userId: z.string()
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCategories = [
  { value: 'radio', label: 'Radio Stations' },
  { value: 'tv', label: 'TV Networks' },
  { value: 'movie', label: 'Film Industry' },
  { value: 'publishing', label: 'Publishing Houses' },
  { value: 'other', label: 'Other Contacts' }
];

interface ExtractContactsParams {
  searchTerm: string;
  locality: string;
  category: 'radio' | 'tv' | 'movie' | 'publishing' | 'other';
  maxPages?: number;
}

interface GetContactsParams {
  category?: 'radio' | 'tv' | 'movie' | 'publishing' | 'other';
}

interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  message?: string;
}

class ApifyContactsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await fetch(endpoint, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async extractContacts(params: ExtractContactsParams): Promise<ContactsResponse> {
    try {
      const response = await this.request<ContactsResponse>('/api/contacts/extract', {
        method: 'POST',
        body: JSON.stringify({
          searchTerm: params.searchTerm,
          locality: params.locality,
          category: params.category,
          maxPages: params.maxPages || 2
        })
      });
      
      return response;
    } catch (error) {
      console.error('Error extracting contacts:', error);
      
      // Return a fallback empty response
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : 'Failed to extract contacts'
      };
    }
  }

  async getContacts(params: GetContactsParams = {}): Promise<ContactsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.category) {
        queryParams.append('category', params.category);
      }

      const endpoint = `/api/contacts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request<ContactsResponse>(endpoint);
      
      return response;
    } catch (error) {
      console.error('Error getting contacts:', error);
      
      // Return a fallback empty response
      return {
        success: false,
        contacts: [],
        message: error instanceof Error ? error.message : 'Failed to retrieve contacts'
      };
    }
  }

  async searchContacts(query: string, category?: string): Promise<Contact[]> {
    try {
      const queryParams = new URLSearchParams({ q: query });
      if (category) {
        queryParams.append('category', category);
      }

      const endpoint = `/api/contacts/search?${queryParams.toString()}`;
      const response = await this.request<{ contacts: Contact[] }>(endpoint);
      
      return response.contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }
}

export const apifyContactsService = new ApifyContactsService();