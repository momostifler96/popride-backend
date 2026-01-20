import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, User, CreditCard, CheckCircle, Navigation, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/currency';

interface ActiveRide {
  id: string;
  ligne_nom: string;
  arret_depart_nom: string;
  arret_arrivee_nom: string;
  client_nom: string;
  client_telephone: string;
  prix: number;
  date_course: string;
  statut_trajet: string | null;
}

export default function DriverUrbanActive() {
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [chauffeurId, setChauffeurId] = useState<string | null>(null);

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
      }

      const chauffeur = chauffeurs?.[0];
      if (chauffeur) {
        setChauffeurId(chauffeur.id);
        await fetchActiveRide(chauffeur.id);
      } else {
        console.warn('No driver record found for user_id:', user.id);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing driver (non-critical):', err);
      setLoading(false);
    }
  };

  const fetchActiveRide = async (driverId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('courses_urbaines')
        .select(`
          id,
          prix,
          client_nom,
          client_telephone,
          date_course,
          statut_trajet,
          ligne:lignes_urbaines(nom),
          arret_depart:arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
          arret_arrivee:arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom)
        `)
        .eq('chauffeur_id', driverId)
        .eq('statut', 'en_cours')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching active ride (non-critical):', fetchError);
        setError('Erreur lors du chargement de la course');
      }

      if (data) {
        const rideData: ActiveRide = {
          id: data.id,
          ligne_nom: Array.isArray(data.ligne) ? data.ligne[0]?.nom : data.ligne?.nom,
          arret_depart_nom: Array.isArray(data.arret_depart) ? data.arret_depart[0]?.nom : data.arret_depart?.nom,
          arret_arrivee_nom: Array.isArray(data.arret_arrivee) ? data.arret_arrivee[0]?.nom : data.arret_arrivee?.nom,
          client_nom: data.client_nom,
          client_telephone: data.client_telephone,
          prix: data.prix,
          date_course: data.date_course,
          statut_trajet: data.statut_trajet,
        };
        setRide(rideData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching active ride (non-critical):', err);
      setError('Erreur lors du chargement de la course');
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!ride) return;

    setProcessing(true);
    setError('');

    try {
      const updates: any = {
        statut_trajet: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'en_route' && !ride.statut_trajet) {
        updates.heure_depart_chauffeur = new Date().toISOString();
      } else if (newStatus === 'arrive_depart') {
        updates.heure_arrivee_depart = new Date().toISOString();
      } else if (newStatus === 'en_trajet') {
        updates.heure_prise_en_charge = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update(updates)
        .eq('id', ride.id);

      if (updateError) {
        console.error('Error updating ride status (non-critical):', updateError);
        setError('Erreur lors de la mise à jour du statut');
        setProcessing(false);
        return;
      }

      setRide({ ...ride, statut_trajet: newStatus });
      setProcessing(false);
    } catch (err: any) {
      console.error('Error updating ride status (non-critical):', err);
      setError('Erreur lors de la mise à jour du statut');
      setProcessing(false);
    }
  };

  const endRide = async () => {
    if (!ride) return;

    setProcessing(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update({
          statut: 'terminee',
          statut_trajet: 'arrive_destination',
          heure_arrivee: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', ride.id);

      if (updateError) {
        console.error('Error ending ride (non-critical):', updateError);
        setError('Erreur lors de la fin de course');
        setProcessing(false);
        return;
      }

      window.location.href = '/driver/urban/requests';
    } catch (err: any) {
      console.error('Error ending ride (non-critical):', err);
      setError('Erreur lors de la fin de course');
      setProcessing(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/driver/home';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!ride) {
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
                <h1 className="text-xl font-bold text-slate-900">Course en cours</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune course active</h3>
            <p className="text-slate-600 mb-6">
              Vous n'avez pas de course en cours
            </p>
            <button
              onClick={() => window.location.href = '/driver/urban/requests'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Voir les demandes
            </button>
          </div>
        </main>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (ride.statut_trajet) {
      case 'en_route':
        return {
          label: 'En route vers le point de départ',
          color: 'bg-blue-100 text-blue-700',
          icon: Navigation,
          nextAction: 'Confirmer l\'arrivée au départ',
          nextStatus: 'arrive_depart',
        };
      case 'arrive_depart':
        return {
          label: 'Arrivé au point de départ',
          color: 'bg-amber-100 text-amber-700',
          icon: Clock,
          nextAction: 'Démarrer le trajet',
          nextStatus: 'en_trajet',
        };
      case 'en_trajet':
        return {
          label: 'En trajet vers la destination',
          color: 'bg-emerald-100 text-emerald-700',
          icon: Navigation,
          nextAction: 'Confirmer l\'arrivée',
          nextStatus: 'arrive_destination',
        };
      case 'arrive_destination':
        return {
          label: 'Arrivé à destination',
          color: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          nextAction: null,
          nextStatus: null,
        };
      default:
        return {
          label: 'En attente',
          color: 'bg-slate-100 text-slate-700',
          icon: Clock,
          nextAction: 'Démarrer la course',
          nextStatus: 'en_route',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

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
              <h1 className="text-xl font-bold text-slate-900">Course en cours</h1>
              <p className="text-xs text-slate-600">{ride.ligne_nom}</p>
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

          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 ${statusInfo.color.replace('text', 'bg').replace('100', '200')} rounded-full flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Statut</p>
                <p className="font-bold text-slate-900">{statusInfo.label}</p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-white rounded-2xl shadow-xl p-5">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Client
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-600">Nom</p>
                <p className="font-semibold text-slate-900">{ride.client_nom}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Téléphone</p>
                <p className="font-semibold text-slate-900">{ride.client_telephone}</p>
              </div>
            </div>
          </div>

          {/* Route Info */}
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
                  <p className="font-semibold text-slate-900">{ride.arret_depart_nom}</p>
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
                  <p className="font-semibold text-slate-900">{ride.arret_arrivee_nom}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6" />
                <span className="text-sm">Prix de la course</span>
              </div>
              <span className="text-2xl font-bold">{formatPrice(ride.prix)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {statusInfo.nextAction && statusInfo.nextStatus && (
              <button
                onClick={() => updateStatus(statusInfo.nextStatus!)}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg"
              >
                {processing ? 'Traitement...' : statusInfo.nextAction}
              </button>
            )}

            {ride.statut_trajet === 'arrive_destination' && (
              <button
                onClick={endRide}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg"
              >
                {processing ? 'Traitement...' : 'Terminer la course'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
