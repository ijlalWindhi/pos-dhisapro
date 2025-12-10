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
import type { Category } from '@/types';

const COLLECTION = 'categories';

export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Category[];
  },

  // Get active categories only
  async getActive(): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(c => c.isActive);
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Category;
    }
    return null;
  },

  // Create new category
  async create(data: { name: string; description?: string; isActive?: boolean }): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: data.name,
      description: data.description || '',
      isActive: data.isActive !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update category
  async update(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },
};
