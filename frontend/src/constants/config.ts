export const CONFIG = {
  // Base URL pointing directly to the published Azure Functions FastAPI gateway
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://personalfinancegx-cgctcugsgtfgfpew.eastus2-01.azurewebsites.net/api',
  
  // Firebase configuration loaded from environment variables securely
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCOiuoNDZSVv81ZEMVK4kEXdUpCbp-g-I0',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'personalfinance-a0728.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'personalfinance-a0728',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'personalfinance-a0728.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '356935283197',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:356935283197:web:69ec3dd7b2eaf2ae30a994',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-BC1YE824L2'
  }
};
