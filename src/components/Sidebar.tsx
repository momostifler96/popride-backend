import { useState } from 'react';
import { LayoutDashboard, Bus, MapPin, DollarSign, Car, Navigation, Users, UserCircle, AlertTriangle, LogOut, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const [covoiturageUrbainOpen, setCovoiturageUrbainOpen] = useState(true);

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 shadow-lg overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs text-slate-400">Transport Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Dashboard</span>
        </button>

        <div>
          <button
            onClick={() => setCovoiturageUrbainOpen(!covoiturageUrbainOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Bus className="w-5 h-5" />
              <span className="text-sm font-medium">Covoiturage urbain</span>
            </div>
            {covoiturageUrbainOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {covoiturageUrbainOpen && (
            <div className="ml-4 mt-1 space-y-1">
              <button
                onClick={() => onNavigate('lignes')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 'lignes'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span className="text-sm">Lignes</span>
              </button>

              <button
                onClick={() => onNavigate('arrets')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 'arrets'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Arrêts</span>
              </button>

              <button
                onClick={() => onNavigate('tarifs')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 'tarifs'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Tarifs</span>
              </button>

              <button
                onClick={() => onNavigate('courses')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 'courses'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Car className="w-4 h-4" />
                <span className="text-sm">Courses</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('interurbain')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'interurbain'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-sm font-medium">Covoiturage interurbain</span>
        </button>

        <button
          onClick={() => onNavigate('chauffeurs')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'chauffeurs'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Chauffeurs</span>
        </button>

        <button
          onClick={() => onNavigate('categories')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'categories'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-sm font-medium">Catégories véhicules</span>
        </button>

        <button
          onClick={() => onNavigate('clients')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'clients'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Clients</span>
        </button>

        <button
          onClick={() => onNavigate('signalements')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            currentPage === 'signalements'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Signalements</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
