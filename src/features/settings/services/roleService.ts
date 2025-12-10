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
import type { Role, MenuPermission } from '@/types';

const COLLECTION = 'roles';

// Default system roles
export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Owner',
    description: 'Full access to all features',
    permissions: ['dashboard', 'products', 'categories', 'sales', 'brilink', 'reports', 'users', 'roles'],
    isSystem: true,
  },
  {
    name: 'Kasir',
    description: 'Access to sales and basic features',
    permissions: ['dashboard', 'sales', 'brilink'],
    isSystem: true,
  },
];

export const roleService = {
  // Get all roles
  async getAll(): Promise<Role[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Role[];
  },

  // Get role by ID
  async getById(id: string): Promise<Role | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Role;
    }
    return null;
  },

  // Create new role
  async create(data: { name: string; description?: string; permissions: MenuPermission[] }): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      name: data.name,
      description: data.description || '',
      permissions: data.permissions,
      isSystem: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update role
  async update(id: string, data: Partial<{ name: string; description: string; permissions: MenuPermission[] }>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete role
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Initialize default roles if they don't exist
  async initializeDefaultRoles(): Promise<void> {
    const existingRoles = await this.getAll();
    if (existingRoles.length === 0) {
      for (const role of DEFAULT_ROLES) {
        await this.create(role);
      }
    }
  },
};
