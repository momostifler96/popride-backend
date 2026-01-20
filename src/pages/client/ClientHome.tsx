import { useClientAuth } from '../../contexts/ClientAuthContext';
import { Home, Route, User, MapPin, Bus } from 'lucide-react';
import { useState } from 'react';

export default function ClientHome() {
  const { user } = useClientAuth();
  const [activeTab, setActiveTab] = useState('home');

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-8 pb-4">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="w-7 h-7 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white text-center tracking-tight">POP RIDE</h1>
        <p className="text-center text-blue-100 text-sm mt-1">Votre transport, simplifié</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 px-6 pt-8 pb-24">
        <div className="max-w-md mx-auto">
          {/* Welcome Card */}
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-5 mb-8 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Bienvenue,</p>
                <p className="text-lg font-semibold text-slate-900">{user?.user_metadata?.name || 'Utilisateur'}</p>
              </div>
            </div>
          </div>

          {/* Service Cards */}
          <div className="space-y-4">
            <h2 className="text-white font-semibold text-lg mb-4 px-1">Choisissez votre trajet</h2>

            {/* Urban Card */}
            <button
              onClick={() => handleNavigate('/client/urban/search')}
              className="w-full bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-out active:scale-95"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Covoiturage Urbain</h3>
                  <p className="text-sm text-slate-600">Trajets en ville à tarif fixe</p>
                </div>
              </div>
            </button>

            {/* Intercity Card */}
            <button
              onClick={() => handleNavigate('/client/intercity/feed')}
              className="w-full bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-out active:scale-95"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bus className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Covoiturage Interurbain</h3>
                  <p className="text-sm text-slate-600">Voyages longue distance</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('home')}
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
              onClick={() => {
                setActiveTab('trips');
                handleNavigate('/client/trips');
              }}
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
