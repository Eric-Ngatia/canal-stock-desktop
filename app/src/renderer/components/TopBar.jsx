import { useLocation } from 'react-router-dom';

const TITRES = {
  '/': 'Dashboard',
  '/stock': 'Stock',
  '/vente': 'Vente & Activation',
  '/import': 'Import',
  '/apporteurs': 'Apporteurs',
  '/objectifs': 'Objectifs',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const titre = TITRES[pathname] || 'Canal+ Stock Manager';

  return (
    <header className="h-16 flex items-center px-margin_desktop bg-surface-container-lowest border-b border-outline-variant shrink-0">
      <h1 className="font-page-title text-page-title text-on-surface">{titre}</h1>
    </header>
  );
}
