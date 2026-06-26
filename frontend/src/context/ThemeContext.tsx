import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColor } from '../constants/theme';
import { LocalStore } from '../services/secureStore';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  colors: Record<ThemeColor, string>;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: Colors.dark,
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeMode>('dark'); // Default to dark mode as requested

  useEffect(() => {
    // Load theme setting from persistence
    const loadThemeSetting = async () => {
      const savedTheme = await LocalStore.get<ThemeMode>('theme_preference');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      } else if (systemScheme === 'light') {
        setTheme('light');
      }
    };
    loadThemeSetting();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    await LocalStore.set('theme_preference', nextTheme);
  };

  const colors = Colors[theme];
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
