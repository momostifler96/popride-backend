import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, UserCircle, Car, Navigation, MapPin, TrendingUp, Activity, Clock } from 'lucide-react';
import Header from '../components/Header';

interface Stats {
  chauffeursActifs: number;
  clientsActifs: number;
  coursesEnCours: number;
  trajetsActifs: number;
}

interface ActivityData {
  day: string;
  courses: number;
}

export default function DashboardHome() {
  const { adminUser } = useAuth();
  const [stats, setStats] = useState<Stats>({
    chauffeursActifs: 0,
    clientsActifs: 0,
    coursesEnCours: 0,
    trajetsActifs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData] = useState<ActivityData[]>([
    { day: 'Lun', courses: 12 },
    { day: 'Mar', courses: 19 },
    { day: 'Mer', courses: 15 },
    { day: 'Jeu', courses: 25 },
    { day: 'Ven', courses: 22 },
    { day: 'Sam', courses: 30 },
    { day: 'Dim', courses: 18 },
  ]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [chauffeurs, clients, courses, trajets] = await Promise.all([
        supabase.from('chauffeurs').select('id', { count: 'exact', head: true }),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('trajets_interurbains').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        chauffeursActifs: chauffeurs.count || 0,
        clientsActifs: clients.count || 0,
        coursesEnCours: courses.count || 0,
        trajetsActifs: trajets.count || 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCourses = Math.max(...activityData.map(d => d.courses));

  return (
    <div>
      <Header
        title="Dashboard"
        description="Vue d'ensemble de la plateforme de transport"
      />

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.chauffeursActifs}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Actifs</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Chauffeurs actifs
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Disponibles en temps réel
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.clientsActifs}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>En ligne</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Clients actifs
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Utilisateurs connectés
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Car className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.coursesEnCours}
                </div>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  <span>En cours</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Courses urbaines
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Trajets en progression
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-violet-100 p-3 rounded-lg">
                <Navigation className="w-6 h-6 text-violet-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? '-' : stats.trajetsActifs}
                </div>
                <div className="flex items-center text-xs text-violet-600 mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  <span>Actifs</span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Trajets interurbains
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Longue distance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Activité de la semaine
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Nombre de courses par jour
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Activity className="w-4 h-4" />
                <span>7 derniers jours</span>
              </div>
            </div>

            <div className="flex items-end justify-between h-64 gap-4">
              {activityData.map((data, index) => {
                const height = (data.courses / maxCourses) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div className="text-sm font-semibold text-slate-900 mb-2">
                        {data.courses}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-700 hover:to-blue-500"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-3 font-medium">
                      {data.day}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Chauffeurs en ligne
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-600">Live</span>
              </div>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Chauffeur #{index + 1}
                      </p>
                      <p className="text-xs text-slate-500">Zone {index + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-slate-600">Actif</span>
                  </div>
                </div>
              ))}

              {stats.chauffeursActifs === 0 && !loading && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Aucun chauffeur en ligne</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Les chauffeurs actifs apparaîtront ici
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Activité récente
            </h3>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <UserCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Connexion administrateur
                  </p>
                  <p className="text-xs text-slate-500">{adminUser?.email}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">À l'instant</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Système opérationnel
                  </p>
                  <p className="text-xs text-slate-500">
                    Tous les services fonctionnent correctement
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Maintenant</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
