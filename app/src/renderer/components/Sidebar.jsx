import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, RadioTower, UploadCloud, Users, Target } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/vente', label: 'Vente & Activation', icon: RadioTower },
  { to: '/import', label: 'Import', icon: UploadCloud },
  { to: '/apporteurs', label: 'Apporteurs', icon: Users },
  { to: '/objectifs', label: 'Objectifs', icon: Target },
];

export default function Sidebar() {
  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col py-6 z-20">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
          <Package className="text-white" size={18} />
        </div>
        <div className="min-w-0">
          <div className="font-page-title text-page-title font-bold text-primary truncate">Canal+ Stock</div>
          <div className="font-label-metadata text-label-metadata text-secondary">Gestion décodeurs</div>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-subtitle text-subtitle transition-colors duration-200 ease-in-out ${
                isActive
                  ? 'bg-secondary-container text-primary border-l-4 border-primary'
                  : 'text-secondary hover:bg-surface-container-low'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
