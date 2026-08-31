// Posé sur <html> avant le premier rendu React pour éviter un flash clair→sombre.
// Chargé en tout premier dans index.html, avant main.jsx.
(function appliquerThemeInitial() {
  const choixSauvegarde = localStorage.getItem('theme');
  const preferenceSysteme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const sombre = choixSauvegarde ? choixSauvegarde === 'dark' : preferenceSysteme;
  document.documentElement.classList.toggle('dark', sombre);
})();
