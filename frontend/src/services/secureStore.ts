import AsyncStorage from '@react-native-async-storage/async-storage';

export const LocalStore = {
  /**
   * Save a key-value pair in storage
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error writing to local storage key "${key}":`, error);
    }
  },

  /**
   * Retrieve a value from storage
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;
      
      // Attempt to parse JSON, if it fails, return the raw string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Error reading from local storage key "${key}":`, error);
      return null;
    }
  },

  /**
   * Delete a key from storage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error deleting local storage key "${key}":`, error);
    }
  },

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }
};
