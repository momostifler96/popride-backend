import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, Settings } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { adminUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {adminUser?.email}
                </p>
                <p className="text-xs text-slate-500">Administrateur</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Bienvenue sur votre tableau de bord
          </h2>
          <p className="text-slate-600">
            Gérez votre application depuis cette interface d'administration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">0</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Utilisateurs
            </h3>
            <p className="text-xs text-slate-500">
              Nombre total d'utilisateurs
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">0</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Projets
            </h3>
            <p className="text-xs text-slate-500">
              Projets actifs
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-slate-900">1</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Paramètres
            </h3>
            <p className="text-xs text-slate-500">
              Configurations actives
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Activité récente
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Connexion réussie
                </p>
                <p className="text-xs text-slate-500">
                  {adminUser?.email}
                </p>
              </div>
              <span className="text-xs text-slate-500">
                À l'instant
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
