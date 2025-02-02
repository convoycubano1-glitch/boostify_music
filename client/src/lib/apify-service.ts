import { z } from 'zod';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';

// Define la estructura de datos esperada de la API de Apollo
interface ApolloResult {
  name?: string;
  email?: string;
  organization?: {
    name?: string;
  };
  title?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  category: z.string(),
  socialMedia: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional()
  }).optional(),
  userId: z.string().optional(),
  savedAt: z.date().optional()
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCategories = [
  'Sellos Discográficos',
  'Medios de Comunicación',
  'Promotores de Eventos',
  'Managers',
  'Agencias de PR',
  'Influencers Musicales',
  'Blogs de Música',
  'Radio',
  'Plataformas Streaming'
] as const;

// Lista de contactos locales precargada desde el CSV
const localContacts: Contact[] = [
  {
    name: "Andres Shaq",
    email: "andreshaq@yahoo.com",
    phone: "+573175746775",
    category: "Managers"
  },
  {
    name: "Bulin 47",
    email: "stomlinantonio@gmail.com",
    phone: "+18293557754",
    category: "Artistas"
  },
  // ... más contactos del CSV
];

export async function searchContacts(category: string, query: string): Promise<Contact[]> {
  try {
    if (!import.meta.env.VITE_APIFY_API_KEY) {
      // Si no hay API key, devolver solo resultados locales filtrados
      return localContacts.filter(contact => 
        (category === 'Todos' || contact.category === category) &&
        (contact.name.toLowerCase().includes(query.toLowerCase()) ||
         contact.email?.toLowerCase().includes(query.toLowerCase()) ||
         contact.company?.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Si hay API key, combinar resultados locales con búsqueda en Apify
    const response = await fetch('https://api.apify.com/v2/acts/jljBwyyQakqrL1wae/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APIFY_API_KEY}`
      },
      body: JSON.stringify({
        url: `https://app.apollo.io/#/people?finderViewId=5b8050d050a3893c382e9360&page=1&sortByField=recommendations_score`,
        totalRecords: 100,
        getWorkEmails: true,
        getPersonalEmails: true,
        searchQuery: `${category} ${query} music industry`,
        filters: {
          industryTags: ['Music', 'Entertainment', 'Media']
        }
      })
    });

    if (!response.ok) {
      throw new Error('Error al buscar contactos');
    }

    const runData = await response.json();
    const datasetId = runData.data.defaultDatasetId;

    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${import.meta.env.VITE_APIFY_API_KEY}`
    );

    if (!itemsResponse.ok) {
      throw new Error('Error al obtener resultados');
    }

    const items = await itemsResponse.json() as ApolloResult[];
    const apifyContacts = items.map(item => ({
      name: item.name || 'Unknown',
      email: item.email,
      company: item.organization?.name,
      role: item.title,
      category: category,
      socialMedia: {
        linkedin: item.linkedin,
        twitter: item.twitter,
        instagram: item.instagram
      }
    }));

    // Combinar y filtrar resultados locales y de Apify
    return [...localContacts, ...apifyContacts].filter(contact => 
      (category === 'Todos' || contact.category === category) &&
      (contact.name.toLowerCase().includes(query.toLowerCase()) ||
       contact.email?.toLowerCase().includes(query.toLowerCase()) ||
       contact.company?.toLowerCase().includes(query.toLowerCase()))
    );

  } catch (error) {
    console.error('Error en la búsqueda de contactos:', error);
    // En caso de error, devolver solo resultados locales filtrados
    return localContacts.filter(contact => 
      (category === 'Todos' || contact.category === category) &&
      (contact.name.toLowerCase().includes(query.toLowerCase()) ||
       contact.email?.toLowerCase().includes(query.toLowerCase()) ||
       contact.company?.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export async function saveContact(user: User, contact: Contact): Promise<void> {
  if (!user?.uid) {
    throw new Error('Usuario no autenticado');
  }

  const contactData = {
    ...contact,
    userId: user.uid,
    savedAt: new Date()
  };

  const contactRef = doc(collection(db, 'contacts'));
  await setDoc(contactRef, contactData);
}

export async function getSavedContacts(user: User): Promise<Contact[]> {
  if (!user?.uid) {
    throw new Error('Usuario no autenticado');
  }

  const contactsRef = collection(db, 'contacts');
  const q = query(contactsRef, where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    ...doc.data() as Contact,
    id: doc.id
  }));
}

export async function checkApifyRun(runId: string): Promise<any> {
  const response = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${import.meta.env.VITE_APIFY_API_TOKEN}`
  );

  if (!response.ok) {
    throw new Error('Error al verificar el estado del proceso de vistas');
  }

  return response.json();
}