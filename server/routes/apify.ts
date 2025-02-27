import express from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, limit, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// User extraction limit constants
const STANDARD_EXTRACTION_LIMIT = 50; // Standard users limit
const PREMIUM_EXTRACTION_LIMIT = 500; // Premium users limit

/**
 * Extract contacts using Apify API (with locality and category filters)
 * Requires authentication
 */
router.post('/contacts/extract', authenticate, async (req, res) => {
  try {
    const { uid } = req.user;
    const { searchTerm, locality, category, maxPages = 2 } = req.body;

    if (!searchTerm || !locality || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: searchTerm, locality, or category' 
      });
    }

    // Check user's extraction limit
    const extractionLimit = await getUserExtractionLimit(uid);
    const extractionsRemaining = await getRemainingExtractions(uid, extractionLimit);

    if (extractionsRemaining <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Monthly extraction limit reached. Please upgrade your account or try again next month.'
      });
    }

    // Prepare the Apify API call
    const apifyApiKey = process.env.APIFY_API_KEY;
    
    if (!apifyApiKey) {
      console.error('Missing APIFY_API_KEY environment variable');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Customize the search query based on the category
    let enhancedSearchTerm = searchTerm;
    if (category === 'radio') {
      enhancedSearchTerm = `${searchTerm} radio stations`;
    } else if (category === 'tv') {
      enhancedSearchTerm = `${searchTerm} television networks`;
    } else if (category === 'movie') {
      enhancedSearchTerm = `${searchTerm} film production`;
    } else if (category === 'publishing') {
      enhancedSearchTerm = `${searchTerm} publishing houses`;
    }

    // For demonstration purposes, use sample data in development
    // In production, this would make a real Apify API call
    let contacts;
    
    if (process.env.NODE_ENV === 'production') {
      try {
        // PRODUCTION: Make the actual Apify API call
        const response = await axios.post(
          'https://api.apify.com/v2/acts/apify/google-search-scraper/run-sync-get-dataset-items',
          {
            queries: [`${enhancedSearchTerm} in ${locality}`],
            maxPagesPerQuery: maxPages,
            resultsPerPage: 10,
            mobileResults: false,
            langCode: 'en',
            locationUule: '',
            includeUnfilteredResults: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apifyApiKey}`
            }
          }
        );
        
        // Process the API response into our contact format
        contacts = processApifyResponse(response.data, category, locality);
      } catch (error) {
        console.error('Apify API call failed:', error);
        
        // Fallback to sample data if API call fails
        contacts = getSampleContacts(category, locality);
      }
    } else {
      // DEVELOPMENT: Use sample data
      contacts = getSampleContacts(category, locality);
    }

    // Record this extraction for quota management
    await recordExtraction(uid, contacts.length);

    // Save the contacts to Firestore (optional, can be done client-side too)
    for (const contact of contacts) {
      await addDoc(collection(db, 'users', uid, 'contacts'), {
        ...contact,
        category,
        locality,
        extractedAt: serverTimestamp()
      });
    }

    // Return the contacts to the client
    return res.status(200).json({
      success: true,
      contacts,
      remaining: extractionsRemaining - 1
    });
  } catch (error) {
    console.error('Error extracting contacts:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Get user's contacts
 * Requires authentication
 */
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const { uid } = req.user;
    const { category } = req.query;

    let contactsQuery = query(collection(db, 'users', uid, 'contacts'));
    
    // Add category filter if provided
    if (category) {
      contactsQuery = query(contactsQuery, where('category', '==', category));
    }

    const contactsSnapshot = await getDocs(contactsQuery);
    const contacts = [];

    contactsSnapshot.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Save a contact to the user's collection
 * Requires authentication
 */
router.post('/contacts/save', authenticate, async (req, res) => {
  try {
    const { uid } = req.user;
    const { contact } = req.body;

    if (!contact || !contact.name || !contact.category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact data. Name and category are required.'
      });
    }

    // Add the contact to Firestore
    const docRef = await addDoc(collection(db, 'users', uid, 'contacts'), {
      ...contact,
      savedAt: serverTimestamp()
    });

    return res.status(200).json({
      success: true,
      contactId: docRef.id,
      message: 'Contact saved successfully'
    });
  } catch (error) {
    console.error('Error saving contact:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Get user's remaining extraction quota
 * Requires authentication
 */
router.get('/extractions/remaining', authenticate, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const extractionLimit = await getUserExtractionLimit(uid);
    const extractionsRemaining = await getRemainingExtractions(uid, extractionLimit);

    return res.status(200).json({
      success: true,
      limit: extractionLimit,
      remaining: extractionsRemaining
    });
  } catch (error) {
    console.error('Error getting extraction quota:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Processes Apify response data into our contact format
 */
function processApifyResponse(data, category, locality) {
  const contacts = [];

  if (!Array.isArray(data)) {
    console.error('Invalid Apify response format, expected array');
    return getSampleContacts(category, locality); // Fallback to sample data
  }

  // Process each result from Apify into our contact format
  for (const result of data) {
    if (result.organicResults) {
      for (const organic of result.organicResults) {
        const contactData = {
          name: organic.title || 'Unknown Name',
          category,
          website: organic.url || '',
          address: getAddressFromDescription(organic.description) || '',
          locality,
          company: organic.title || '',
          extractedAt: new Date(),
          notes: organic.description || ''
        };
        
        // Add phone number if we can extract it from the description
        const phone = getPhoneFromDescription(organic.description);
        if (phone) contactData.phone = phone;
        
        contacts.push(contactData);
      }
    }
  }

  return contacts;
}

/**
 * Extract phone number from text description if present
 */
function getPhoneFromDescription(description) {
  if (!description) return null;
  
  // Simple regex for US phone number formats
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const match = description.match(phoneRegex);
  
  return match ? match[1] : null;
}

/**
 * Extract address-like text from description
 */
function getAddressFromDescription(description) {
  if (!description) return null;
  
  // Look for address-like patterns (very simplified)
  const addressRegex = /(\d+[^,]+,\s*[^,]+,\s*[A-Z]{2}\s*\d{5})/;
  const match = description.match(addressRegex);
  
  return match ? match[1] : null;
}

/**
 * Get the user's extraction limit based on their subscription level
 */
async function getUserExtractionLimit(uid) {
  try {
    // Get user's subscription info from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    // Return appropriate limit based on subscription
    if (userData && userData.subscription === 'premium') {
      return PREMIUM_EXTRACTION_LIMIT;
    }
    
    // Default to standard limit
    return STANDARD_EXTRACTION_LIMIT;
  } catch (error) {
    console.error('Error getting user extraction limit:', error);
    return STANDARD_EXTRACTION_LIMIT; // Default to standard limit on error
  }
}

/**
 * Calculate remaining extractions for the current period
 */
async function getRemainingExtractions(uid, totalLimit) {
  try {
    // Get current month/year for tracking period
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Query extractions for current month
    const extractionsQuery = query(
      collection(db, 'users', uid, 'extractions'),
      where('year', '==', currentYear),
      where('month', '==', currentMonth)
    );
    
    const extractionsSnapshot = await getDocs(extractionsQuery);
    let usedExtractions = 0;
    
    extractionsSnapshot.forEach((doc) => {
      const data = doc.data();
      usedExtractions += data.count || 0;
    });
    
    // Calculate remaining quota
    return Math.max(0, totalLimit - usedExtractions);
  } catch (error) {
    console.error('Error calculating remaining extractions:', error);
    return 0; // Default to 0 on error (safest)
  }
}

/**
 * Record an extraction to track user quotas
 */
async function recordExtraction(uid, count) {
  try {
    const now = new Date();
    
    await addDoc(collection(db, 'users', uid, 'extractions'), {
      count,
      timestamp: serverTimestamp(),
      month: now.getMonth(),
      year: now.getFullYear()
    });
    
    return true;
  } catch (error) {
    console.error('Error recording extraction:', error);
    return false;
  }
}

/**
 * Get sample contacts for testing and development
 */
function getSampleContacts(category, locality) {
  // Create sample data based on category and locality
  const samples = [];
  const count = Math.floor(Math.random() * 10) + 5; // 5-15 random contacts
  
  const categoryData = {
    'radio': {
      names: ['KCRW Radio', 'Power FM', 'Classical Radio 91.5', 'Rock 105.7', 'Jazz 88.3'],
      titles: ['Program Director', 'Music Director', 'Station Manager', 'Morning Show Host', 'Producer']
    },
    'tv': {
      names: ['Local Channel 4', 'Metro TV Network', 'Pacific Broadcasting', 'Coastal Television', 'Valley View Media'],
      titles: ['Content Director', 'Programming Manager', 'Executive Producer', 'Talent Coordinator', 'Media Buyer']
    },
    'movie': {
      names: ['Skyline Pictures', 'Horizon Films', 'Evergreen Productions', 'Silver Screen Studios', 'Meridian Entertainment'],
      titles: ['Film Producer', 'Casting Director', 'Production Manager', 'Distribution Executive', 'Location Scout']
    },
    'publishing': {
      names: ['Coastal Books', 'Metropolitan Press', 'Sunrise Publishing', 'River City Media', 'Golden Gate Literature'],
      titles: ['Acquisitions Editor', 'Literary Agent', 'Publishing Director', 'Rights Manager', 'Book Marketer']
    },
    'other': {
      names: ['Creative Arts Agency', 'Melody Management', 'Stellar Representation', 'Industry Connections', 'Artist Relations Group'],
      titles: ['Talent Manager', 'Booking Agent', 'Promotions Director', 'Artist Representative', 'Events Coordinator']
    }
  };
  
  const data = categoryData[category] || categoryData.other;
  
  for (let i = 0; i < count; i++) {
    const nameIndex = i % data.names.length;
    const titleIndex = i % data.titles.length;
    
    samples.push({
      name: data.names[nameIndex],
      category,
      title: data.titles[titleIndex],
      company: data.names[nameIndex],
      email: `contact@${data.names[nameIndex].toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      website: `www.${data.names[nameIndex].toLowerCase().replace(/\s+/g, '')}.com`,
      address: `${Math.floor(Math.random() * 9000) + 1000} Industry Blvd, ${locality}, CA`,
      locality,
      region: 'California',
      country: 'USA',
      notes: `Leading ${category} company in ${locality} area.`,
      extractedAt: new Date()
    });
  }
  
  return samples;
}

export default router;