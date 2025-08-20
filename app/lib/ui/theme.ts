export type TelegramTheme = 'light' | 'dark';

export const getThemeColours = (theme: TelegramTheme) => ({
  bg: theme === 'light' ? 'bg-neutral-50' : 'bg-neutral-950',
  card: theme === 'light' ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800',
  text: theme === 'light' ? 'text-neutral-900' : 'text-neutral-100',
  textSecondary: theme === 'light' ? 'text-neutral-600' : 'text-neutral-400',
  accent: theme === 'light' ? 'bg-emerald-600' : 'bg-emerald-500',
  accentHover: theme === 'light' ? 'hover:bg-emerald-700' : 'hover:bg-emerald-600',
  danger: theme === 'light' ? 'bg-rose-600' : 'bg-rose-500',
  dangerHover: theme === 'light' ? 'hover:bg-rose-700' : 'hover:bg-rose-600',
  neutral: theme === 'light' ? 'bg-neutral-800' : 'bg-neutral-700',
  neutralHover: theme === 'light' ? 'hover:bg-neutral-700' : 'hover:bg-neutral-600',
});


