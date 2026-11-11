import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, signInWithEmailAndPassword, signOut, User, sendPasswordResetEmail } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';
import { LocalStore } from './secureStore';

const PERSISTENT_CREDENTIALS_KEY = '@pf_persistent_auth_credentials';

// Initialize Firebase App
let app: any = null;
try {
  app = getApps().length === 0 ? initializeApp(CONFIG.FIREBASE) : getApp();
} catch (err) {
  console.error('Firebase initializeApp error:', err);
}

// Initialize Firebase Auth with React Native persistence to persist user logins
const auth = (() => {
  if (!app) return {} as any;
  try {
    if (typeof getReactNativePersistence === 'function') {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
    return getAuth(app);
  } catch {
    try {
      return getAuth(app);
    } catch (err) {
      console.error('Firebase getAuth error:', err);
      return {} as any;
    }
  }
})();

export { auth, User };

/**
 * Signs in user using Firebase client SDK and persists credentials for SSO until explicit logout
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await LocalStore.set(PERSISTENT_CREDENTIALS_KEY, { email, password });
  return userCredential.user;
};

/**
 * Attempts to silently restore a previously logged-in user session if not explicitly logged out
 */
export const tryRestoreSession = async (): Promise<User | null> => {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const saved = await LocalStore.get<{ email?: string; password?: string }>(PERSISTENT_CREDENTIALS_KEY);
    if (saved?.email && saved?.password) {
      const userCredential = await signInWithEmailAndPassword(auth, saved.email, saved.password);
      return userCredential.user;
    }
  } catch (err: any) {
    // Only clear stored credentials if they are explicitly rejected as invalid
    if (
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/wrong-password' ||
      err?.code === 'auth/user-disabled'
    ) {
      await LocalStore.remove(PERSISTENT_CREDENTIALS_KEY);
    }
    console.warn('Silent session restore failed:', err);
  }
  return null;
};

/**
 * Explicitly signs out user and clears persistent SSO credentials
 */
export const logoutUser = async (): Promise<void> => {
  await LocalStore.remove(PERSISTENT_CREDENTIALS_KEY);
  await signOut(auth);
};

/**
 * Sends a password reset email to the specified user email
 */
export const sendResetPasswordEmail = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};
