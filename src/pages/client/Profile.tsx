import { useClientAuth } from '../../contexts/ClientAuthContext';
import { Home, Route, User, LogOut, Phone, Mail, MapPin, Star } from 'lucide-react';
import { useState } from 'react';

export default function Profile() {
  const { user, signOut } = useClientAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-500 px-6 pt-8 pb-24">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <User className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {user?.user_metadata?.name || 'Utilisateur'}
          </h2>
          <p className="text-blue-100 text-sm">{user?.email}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 -mt-16 px-6 pb-24">
        <div className="max-w-md mx-auto">
          {/* Stats Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">0</div>
                <div className="text-xs text-slate-600 mt-1">Trajets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">0</div>
                <div className="text-xs text-slate-600 mt-1">FCFA</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-slate-900">0.0</span>
                  <Star className="w-4 h-4 text-yellow-500 ml-1" />
                </div>
                <div className="text-xs text-slate-600 mt-1">Note</div>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informations</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="w-5 h-5 text-slate-600" />
                <div>
                  <div className="text-xs text-slate-500">Téléphone</div>
                  <div className="text-sm font-medium text-slate-900">
                    {user?.user_metadata?.phone || 'Non renseigné'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="w-5 h-5 text-slate-600" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm font-medium text-slate-900">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <MapPin className="w-5 h-5 text-slate-600" />
                <div>
                  <div className="text-xs text-slate-500">Adresse</div>
                  <div className="text-sm font-medium text-slate-900">
                    {user?.user_metadata?.address || 'Non renseigné'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-white border-2 border-red-500 text-red-500 py-4 rounded-xl font-semibold shadow-sm hover:bg-red-50 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Se déconnecter</span>
          </button>
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
              onClick={() => setActiveTab('profile')}
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
