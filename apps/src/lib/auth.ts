import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

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
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth, 
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
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth, 
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
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}