import { useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';

const TITRES = {
  '/': 'Dashboard',
  '/stock': 'Stock',
  '/vente': 'Vente & Activation',
  '/import': 'Import',
  '/apporteurs': 'Apporteurs',
  '/objectifs': 'Objectifs',
  '/sauvegarde': 'Sauvegarde & export',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { theme, basculer } = useTheme();
  const titre = TITRES[pathname] || 'Canal+ Stock Manager';

  return (
    <header className="h-16 flex items-center justify-between px-margin_desktop bg-surface-container-lowest border-b border-outline-variant shrink-0">
      <h1 className="font-page-title text-page-title text-on-surface">{titre}</h1>
      <button
        type="button"
        onClick={basculer}
        aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        className="p-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
