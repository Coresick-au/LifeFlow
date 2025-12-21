import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { Moon, Sun } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all hover:opacity-80"
      style={{
        backgroundColor: 'var(--theme-bg-primary)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text-primary)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
      ) : (
        <Moon className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
      )}
    </button>
  );
};
