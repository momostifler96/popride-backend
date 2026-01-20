import { useEffect } from 'react';
import { Bus, MapPin, Navigation, User, LogOut, Clock, CreditCard, Bell, List, Eye } from 'lucide-react';
import { useDriverAuth } from '../../contexts/DriverAuthContext';

export default function DriverHome() {
  const { user, session, loading, signOut } = useDriverAuth();

  useEffect(() => {
    if (!loading && !session) {
      window.location.href = '/driver/login';
    }
  }, [session, loading]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/driver/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
          <p className="text-slate-900 mb-4">Erreur: Profil chauffeur introuvable.</p>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  const modeLabel = user.mode === 'urbain' ? 'Urbain' : user.mode === 'interurbain' ? 'Interurbain' : 'Mixte';
  const modeColor = user.mode === 'urbain' ? 'bg-blue-100 text-blue-700' : user.mode === 'interurbain' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
  const statutColor = user.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">POP RIDE</h1>
                  <p className="text-xs text-slate-600">Espace Chauffeur</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.href = '/driver/notifications'}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6">
          <div className="max-w-md mx-auto space-y-4">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user.nom}</h2>
                    <p className="text-sm text-slate-600">{user.telephone}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${modeColor}`}>
                  {modeLabel}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutColor}`}>
                  {user.statut === 'actif' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-600">Courses aujourd'hui</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">0 FCFA</p>
                <p className="text-sm text-slate-600">Gains du jour</p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-slate-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                {user.mode !== 'interurbain' && (
                  <>
                    <button
                      onClick={() => window.location.href = '/driver/urban/active'}
                      className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-xl flex items-center justify-between transition-colors group shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-white">Course active</p>
                          <p className="text-xs text-blue-100">Voir ma course en cours</p>
                        </div>
                      </div>
                      <div className="text-white group-hover:translate-x-1 transition-transform">→</div>
                    </button>

                    <button
                      onClick={() => window.location.href = '/driver/urban/requests'}
                      className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">Demandes de courses</p>
                          <p className="text-xs text-slate-600">Accepter des courses</p>
                        </div>
                      </div>
                      <div className="text-blue-600 group-hover:translate-x-1 transition-transform">→</div>
                    </button>
                  </>
                )}

                {user.mode !== 'urbain' && (
                  <>
                    <button
                      onClick={() => window.location.href = '/driver/intercity/create'}
                      className="w-full p-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl flex items-center justify-between transition-colors group shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Bus className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-white">Créer un trajet</p>
                          <p className="text-xs text-green-100">Publier un nouveau trajet</p>
                        </div>
                      </div>
                      <div className="text-white group-hover:translate-x-1 transition-transform">→</div>
                    </button>

                    <button
                      onClick={() => window.location.href = '/driver/intercity/published'}
                      className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl flex items-center justify-between transition-colors group shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-white">Trajets publiés</p>
                          <p className="text-xs text-emerald-100">Gérer mes trajets actifs</p>
                        </div>
                      </div>
                      <div className="text-white group-hover:translate-x-1 transition-transform">→</div>
                    </button>

                    <button
                      onClick={() => window.location.href = '/driver/intercity/my-rides'}
                      className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <List className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900">Mes trajets</p>
                          <p className="text-xs text-slate-600">Voir et gérer mes trajets</p>
                        </div>
                      </div>
                      <div className="text-green-600 group-hover:translate-x-1 transition-transform">→</div>
                    </button>
                  </>
                )}

                <button
                  onClick={() => window.location.href = '/driver/history'}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-900">Historique</p>
                      <p className="text-xs text-slate-600">Voir vos courses passées</p>
                    </div>
                  </div>
                  <div className="text-slate-600 group-hover:translate-x-1 transition-transform">→</div>
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-start space-x-3">
                <Bus className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-2">Bienvenue sur POP RIDE</h3>
                  <p className="text-sm text-blue-100">
                    Commencez à accepter des courses et augmentez vos revenus. Restez en ligne pour recevoir des demandes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
