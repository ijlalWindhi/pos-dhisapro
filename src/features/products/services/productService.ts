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
import { categoryService } from '@/features/settings/services/categoryService';
import type { Product } from '@/types';

const COLLECTION = 'products';

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];

    // Fetch category names
    const categories = await categoryService.getAll();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    return products.map(product => ({
      ...product,
      categoryName: categoryMap.get(product.categoryId) || '',
    }));
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    }
    return null;
  },

  // Create new product
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: data.name,
      sku: data.sku,
      categoryId: data.categoryId,
      categoryName: data.categoryName || '',
      price: data.price,
      buyPrice: data.buyPrice,
      stock: data.stock,
      minStock: data.minStock,
      unit: data.unit,
      isActive: data.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update product
  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Update stock
  async updateStock(id: string, quantity: number): Promise<void> {
    const product = await this.getById(id);
    if (product) {
      await this.update(id, { stock: product.stock + quantity });
    }
  },

  // Get low stock products
  async getLowStock(): Promise<Product[]> {
    const products = await this.getAll();
    return products.filter((p) => p.stock <= p.minStock && p.isActive);
  },

  // Search products
  async search(searchTerm: string): Promise<Product[]> {
    const products = await this.getAll();
    const term = searchTerm.toLowerCase();
    return products.filter(
      (p) => 
        p.name.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term)
    );
  },
};
