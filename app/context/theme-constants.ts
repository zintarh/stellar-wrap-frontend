export type ThemeColor = 'green' | 'pink' | 'yellow' | 'red' | 'purple';

export interface ThemeDefinition {
  name: string;
  primary: string;
  gradient: string;
}

export const themeColors: Record<ThemeColor, ThemeDefinition> = {
  green: {
    name: 'Spotify Green',
    primary: '#1DB954',
    gradient: 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)',
  },
  pink: {
    name: 'Neon Pink',
    primary: '#FF6B9D',
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%)',
  },
  yellow: {
    name: 'Electric Yellow',
    primary: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 100%)',
  },
  red: {
    name: 'Crimson Red',
    primary: '#FF0000', // Placeholder, checking original file next
    gradient: 'linear-gradient(135deg, #FF0000 0%, #FF4D4D 100%)',
  },
  purple: {
    name: 'Deep Purple',
    primary: '#9D4EDD',
    gradient: 'linear-gradient(135deg, #9D4EDD 0%, #C77DFF 100%)',
  }
};
