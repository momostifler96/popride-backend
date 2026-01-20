import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, User, CreditCard, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/currency';

interface CompletedRide {
  id: string;
  date_course: string;
  client_nom: string;
  prix: number;
  statut: string;
  ligne_nom: string;
  arret_depart_nom: string;
  arret_arrivee_nom: string;
  heure_prise_en_charge: string | null;
  heure_arrivee: string | null;
}

export default function DriverHistory() {
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<CompletedRide[]>([]);
  const [error, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState<CompletedRide | null>(null);

  useEffect(() => {
    initializeDriver();
  }, []);

  const initializeDriver = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Auth error:', userError);
        window.location.href = '/driver/login';
        return;
      }

      const { data: chauffeurs, error: chauffeurError } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', user.id);

      if (chauffeurError) {
        console.error('Error fetching driver data (non-critical):', chauffeurError);
        setLoading(false);
        return;
      }

      const chauffeur = chauffeurs?.[0];
      if (chauffeur) {
        await fetchRideHistory(chauffeur.id);
      } else {
        console.warn('No driver record found for user_id:', user.id);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing driver (non-critical):', err);
      setLoading(false);
    }
  };

  const fetchRideHistory = async (driverId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('courses_urbaines')
        .select(`
          id,
          date_course,
          client_nom,
          prix,
          statut,
          heure_prise_en_charge,
          heure_arrivee,
          ligne:lignes_urbaines(nom),
          arret_depart:arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
          arret_arrivee:arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom)
        `)
        .eq('chauffeur_id', driverId)
        .eq('statut', 'terminee')
        .order('date_course', { ascending: false })
        .order('heure_arrivee', { ascending: false });

      if (fetchError) {
        console.error('Error fetching ride history (non-critical):', fetchError);
        setError('Erreur lors du chargement de l\'historique');
        setLoading(false);
        return;
      }

      if (data) {
        const ridesData: CompletedRide[] = data.map(ride => ({
          id: ride.id,
          date_course: ride.date_course,
          client_nom: ride.client_nom,
          prix: ride.prix,
          statut: ride.statut,
          ligne_nom: Array.isArray(ride.ligne) ? ride.ligne[0]?.nom : ride.ligne?.nom,
          arret_depart_nom: Array.isArray(ride.arret_depart) ? ride.arret_depart[0]?.nom : ride.arret_depart?.nom,
          arret_arrivee_nom: Array.isArray(ride.arret_arrivee) ? ride.arret_arrivee[0]?.nom : ride.arret_arrivee?.nom,
          heure_prise_en_charge: ride.heure_prise_en_charge,
          heure_arrivee: ride.heure_arrivee,
        }));
        setRides(ridesData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching ride history (non-critical):', err);
      setError('Erreur lors du chargement de l\'historique');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedRide) {
      setSelectedRide(null);
    } else {
      window.location.href = '/driver/home';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (selectedRide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Détails de la course</h1>
                <p className="text-xs text-slate-600">{formatDate(selectedRide.date_course)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white rounded-2xl shadow-xl p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Ligne
              </h3>
              <p className="text-lg font-semibold text-slate-900">{selectedRide.ligne_nom}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Client
              </h3>
              <p className="text-lg font-semibold text-slate-900">{selectedRide.client_nom}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Itinéraire
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 mb-1">Départ</p>
                    <p className="font-semibold text-slate-900">{selectedRide.arret_depart_nom}</p>
                  </div>
                </div>

                <div className="flex items-center pl-5">
                  <div className="w-0.5 h-8 bg-slate-200"></div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 mb-1">Arrivée</p>
                    <p className="font-semibold text-slate-900">{selectedRide.arret_arrivee_nom}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Horaires
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Prise en charge</span>
                  <span className="font-semibold text-slate-900">{formatTime(selectedRide.heure_prise_en_charge)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Arrivée</span>
                  <span className="font-semibold text-slate-900">{formatTime(selectedRide.heure_arrivee)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm">Prix de la course</span>
                </div>
                <span className="text-2xl font-bold">{formatPrice(selectedRide.prix)}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Historique des courses</h1>
              <p className="text-xs text-slate-600">{rides.length} course{rides.length !== 1 ? 's' : ''} terminée{rides.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
              {error}
            </div>
          )}

          {rides.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune course terminée</h3>
              <p className="text-slate-600">
                Vos courses terminées apparaîtront ici
              </p>
            </div>
          ) : (
            rides.map((ride) => (
              <button
                key={ride.id}
                onClick={() => setSelectedRide(ride)}
                className="w-full bg-white rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl hover:scale-[1.02] text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-900">
                        {formatDate(ride.date_course)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{ride.ligne_nom}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{formatPrice(ride.prix)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-700">{ride.arret_depart_nom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-700">{ride.arret_arrivee_nom}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{ride.client_nom}</span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Voir détails →</span>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
