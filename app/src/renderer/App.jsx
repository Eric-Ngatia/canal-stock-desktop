import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Stock from './pages/Stock.jsx';
import VenteActivation from './pages/VenteActivation.jsx';
import Import from './pages/Import.jsx';
import Apporteurs from './pages/Apporteurs.jsx';
import Objectifs from './pages/Objectifs.jsx';
import Sauvegarde from './pages/Sauvegarde.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-auto p-margin_desktop">
          <div className="max-w-container_max_width mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/vente" element={<VenteActivation />} />
              <Route path="/import" element={<Import />} />
              <Route path="/apporteurs" element={<Apporteurs />} />
              <Route path="/objectifs" element={<Objectifs />} />
              <Route path="/sauvegarde" element={<Sauvegarde />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
