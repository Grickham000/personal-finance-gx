import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(CONFIG.FIREBASE) : getApp();

// Initialize Firebase Auth with React Native persistence to persist user logins
const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch {
    // Fallback if already initialized (hot reload)
    return getAuth(app);
  }
})();

export { auth, User };

/**
 * Signs in user using Firebase client SDK
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Signs out user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
