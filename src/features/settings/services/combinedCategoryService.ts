import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CombinedCategory } from '@/types';

const COLLECTION = 'combined_categories';

export const combinedCategoryService = {
  // Get all combined categories
  async getAll(): Promise<CombinedCategory[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as CombinedCategory[];
  },

  // Get combined category by ID
  async getById(id: string): Promise<CombinedCategory | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CombinedCategory;
    }
    return null;
  },

  // Create new combined category
  async create(data: { name: string; categoryIds: string[]; categoryNames: string[] }): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: data.name,
      categoryIds: data.categoryIds,
      categoryNames: data.categoryNames,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update combined category
  async update(
    id: string,
    data: Partial<{ name: string; categoryIds: string[]; categoryNames: string[] }>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete combined category
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },
};
