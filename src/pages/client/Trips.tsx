import { Home, Route, User, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function Trips() {
  const [activeTab, setActiveTab] = useState('trips');

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Mes trajets</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pb-24">
        <div className="max-w-md mx-auto">
          {/* Tabs */}
          <div className="flex space-x-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
            <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm transition-all">
              En cours
            </button>
            <button className="flex-1 py-2 px-4 text-slate-600 hover:bg-slate-50 rounded-lg font-medium text-sm transition-all">
              Terminés
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun trajet en cours</h3>
            <p className="text-sm text-slate-600 mb-6">
              Commencez votre premier voyage avec POP RIDE
            </p>
            <button
              onClick={() => handleNavigate('/client/home')}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Réserver un trajet
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => {
                setActiveTab('home');
                handleNavigate('/client/home');
              }}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Accueil</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'trips'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Route className="w-6 h-6" />
              <span className="text-xs font-medium">Mes trajets</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                handleNavigate('/client/profile');
              }}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Profil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
