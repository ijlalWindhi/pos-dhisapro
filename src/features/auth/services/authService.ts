import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { roleService } from '@/features/settings/services/roleService';
import type { User } from '@/types';

export const authService = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Try to get existing user data, or create new user document
    let userData = await this.getUserData(firebaseUser.uid);
    
    if (!userData) {
      // Initialize default roles if needed
      await roleService.initializeDefaultRoles();
      const roles = await roleService.getAll();
      const ownerRole = roles.find(r => r.name === 'Owner') || roles[0];
      
      // Create user document if it doesn't exist
      const newUser: Omit<User, 'id'> = {
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        roleId: ownerRole?.id || '',
        isActive: true,
        createdAt: new Date(),
      };
      
      await this.setUserData(firebaseUser.uid, newUser);
      userData = { id: firebaseUser.uid, ...newUser };
    }
    
    // Check if user is active
    if (!userData.isActive) {
      // Sign out the user immediately
      await this.signOut();
      throw new Error('Akun Anda tidak aktif. Silakan hubungi administrator.');
    }
    
    return userData;
  },

  // Sign out
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  },

  // Get user data from Firestore
  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: userDoc.id,
          email: data.email,
          name: data.name,
          roleId: data.roleId || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Create or update user data
  async setUserData(uid: string, data: Omit<User, 'id'>): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        isActive: data.isActive,
        createdAt: data.createdAt,
      });
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get user from Firebase Auth directly (fallback when Firestore is unavailable)
  getUserFromFirebaseAuth(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      roleId: '',
      isActive: true,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    };
  },
};
