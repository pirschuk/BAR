import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { IconButton } from './ui/Button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <IconButton
      icon={theme === 'dark' ? Sun : Moon}
      label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      onClick={toggle}
    />
  );
}
