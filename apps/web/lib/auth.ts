import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseAvailable, getFirebaseAuth } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role?: 'GUEST' | 'WINERY_ADMIN';
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async createUser(data: CreateUserData): Promise<AuthUser> {
    if (!isFirebaseAvailable()) {
      throw new Error('Authentication service is not available. Please configure Firebase.');
    }
    
    try {
      const firebaseAuth = getFirebaseAuth();
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        firebaseAuth, 
        data.email, 
        data.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: data.displayName
      });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: data.displayName,
        photoURL: userCredential.user.photoURL
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signIn(data: SignInData): Promise<AuthUser> {
    if (!isFirebaseAvailable()) {
      throw new Error('Authentication service is not available. Please configure Firebase.');
    }
    
    try {
      const firebaseAuth = getFirebaseAuth();
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        firebaseAuth, 
        data.email, 
        data.password
      );
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async signOut(): Promise<void> {
    if (!isFirebaseAvailable()) {
      throw new Error('Authentication service is not available. Please configure Firebase.');
    }
    
    try {
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async resetPassword(email: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      throw new Error('Authentication service is not available. Please configure Firebase.');
    }
    
    try {
      const firebaseAuth = getFirebaseAuth();
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static getCurrentUser(): User | null {
    if (!isFirebaseAvailable()) {
      return null;
    }
    try {
      const firebaseAuth = getFirebaseAuth();
      return firebaseAuth.currentUser;
    } catch {
      return null;
    }
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    if (!isFirebaseAvailable()) {
      // Call callback immediately with null user if Firebase is not available
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
    try {
      const firebaseAuth = getFirebaseAuth();
      return firebaseAuth.onAuthStateChanged(callback);
    } catch {
      callback(null);
      return () => {};
    }
  }
}