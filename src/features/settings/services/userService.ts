import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { roleService } from './roleService';
import type { User } from '@/types';

const COLLECTION = 'users';

export const userService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as User[];

    // Fetch role names
    const roles = await roleService.getAll();
    const roleMap = new Map(roles.map(r => [r.id, r.name]));
    
    return users.map(user => ({
      ...user,
      roleName: roleMap.get(user.roleId) || 'Unknown',
    }));
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const role = await roleService.getById(data.roleId);
      return {
        id: docSnap.id,
        ...data,
        roleName: role?.name || 'Unknown',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  },

  // Create new user (with Firebase Auth)
  async create(data: { email: string; password: string; name: string; roleId: string; isActive?: boolean }): Promise<string> {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;

    // Create Firestore user document
    await setDoc(doc(db, COLLECTION, uid), {
      email: data.email,
      name: data.name,
      roleId: data.roleId,
      isActive: data.isActive !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return uid;
  },

  // Update user
  async update(id: string, data: Partial<{ name: string; roleId: string; isActive: boolean }>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete user (only Firestore, not Auth)
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Get user permissions
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.getById(userId);
    if (!user) return [];
    
    const role = await roleService.getById(user.roleId);
    return role?.permissions || [];
  },
};
