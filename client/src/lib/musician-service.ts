import { db } from "./firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";

export interface Musician {
  id: string;
  title: string;
  photo: string;
  instrument: string;
  description: string;
  price: number;
  rating: number;
  totalReviews: number;
  genres: string[];
  category: string;
}

// Initial musicians data to populate Firestore if empty
const initialMusicians = [
  {
    title: "Alex Rivera",
    instrument: "Guitar",
    description: "Specialist in rock and blues with 15 years of experience. International band collaborations and over 500 studio sessions.",
    price: 120,
    rating: 4.9,
    totalReviews: 156,
    genres: ["Rock", "Blues", "Metal"],
    category: "Guitarist"
  },
  // ... add more initial musicians here
];

export async function getMusicians(): Promise<Musician[]> {
  try {
    const musiciansRef = collection(db, 'musicians');
    const snapshot = await getDocs(musiciansRef);

    // If no musicians exist, initialize with default data
    if (snapshot.empty) {
      console.log("Initializing musicians collection...");
      const musicians = await Promise.all(
        initialMusicians.map(async (musician) => {
          const docRef = await addDoc(musiciansRef, {
            ...musician,
            createdAt: serverTimestamp()
          });
          return {
            id: docRef.id,
            ...musician
          };
        })
      );
      return musicians;
    }

    // Return existing musicians
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Musician[];
  } catch (error) {
    console.error("Error fetching musicians:", error);
    throw error;
  }
}

export async function getMusicianById(id: string): Promise<Musician | null> {
  try {
    const musiciansRef = collection(db, 'musicians');
    const q = query(musiciansRef, where("id", "==", id));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Musician;
  } catch (error) {
    console.error("Error fetching musician:", error);
    throw error;
  }
}