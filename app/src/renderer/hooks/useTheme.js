import { useCallback, useEffect, useState } from 'react';

// L'état initial vient de la classe déjà posée sur <html> par theme-init.js (seule source de
// vérité au premier rendu, pour rester cohérent avec ce qui a été affiché avant que React ne
// monte).
function lireThemeInitial() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(lireThemeInitial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const basculer = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, basculer };
}
